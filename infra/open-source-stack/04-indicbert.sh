#!/bin/bash
# BiGeo — Tier 1b: IndicBERT + IndicTrans2 + Naamapadam NER
# For parsing addresses written in Telugu, Hindi, Tamil, Bengali etc.
# Runs on t3.xlarge (4 vCPU, 16GB) — no GPU needed for inference

set -euo pipefail

REGION="ap-south-1"
KEY_NAME="bigeo-indic-key"
INSTANCE_NAME="bigeo-indicbert"
AMI="ami-0f5ee92e2d63afc18"  # Ubuntu 22.04 LTS ap-south-1

echo "=== BiGeo: Installing IndicBERT + IndicTrans2 ==="

if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region $REGION &>/dev/null; then
  aws ec2 create-key-pair --key-name "$KEY_NAME" --region $REGION \
    --query "KeyMaterial" --output text > /tmp/bigeo-indic.pem
  chmod 600 /tmp/bigeo-indic.pem
fi

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI \
  --instance-type t3.xlarge \
  --key-name "$KEY_NAME" \
  --region $REGION \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME},{Key=Project,Value=BiGeo},{Key=Env,Value=dev}]" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":40,"VolumeType":"gp3"}}]' \
  --user-data '#!/bin/bash
set -e
apt-get update -y
apt-get install -y python3-pip python3-venv git curl

python3 -m venv /opt/indic-env
source /opt/indic-env/bin/activate

# Core ML deps
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers datasets sentencepiece sacremoses

# IndicTrans2 (translation: any Indic language → English)
git clone https://github.com/AI4Bharat/IndicTrans2 /opt/IndicTrans2
cd /opt/IndicTrans2
pip install -r requirements.txt

# Download IndicBERT v2 model for NER
python3 -c "
from transformers import AutoTokenizer, AutoModelForTokenClassification
import json

# IndicNER model (NER for Indic addresses)
print(\"Downloading IndicNER model...\")
tokenizer = AutoTokenizer.from_pretrained(\"ai4bharat/IndicNER\")
model = AutoModelForTokenClassification.from_pretrained(\"ai4bharat/IndicNER\")
tokenizer.save_pretrained(\"/opt/indicner-model\")
model.save_pretrained(\"/opt/indicner-model\")
print(\"IndicNER model saved to /opt/indicner-model\")

# Test NER on a Telugu address
inputs = tokenizer(\"నల్లమల అడవి దగ్గర, సిద్ధిపేట జిల్లా, తెలంగాణ\", return_tensors=\"pt\")
outputs = model(**inputs)
print(\"NER test passed - Telugu address processed\")
"

# Build simple FastAPI wrapper for address NER + translation
cat > /opt/indic-api.py << '"'"'APIEOF'"'"'
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
import torch

app = FastAPI()

# Load models once at startup
ner_tokenizer = AutoTokenizer.from_pretrained("/opt/indicner-model")
ner_model = AutoModelForTokenClassification.from_pretrained("/opt/indicner-model")
ner_pipe = pipeline("ner", model=ner_model, tokenizer=ner_tokenizer, aggregation_strategy="simple")

class AddressRequest(BaseModel):
    address: str
    language: str = "te"  # te=Telugu, hi=Hindi, ta=Tamil, bn=Bengali

@app.post("/extract-locations")
async def extract_locations(req: AddressRequest):
    entities = ner_pipe(req.address)
    locations = [e for e in entities if e["entity_group"] == "LOC"]
    return {
        "address": req.address,
        "locations": locations,
        "location_strings": [e["word"] for e in locations]
    }

@app.get("/health")
def health():
    return {"status": "ok", "models": ["IndicNER"]}
APIEOF

pip install fastapi uvicorn

# Start API
nohup uvicorn /opt/indic-api:app --host 0.0.0.0 --port 8001 > /tmp/indic-api.log 2>&1 &

echo "INDICBERT_READY" > /tmp/install-status
' \
  --query "Instances[0].InstanceId" --output text)

echo "Instance launched: $INSTANCE_ID"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region $REGION

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" --region $REGION \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

echo ""
echo "=== IndicBERT EC2 is UP ==="
echo "Instance: $INSTANCE_ID | IP: $PUBLIC_IP"
echo "Models download ~20 min. Test:"
echo "curl -X POST http://$PUBLIC_IP:8001/extract-locations \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"address\": \"సిద్ధిపేట జిల్లా, తెలంగాణ\", \"language\": \"te\"}'"
echo ""
echo "STOP when done:"
echo "aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $REGION"
