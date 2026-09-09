#!/bin/bash
# BiGeo — Launch ALL open-source geo stack instances in one shot
# Run this in AWS CloudShell (ap-south-1)
# Takes ~5 min to launch all. Each instance self-installs in background.

set -euo pipefail
REGION="ap-south-1"
AMI="ami-0f5ee92e2d63afc18"  # Ubuntu 22.04 LTS ap-south-1

echo "======================================================"
echo " BiGeo Open-Source Stack — Launching 4 EC2 instances"
echo "======================================================"

# ── 1. libpostal (t3.medium, 20GB) ────────────────────────
echo ""
echo "[1/4] Launching libpostal (t3.medium)..."

if ! aws ec2 describe-key-pairs --key-names "bigeo-libpostal-key" --region $REGION &>/dev/null; then
  aws ec2 create-key-pair --key-name "bigeo-libpostal-key" --region $REGION \
    --query "KeyMaterial" --output text > /tmp/bigeo-libpostal.pem
  chmod 600 /tmp/bigeo-libpostal.pem
fi

LIBPOSTAL_ID=$(aws ec2 run-instances \
  --image-id $AMI --instance-type t3.medium \
  --key-name "bigeo-libpostal-key" --region $REGION \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=bigeo-libpostal},{Key=Project,Value=BiGeo},{Key=Env,Value=dev}]" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --user-data '#!/bin/bash
apt-get update -y
apt-get install -y curl autoconf automake libtool pkg-config python3-pip git build-essential
git clone https://github.com/openvenues/libpostal /opt/libpostal
cd /opt/libpostal
./bootstrap.sh
./configure --datadir=/opt/libpostal-data
make -j4
make install
ldconfig
pip3 install pypostal
python3 -c "from postal.parser import parse_address; print(parse_address(\"Near banyan tree, Yellareddyguda, Siddipet, Telangana\"))"
echo "LIBPOSTAL_READY" > /tmp/install-status' \
  --query "Instances[0].InstanceId" --output text)
echo "  ✓ libpostal: $LIBPOSTAL_ID"

# ── 2. Nominatim (r6g.xlarge, 120GB) ─────────────────────
echo "[2/4] Launching Nominatim (r6g.xlarge)..."

if ! aws ec2 describe-key-pairs --key-names "bigeo-nominatim-key" --region $REGION &>/dev/null; then
  aws ec2 create-key-pair --key-name "bigeo-nominatim-key" --region $REGION \
    --query "KeyMaterial" --output text > /tmp/bigeo-nominatim.pem
  chmod 600 /tmp/bigeo-nominatim.pem
fi

NOMINATIM_ID=$(aws ec2 run-instances \
  --image-id $AMI --instance-type r6i.xlarge \
  --key-name "bigeo-nominatim-key" --region $REGION \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=bigeo-nominatim},{Key=Project,Value=BiGeo},{Key=Env,Value=dev}]" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":120,"VolumeType":"gp3","Iops":3000}}]' \
  --user-data '#!/bin/bash
set -e
apt-get update -y
apt-get install -y postgresql postgresql-contrib postgis postgresql-15-postgis-3 \
  cmake g++ libboost-dev libboost-system-dev libboost-filesystem-dev \
  libexpat1-dev zlib1g-dev libbz2-dev libpq-dev libicu-dev \
  python3-pip osmium-tool curl wget git
git clone --depth 1 https://github.com/osm-search/Nominatim.git /opt/nominatim
pip3 install nominatim-db nominatim-api
sudo -u postgres createuser -s nominatim
sudo -u postgres createuser -s www-data
wget -q -O /tmp/india-latest.osm.pbf https://download.geofabrik.de/asia/india-latest.osm.pbf
cd /opt/nominatim
nominatim import --osm-file /tmp/india-latest.osm.pbf --threads 4 2>&1 | tee /tmp/nominatim-import.log
echo "NOMINATIM_READY" > /tmp/install-status' \
  --query "Instances[0].InstanceId" --output text)
echo "  ✓ Nominatim: $NOMINATIM_ID"

# ── 3. OSRM + OR-Tools (c6i.2xlarge, 60GB) ───────────────
echo "[3/4] Launching OSRM + OR-Tools (c6i.2xlarge)..."

if ! aws ec2 describe-key-pairs --key-names "bigeo-osrm-key" --region $REGION &>/dev/null; then
  aws ec2 create-key-pair --key-name "bigeo-osrm-key" --region $REGION \
    --query "KeyMaterial" --output text > /tmp/bigeo-osrm.pem
  chmod 600 /tmp/bigeo-osrm.pem
fi

OSRM_ID=$(aws ec2 run-instances \
  --image-id $AMI --instance-type c6i.2xlarge \
  --key-name "bigeo-osrm-key" --region $REGION \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=bigeo-osrm},{Key=Project,Value=BiGeo},{Key=Env,Value=dev}]" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":60,"VolumeType":"gp3","Iops":3000}}]' \
  --user-data '#!/bin/bash
set -e
apt-get update -y
apt-get install -y docker.io python3-pip wget curl
pip3 install ortools pyvrp
python3 -c "from ortools.constraint_solver import pywrapcp; print(\"OR-Tools OK\")"
systemctl start docker
docker pull osrm/osrm-backend
mkdir -p /opt/osrm-data
wget -q -O /opt/osrm-data/india-latest.osm.pbf https://download.geofabrik.de/asia/india-latest.osm.pbf
docker run -t -v /opt/osrm-data:/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/india-latest.osm.pbf
docker run -t -v /opt/osrm-data:/data osrm/osrm-backend osrm-partition /data/india-latest.osrm
docker run -t -v /opt/osrm-data:/data osrm/osrm-backend osrm-customize /data/india-latest.osrm
docker run -d -p 5000:5000 -v /opt/osrm-data:/data osrm/osrm-backend osrm-routed --algorithm mld /data/india-latest.osrm
echo "OSRM_READY" > /tmp/install-status' \
  --query "Instances[0].InstanceId" --output text)
echo "  ✓ OSRM: $OSRM_ID"

# ── 4. IndicBERT (t3.xlarge, 40GB) ───────────────────────
echo "[4/4] Launching IndicBERT (t3.xlarge)..."

if ! aws ec2 describe-key-pairs --key-names "bigeo-indic-key" --region $REGION &>/dev/null; then
  aws ec2 create-key-pair --key-name "bigeo-indic-key" --region $REGION \
    --query "KeyMaterial" --output text > /tmp/bigeo-indic.pem
  chmod 600 /tmp/bigeo-indic.pem
fi

INDIC_ID=$(aws ec2 run-instances \
  --image-id $AMI --instance-type t3.xlarge \
  --key-name "bigeo-indic-key" --region $REGION \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=bigeo-indicbert},{Key=Project,Value=BiGeo},{Key=Env,Value=dev}]" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":40,"VolumeType":"gp3"}}]' \
  --user-data '#!/bin/bash
set -e
apt-get update -y
apt-get install -y python3-pip python3-venv git curl
python3 -m venv /opt/indic-env
source /opt/indic-env/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers datasets sentencepiece sacremoses fastapi uvicorn
git clone https://github.com/AI4Bharat/IndicTrans2 /opt/IndicTrans2
cd /opt/IndicTrans2 && pip install -r requirements.txt
python3 -c "
from transformers import AutoTokenizer, AutoModelForTokenClassification
tokenizer = AutoTokenizer.from_pretrained(\"ai4bharat/IndicNER\")
model = AutoModelForTokenClassification.from_pretrained(\"ai4bharat/IndicNER\")
tokenizer.save_pretrained(\"/opt/indicner-model\")
model.save_pretrained(\"/opt/indicner-model\")
print(\"IndicNER saved\")
"
nohup uvicorn indic_api:app --host 0.0.0.0 --port 8001 > /tmp/indic-api.log 2>&1 &
echo "INDICBERT_READY" > /tmp/install-status' \
  --query "Instances[0].InstanceId" --output text)
echo "  ✓ IndicBERT: $INDIC_ID"

# ── Wait for all to be running ────────────────────────────
echo ""
echo "Waiting for all instances to reach running state..."
aws ec2 wait instance-running \
  --instance-ids $LIBPOSTAL_ID $NOMINATIM_ID $OSRM_ID $INDIC_ID \
  --region $REGION

# ── Print IPs ─────────────────────────────────────────────
echo ""
echo "======================================================"
echo " ALL INSTANCES RUNNING"
echo "======================================================"

for ID in $LIBPOSTAL_ID $NOMINATIM_ID $OSRM_ID $INDIC_ID; do
  IP=$(aws ec2 describe-instances --instance-ids $ID --region $REGION \
    --query "Reservations[0].Instances[0].PublicIpAddress" --output text)
  NAME=$(aws ec2 describe-instances --instance-ids $ID --region $REGION \
    --query "Reservations[0].Instances[0].Tags[?Key=='Name'].Value" --output text)
  echo "  $NAME: $ID | $IP"
done

echo ""
echo "Install times (background, check /tmp/install-status on each):"
echo "  libpostal  — ~15 min"
echo "  Nominatim  — ~2 hours (India OSM import)"
echo "  OSRM       — ~60 min (graph build)"
echo "  IndicBERT  — ~20 min (model download)"
echo ""
echo "STOP ALL when done (saves money):"
echo "aws ec2 stop-instances --instance-ids $LIBPOSTAL_ID $NOMINATIM_ID $OSRM_ID $INDIC_ID --region $REGION"
