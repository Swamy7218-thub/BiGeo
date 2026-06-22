"""
BiGeo Daily Intelligence Agent.

Runs once a day on an EventBridge schedule. Pulls fresh items from a handful
of free RSS/Atom feeds (supply chain news, funding, AI/arXiv research),
asks Bedrock Claude to synthesize them into a short, high-signal strategy
briefing for BiGeo, and emails the result via SES.

Deliberately not a search/crawl platform: no OpenSearch, no dashboard, no
multi-channel bots. One Lambda, one schedule, one email.
"""

import hashlib
import json
import os
import re
import urllib.request
from datetime import datetime, timezone
from xml.etree import ElementTree as ET

import boto3

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")
SES_SENDER = os.environ["SES_SENDER"]
SES_RECIPIENT = os.environ["SES_RECIPIENT"]
DDB_TABLE = os.environ["SEEN_ITEMS_TABLE"]
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")

FEEDS = [
    ("FreightWaves", "https://www.freightwaves.com/news/feed"),
    ("Supply Chain Dive", "https://www.supplychaindive.com/feeds/news/"),
    ("TechCrunch", "https://techcrunch.com/feed/"),
    ("VentureBeat AI", "https://venturebeat.com/category/ai/feed/"),
]

ARXIV_QUERY = (
    "http://export.arxiv.org/api/query?search_query=cat:cs.AI+AND+"
    "(abs:logistics+OR+abs:%22supply+chain%22+OR+abs:routing)"
    "&sortBy=submittedDate&sortOrder=descending&max_results=8"
)

BIGEO_CONTEXT = """
BiGeo: AI-powered geocoding API resolving unstructured/landmark-based rural
Indian addresses to GPS in under 2 seconds. Customers: logistics (RTO
reduction), rural fintech (KYC/address verification), government schemes.
Stage: pre-seed, ~Rs 4.75L raised, raising Rs 1-2Cr. Known direct competitor:
Delhivery's in-house Naksha LLM/AddFix (patented, carrier-locked). Free
substitute to beat: Google Plus Codes / India's DIGIPIN (govt, rolling out
nationally within ~18 months). Real comparable proving the business model:
OkHi (Kenya, $4.36M raised, fintech customers). Strategy: sell to logistics
players who can't build Delhivery's stack themselves, and to rural
fintech/ONDC sellers; build a delivery-outcome feedback loop as the real
long-term moat (not just public address datasets, which anyone can copy).
"""


def _fetch(url: str, timeout: int = 10) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "BiGeo-Intel-Agent/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _strip_tags(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


def fetch_rss_items(source: str, url: str, limit: int = 6) -> list[dict]:
    try:
        raw = _fetch(url)
        root = ET.fromstring(raw)
    except Exception as exc:  # feed unreachable or malformed — skip, don't fail the run
        print(f"[warn] feed failed: {source}: {exc}")
        return []

    items = []
    for item in root.iter("item"):
        title = item.findtext("title", default="").strip()
        link = item.findtext("link", default="").strip()
        desc = _strip_tags(item.findtext("description", default=""))[:300]
        if title and link:
            items.append({"source": source, "title": title, "link": link, "summary": desc})
        if len(items) >= limit:
            break
    return items


def fetch_arxiv_items(limit: int = 6) -> list[dict]:
    try:
        raw = _fetch(ARXIV_QUERY)
        root = ET.fromstring(raw)
    except Exception as exc:
        print(f"[warn] arxiv fetch failed: {exc}")
        return []

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    items = []
    for entry in root.findall("atom:entry", ns):
        title = (entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
        link_el = entry.find("atom:id", ns)
        link = link_el.text.strip() if link_el is not None else ""
        summary = _strip_tags(entry.findtext("atom:summary", default="", namespaces=ns))[:300]
        if title and link:
            items.append({"source": "arXiv", "title": title, "link": link, "summary": summary})
        if len(items) >= limit:
            break
    return items


def filter_unseen(items: list[dict], table) -> list[dict]:
    """Drop items already emailed in a prior run (30-day TTL dedup)."""
    unseen = []
    for it in items:
        key = hashlib.sha256(it["link"].encode()).hexdigest()
        it["_key"] = key
        resp = table.get_item(Key={"item_key": key})
        if "Item" not in resp:
            unseen.append(it)
    return unseen


def mark_seen(items: list[dict], table) -> None:
    ttl = int(datetime.now(timezone.utc).timestamp()) + 30 * 86400
    for it in items:
        table.put_item(Item={"item_key": it["_key"], "expires_at": ttl})


def build_digest_text(items: list[dict]) -> str:
    lines = []
    for it in items:
        lines.append(f"- [{it['source']}] {it['title']} — {it['summary']} ({it['link']})")
    return "\n".join(lines) if lines else "(no fresh items today)"


PROMPT_TEMPLATE = """You are BiGeo's Chief Strategy Officer, with the judgment of a top-tier
strategy consultant and operator. You write ONE short daily briefing email
for the founder. Be ruthlessly concise — this is read in under 5 minutes
on a phone. No filler, no generic advice, no padding to hit a word count.

Company context:
{context}

Today's raw source material (logistics/supply-chain news, funding, AI/arXiv
research — may be sparse on a quiet day, that's fine, do not invent items):
{digest}

Write the email body as clean HTML (a series of <h2>/<p>/<ul> blocks, NO
<html>/<head>/<body> wrapper, NO inline CSS — that's added separately).
Sections, in this order, SKIP any section with nothing genuinely new or
actionable to say today rather than padding it:

<h2>Executive Summary</h2> — 2-3 sentences max: biggest event/risk/opportunity today, only if something material happened.

<h2>Worth Your Attention</h2> — only items from the source material that are actually relevant to BiGeo's space (logistics, supply chain, address/geocoding, rural fintech, relevant AI releases or papers). One line each: what happened, why it matters to BiGeo specifically. Omit irrelevant noise entirely.

<h2>Action Items</h2> — at most 3, only if something today genuinely warrants action. Each one sentence, specific ("X happened, therefore do Y"), not generic startup advice.

If there is truly nothing material today, say so briefly in the Executive Summary and skip the rest. Never fabricate news, funding amounts, or events not present in the source material above.
"""


def synthesize(items: list[dict], bedrock) -> str:
    prompt = PROMPT_TEMPLATE.format(context=BIGEO_CONTEXT.strip(), digest=build_digest_text(items))
    resp = bedrock.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1200,
                "messages": [{"role": "user", "content": prompt}],
            }
        ),
    )
    body = json.loads(resp["body"].read())
    return body["content"][0]["text"]


EMAIL_WRAPPER = """<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#080B14;">
<div style="max-width:640px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#E5E7EB;background:#080B14;">
<div style="border-bottom:2px solid #FF6600;padding-bottom:12px;margin-bottom:24px;">
<span style="color:#FF6600;font-weight:700;font-size:20px;">BiGeo</span>
<span style="color:#00D1FF;font-size:13px;float:right;margin-top:6px;">{date}</span>
</div>
<div style="font-size:15px;line-height:1.6;">
{body}
</div>
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #1F2937;color:#6B7280;font-size:12px;">
Daily Intelligence Briefing &middot; BiGeo &middot; auto-generated, verify before acting on funding/competitor figures
</div>
</div>
</body></html>"""


def style_headings(html: str) -> str:
    html = html.replace("<h2>", '<h2 style="color:#00D1FF;font-size:16px;margin:24px 0 8px;">')
    html = html.replace("<ul>", '<ul style="padding-left:18px;margin:8px 0;">')
    html = html.replace("<p>", '<p style="margin:8px 0;">')
    return html


def send_email(html_body: str, ses) -> None:
    date_str = datetime.now(timezone.utc).strftime("%a, %d %b %Y")
    full_html = EMAIL_WRAPPER.format(date=date_str, body=style_headings(html_body))
    ses.send_email(
        Source=SES_SENDER,
        Destination={"ToAddresses": [SES_RECIPIENT]},
        Message={
            "Subject": {"Data": f"BiGeo Daily Briefing — {date_str}"},
            "Body": {"Html": {"Data": full_html}},
        },
    )


def handler(event, context):
    dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
    table = dynamodb.Table(DDB_TABLE)
    bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)
    ses = boto3.client("ses", region_name=AWS_REGION)

    items = []
    for source, url in FEEDS:
        items.extend(fetch_rss_items(source, url))
    items.extend(fetch_arxiv_items())

    fresh_items = filter_unseen(items, table)
    html_body = synthesize(fresh_items, bedrock)
    send_email(html_body, ses)
    mark_seen(fresh_items, table)

    return {"statusCode": 200, "items_considered": len(items), "items_fresh": len(fresh_items)}
