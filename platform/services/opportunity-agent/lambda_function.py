"""
BiGeo/AcquaHT Global Opportunity Discovery Agent.

Runs once a day on an EventBridge schedule, separate from the news
intel-agent. Bedrock doesn't expose Anthropic's native web_search server
tool, so this implements web search as a custom Converse tool: Claude
requests searches, the Lambda executes them against DuckDuckGo's HTML
endpoint (no API key) and feeds results back, looped until Claude has
enough to write the briefing. Tiers opportunities by Indian-founder
eligibility and emails the result via SES.

Deliberately independent of intel-agent: different data source (live web
search, not RSS), different objective (funding/partnership opportunities,
not news). Never merge the two.
"""

import json
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "apac.anthropic.claude-3-7-sonnet-20250219-v1:0")
SES_SENDER = os.environ["SES_SENDER"]
SES_RECIPIENT = os.environ["SES_RECIPIENT"]
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")

FOUNDER_PROFILE = """
Founder: Indian citizen, based in Hyderabad, Telangana. Runs two startups:

1. BiGeo — AI-powered geocoding API resolving unstructured/landmark-based
   rural Indian addresses to GPS in under 2 seconds. Customers: logistics
   (RTO reduction), rural fintech (KYC/address verification), government
   schemes/ONDC. Stage: pre-seed, ~Rs 4.75L raised (MeitY GENESIS + IIT
   Hyderabad), raising Rs 1-2Cr.
2. AcquaHT Labs — deep-tech (early stage).

Existing validation / credentials already held (do NOT re-recommend these
exact programs, look for the next tier up): MeitY GENESIS, MeitY TIDE 2.0,
IIT Hyderabad BUILD, NVIDIA Inception, Microsoft Founders Hub, T-Hub,
RKVY-RAFTAAR, Boeing Regional Finalist, IIT Bombay Eureka Finalist, IIM
Shillong Winner, Harvard Aspire Leaders, Mercedes-Benz beVisioneers
Fellow, UNDP Citi Youth Co National Top 50, UN Global Compact
Participant, World Bank New Horizons Delegate.
"""

WEB_SEARCH_TOOL = {
    "toolSpec": {
        "name": "web_search",
        "description": "Search the live web. Returns titles, URLs, and snippets for the top results.",
        "inputSchema": {
            "json": {
                "type": "object",
                "properties": {"query": {"type": "string", "description": "Search query"}},
                "required": ["query"],
            }
        },
    }
}


def web_search(query: str, limit: int = 6) -> str:
    url = "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": query})
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (BiGeo-Opportunity-Agent)"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as exc:
        return f"[search failed for '{query}': {exc}]"

    results = []
    for m in re.finditer(
        r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?class="result__snippet"[^>]*>(.*?)</a>',
        html,
        re.S,
    ):
        raw_url, title, snippet = m.groups()
        link = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query).get("uddg", [raw_url])[0]
        title = re.sub(r"<[^>]+>", "", title).strip()
        snippet = re.sub(r"<[^>]+>", "", snippet).strip()
        if title and link:
            results.append(f"- {title}\n  {link}\n  {snippet}")
        if len(results) >= limit:
            break

    return "\n".join(results) if results else f"[no results for '{query}']"


PROMPT_TEMPLATE = """You are a dedicated global opportunity analyst working exclusively for
this founder. Use the web_search tool repeatedly to find REAL, CURRENTLY
VERIFIABLE opportunities — do not invent names, deadlines, or amounts. If
you cannot verify eligibility for an Indian founder from a search result,
mark it "Eligibility Unverified" rather than guessing. You have a strict
budget of AT MOST 5 web_search calls total — pick your 5 queries
deliberately to cover the highest-value categories below, don't spend
them narrating your plan. After your 5th search, immediately write the
final briefing with whatever you've found.

Founder & company context:
{profile}

Today's date: {date}

Search worldwide (US, Canada, UK, EU, Switzerland, Norway, Singapore,
Australia, Japan, South Korea, Taiwan, Hong Kong, UAE, Saudi Arabia,
Qatar, Israel, Africa, Latin America, global remote programs) AND India
specifically (Startup India/DPIIT, MeitY, DST, BIRAC, NITI Aayog/AIM,
AGNIi, T-Hub, NSRCEL, CIIE.CO, IIT/IIM incubators, state startup
missions) for: accelerators, incubators, EIR programs, venture studios,
grants, government funding, corporate innovation programs, competitions,
fellowships, research commercialization programs, pilot programs,
innovation challenges, climate funds, AI/deep-tech programs, founder
residencies.

Before including ANY opportunity, verify via web_search: can an Indian
citizen apply, can an Indian-incorporated company apply, is relocation
required, is a US entity/Delaware C-Corp required, is remote
participation allowed. Skip anything clearly restricted to citizens or
residents of one country with no international/remote pathway — for
those, do not research deeply, just skip silently.

Once you have done enough searching, write the email body as clean HTML
(<h2>/<p>/<ul>/<table> blocks, NO <html>/<head>/<body> wrapper, NO inline
CSS). Sections, in this order, SKIP a tier entirely if nothing genuinely
qualifies today:

<h2>🟢 Tier 1 — Apply Now</h2> — open, eligible, strong fit. For each: name, link, what it offers, deadline, which startup (BiGeo / AcquaHT Labs / Both), why eligible, expected ROI, biggest rejection risk.

<h2>🟡 Tier 2 — Prepare to Apply</h2> — opening soon, eligible. Same fields, plus what to prepare now.

<h2>🟠 Tier 3 — Conditional</h2> — eligible only if a condition is met (Delaware C-Corp, revenue threshold, co-founder, relocation, etc). State the condition explicitly and whether it's worth pursuing.

<h2>🇮🇳 High-Priority Indian Opportunities</h2> — from central/state government, IITs/IIMs/IISc/IIITs, DPIIT, MeitY, DST, BIRAC, NITI Aayog, DRDO, ISRO, IN-SPACe, NABARD, AIM, AGNIi, T-Hub, NSRCEL, CIIE.CO, corporate CSR innovation. Always include this section if anything new surfaces; if truly nothing new, say so in one line.

<h2>Worth Noting</h2> — at most 3 one-line Tier 4 exclusions worth flagging (why not eligible now, what would change that) — only if genuinely notable, otherwise omit this section.

If there is truly nothing new and verifiable today across all tiers, say so plainly in a single <p> and do not fabricate filler. Never invent funding amounts, deadlines, or eligibility — every claim must come from a web_search result. When you are done searching and ready to give the final answer, respond with ONLY the HTML email body and no further tool calls.
"""


def _converse_with_backoff(bedrock, **kwargs):
    """Account has a 2 requests/minute quota for this model — space calls
    out and retry through any burst throttling."""
    delay = 30
    for attempt in range(5):
        try:
            return bedrock.converse(**kwargs)
        except ClientError as exc:
            if exc.response["Error"]["Code"] != "ThrottlingException" or attempt == 4:
                raise
            time.sleep(delay)
            delay = min(delay * 1.5, 90)


def synthesize(bedrock) -> str:
    prompt = PROMPT_TEMPLATE.format(
        profile=FOUNDER_PROFILE.strip(),
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )
    messages = [{"role": "user", "content": [{"text": prompt}]}]

    final_text = None
    for i in range(6):  # at most 5 searches + 1 final-answer turn; quota-limited to 2 req/min
        if i > 0:
            time.sleep(32)
        resp = _converse_with_backoff(
            bedrock,
            modelId=BEDROCK_MODEL_ID,
            messages=messages,
            toolConfig={"tools": [WEB_SEARCH_TOOL]},
            inferenceConfig={"maxTokens": 4000},
        )
        output_message = resp["output"]["message"]
        messages.append(output_message)

        tool_uses = [b["toolUse"] for b in output_message["content"] if "toolUse" in b]
        turn_text = "\n".join(b["text"] for b in output_message["content"] if "text" in b)

        if resp.get("stopReason") != "tool_use" or not tool_uses:
            final_text = turn_text
            break

        tool_results = []
        for tu in tool_uses:
            query = tu["input"].get("query", "")
            result_text = web_search(query)
            tool_results.append(
                {"toolResult": {"toolUseId": tu["toolUseId"], "content": [{"text": result_text}]}}
            )
        messages.append({"role": "user", "content": tool_results})

    if final_text is None:
        # Ran out of turns mid-search — force one last call with no tools
        # so Claude must write the final answer with what it already has.
        time.sleep(32)
        messages.append(
            {"role": "user", "content": [{"text": "Stop searching now. Write the final HTML briefing immediately using only the information already gathered above."}]}
        )
        resp = _converse_with_backoff(
            bedrock,
            modelId=BEDROCK_MODEL_ID,
            messages=messages,
            inferenceConfig={"maxTokens": 4000},
        )
        final_text = "\n".join(b["text"] for b in resp["output"]["message"]["content"] if "text" in b)

    return final_text or "<p>No synthesis produced today.</p>"


EMAIL_WRAPPER = """<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#080B14;">
<div style="max-width:680px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#E5E7EB;background:#080B14;">
<div style="border-bottom:2px solid #FF6600;padding-bottom:12px;margin-bottom:24px;">
<span style="color:#FF6600;font-weight:700;font-size:20px;">Opportunity Radar</span>
<span style="color:#00D1FF;font-size:13px;float:right;margin-top:6px;">{date}</span>
</div>
<div style="font-size:15px;line-height:1.6;">
{body}
</div>
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #1F2937;color:#6B7280;font-size:12px;">
Daily Opportunity Radar &middot; BiGeo / AcquaHT Labs &middot; auto-generated, verify deadlines/eligibility before applying
</div>
</div>
</body></html>"""


def style_headings(html: str) -> str:
    html = html.replace("<h2>", '<h2 style="color:#00D1FF;font-size:16px;margin:24px 0 8px;">')
    html = html.replace("<ul>", '<ul style="padding-left:18px;margin:8px 0;">')
    html = html.replace("<p>", '<p style="margin:8px 0;">')
    html = html.replace("<table>", '<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:14px;">')
    html = html.replace("<th>", '<th style="text-align:left;border-bottom:1px solid #1F2937;padding:4px 8px;">')
    html = html.replace("<td>", '<td style="border-bottom:1px solid #1F2937;padding:4px 8px;">')
    return html


def send_email(html_body: str, ses) -> None:
    date_str = datetime.now(timezone.utc).strftime("%a, %d %b %Y")
    full_html = EMAIL_WRAPPER.format(date=date_str, body=style_headings(html_body))
    ses.send_email(
        Source=SES_SENDER,
        Destination={"ToAddresses": [SES_RECIPIENT]},
        Message={
            "Subject": {"Data": f"Opportunity Radar — {date_str}"},
            "Body": {"Html": {"Data": full_html}},
        },
    )


def handler(event, context):
    bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)
    ses = boto3.client("ses", region_name=AWS_REGION)

    html_body = synthesize(bedrock)
    send_email(html_body, ses)

    return {"statusCode": 200}
