#!/usr/bin/env python3
"""
Create BiGeo Dialogflow CX Agent for WhatsApp producer onboarding.

Usage:
  python3 create_agent.py --create    # Create the agent
  python3 create_agent.py --webhook   # Deploy webhook URL
  python3 create_agent.py --status    # Check agent status

After creation:
  1. Go to Dialogflow CX console
  2. Connect to WhatsApp via Twilio or Meta direct integration
  3. Set webhook URL to your Lambda endpoint
"""

import json
import sys
import argparse
import requests
from google.oauth2 import service_account
import google.auth.transport.requests

GCP_PROJECT = "bigeo-491617"
GCP_REGION = "asia-south1"  # Closest to India
GCP_CREDENTIALS_FILE = "../setup/gcp-key.json"

# Webhook Lambda endpoint (update after deploying producer-bot-function)
WEBHOOK_URL = "https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1/producer-webhook"

AGENT_CONFIG = {
    "displayName": "BiGeo Producer Bot",
    "defaultLanguageCode": "te",  # Telugu as primary
    "supportedLanguageCodes": ["te", "hi", "en"],
    "timeZone": "Asia/Kolkata",
    "description": "WhatsApp onboarding and pickup scheduling for rural producers",
    "enableSpellCorrection": False,
    "speechToTextSettings": {
        "enableSpeechAdaptation": True
    }
}

INTENTS = [
    {
        "displayName": "producer.register",
        "trainingPhrases": [
            "I want to register", "register my farm", "new producer",
            "నమోదు చేయండి", "నమోదు", "I am a farmer",
            "want to join BiGeo", "onboard my products"
        ]
    },
    {
        "displayName": "producer.request_pickup",
        "trainingPhrases": [
            "I want to schedule a pickup", "pickup my goods", "collect my produce",
            "వస్తువులు తీసుకెళ్ళండి", "pickup request", "schedule collection",
            "send a pickup", "I have goods ready"
        ]
    },
    {
        "displayName": "producer.check_status",
        "trainingPhrases": [
            "what is the status of my shipment", "where are my goods",
            "tracking", "నా వస్తువులు ఎక్కడ ఉన్నాయి", "order status",
            "payment status", "when will I get paid"
        ]
    },
    {
        "displayName": "producer.get_price",
        "trainingPhrases": [
            "what is the price today", "tomato price", "vegetable rates",
            "today's mandi price", "ధర ఎంత", "నేటి ధర",
            "how much per kg", "current market rate"
        ]
    },
    {
        "displayName": "producer.help",
        "trainingPhrases": [
            "help", "సహాయం", "I need help", "what can you do",
            "how does this work", "what is BiGeo"
        ]
    }
]

# Pages (conversation flows)
PAGES = {
    "Welcome": {
        "entry_fulfillment": {
            "messages": [
                {
                    "text": {
                        "text": [
                            "🌾 నమస్కారం! BiGeo కి స్వాగతం.\nHello! Welcome to BiGeo — rural logistics made simple.\n\nI can help you:\n1️⃣ Register as a producer\n2️⃣ Schedule a pickup\n3️⃣ Check shipment status\n4️⃣ Get today's prices\n\nReply with a number or describe what you need."
                        ]
                    }
                }
            ]
        }
    },
    "Collect Name": {
        "entry_fulfillment": {
            "messages": [{"text": {"text": ["What is your name? / మీ పేరు ఏమిటి?"]}}]
        },
        "form": {
            "parameters": [{"displayName": "producer_name", "entityType": "@sys.any", "required": True}]
        }
    },
    "Collect Village": {
        "entry_fulfillment": {
            "messages": [{"text": {"text": ["Which village are you from? / మీరు ఏ గ్రామం నుండి వచ్చారు?\n\n(Example: Yellareddyguda, Siddipet)"]}}]
        },
        "form": {
            "parameters": [{"displayName": "village_name", "entityType": "@sys.any", "required": True}]
        }
    },
    "Collect Products": {
        "entry_fulfillment": {
            "messages": [{"text": {"text": ["What products do you grow or sell? / మీరు ఏ పంటలు పండిస్తారు?\n\n(Example: Tomatoes, Onions, Turmeric / టమాటాలు, ఉల్లిపాయలు)"]}}]
        },
        "form": {
            "parameters": [{"displayName": "products", "entityType": "@sys.any", "required": True}]
        }
    },
    "Confirm Registration": {
        "entry_fulfillment": {
            "messages": [{
                "text": {
                    "text": [
                        "✅ Great! Let me confirm your details:\n\nName: $session.params.producer_name\nVillage: $session.params.village_name\nProducts: $session.params.products\n\nIs this correct? Reply YES to confirm or NO to start over."
                    ]
                }
            }],
            "webhook": {"webhook": "bigeo-producer-webhook", "tag": "register_producer"}
        }
    },
    "Request Pickup": {
        "entry_fulfillment": {
            "messages": [{"text": {"text": ["How many kg do you need picked up? / ఎంత కిలోలు పంపించాలి?"]}}],
            "webhook": {"webhook": "bigeo-producer-webhook", "tag": "schedule_pickup"}
        }
    },
    "Check Status": {
        "entry_fulfillment": {
            "messages": [{"text": {"text": ["Let me check your latest shipment... / మీ రవాణా వివరాలు తనిఖీ చేస్తున్నాను..."]}}],
            "webhook": {"webhook": "bigeo-producer-webhook", "tag": "check_status"}
        }
    }
}


def get_access_token():
    creds = service_account.Credentials.from_service_account_file(
        GCP_CREDENTIALS_FILE,
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    return creds.token


def api_request(method, path, body=None, token=None):
    base = f"https://{GCP_REGION}-dialogflow.googleapis.com/v3"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    resp = requests.request(method, f"{base}{path}", headers=headers, json=body)
    return resp


def create_agent(token):
    print(f"\n🤖 Creating Dialogflow CX agent in {GCP_REGION}...")
    resp = api_request(
        "POST",
        f"/projects/{GCP_PROJECT}/locations/{GCP_REGION}/agents",
        AGENT_CONFIG,
        token
    )
    if resp.status_code in (200, 201):
        agent = resp.json()
        agent_id = agent["name"].split("/")[-1]
        print(f"  ✓ Agent created: {agent['displayName']}")
        print(f"  ✓ Agent ID: {agent_id}")
        print(f"  ✓ Agent name: {agent['name']}")
        return agent["name"]
    else:
        print(f"  ✗ Error: {resp.status_code} — {resp.text[:300]}")
        return None


def create_webhook(agent_name, token):
    print(f"\n🔗 Creating webhook...")
    webhook_config = {
        "displayName": "bigeo-producer-webhook",
        "genericWebService": {
            "uri": WEBHOOK_URL,
            "httpMethod": "POST",
            "requestHeaders": {"Content-Type": "application/json"},
            "timeout": "10s"
        }
    }
    resp = api_request("POST", f"/{agent_name}/webhooks", webhook_config, token)
    if resp.status_code in (200, 201):
        wh = resp.json()
        print(f"  ✓ Webhook: {wh['displayName']} → {WEBHOOK_URL}")
        return wh["name"]
    else:
        print(f"  ✗ Webhook error: {resp.status_code} — {resp.text[:200]}")
        return None


def create_intents(agent_name, token):
    print(f"\n💬 Creating intents...")
    created = []
    for intent in INTENTS:
        # Build training phrases in correct format
        phrases = []
        for phrase_text in intent["trainingPhrases"]:
            phrases.append({"parts": [{"text": phrase_text}], "repeatCount": 1})
        body = {"displayName": intent["displayName"], "trainingPhrases": phrases}
        resp = api_request("POST", f"/{agent_name}/intents", body, token)
        if resp.status_code in (200, 201):
            print(f"  ✓ Intent: {intent['displayName']}")
            created.append(resp.json()["name"])
        else:
            print(f"  ⚠ Intent {intent['displayName']}: {resp.status_code}")
    return created


def print_console_link(agent_name):
    agent_id = agent_name.split("/")[-1]
    print(f"""
🎉 Agent created! Next steps:

1. Open Dialogflow CX console:
   https://dialogflow.cloud.google.com/cx/projects/{GCP_PROJECT}/locations/{GCP_REGION}/agents/{agent_id}

2. Connect to WhatsApp:
   Option A (recommended): Twilio → https://www.twilio.com/whatsapp
   Option B: Meta Direct API → https://developers.facebook.com/docs/whatsapp

3. Set your webhook in Twilio:
   URL: {WEBHOOK_URL}
   Method: POST

4. Test in Dialogflow simulator first, then connect to WhatsApp number

5. Telugu voice: Enable Speech in the agent settings for voice-based pickup requests
""")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--create", action="store_true")
    parser.add_argument("--status", action="store_true")
    args = parser.parse_args()

    if not (args.create or args.status):
        parser.print_help()
        sys.exit(1)

    try:
        token = get_access_token()
        print(f"✓ GCP auth OK")
    except FileNotFoundError:
        print(f"✗ Key file not found: {GCP_CREDENTIALS_FILE}\n  See gcp/setup/README.md")
        sys.exit(1)

    if args.create:
        agent_name = create_agent(token)
        if agent_name:
            create_webhook(agent_name, token)
            create_intents(agent_name, token)
            print_console_link(agent_name)

    if args.status:
        resp = api_request("GET", f"/projects/{GCP_PROJECT}/locations/{GCP_REGION}/agents", token=token)
        agents = resp.json().get("agents", [])
        if agents:
            for a in agents:
                print(f"  Agent: {a['displayName']} — {a['name']}")
        else:
            print("  No agents found. Run --create first.")
