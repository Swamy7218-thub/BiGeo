#!/bin/bash
# BiGeo — Tier 3: OSRM + OR-Tools on EC2
# Replaces HERE Maps routing + upgrades VRP solver
# Graph build needs c6i.2xlarge (8 vCPU, 16GB). Runtime is much smaller.
# India OSRM graph build: ~45 min, ~12GB RAM peak

set -euo pipefail

REGION="ap-south-1"
KEY_NAME="bigeo-osrm-key"
INSTANCE_NAME="bigeo-osrm-build"
AMI="ami-0f5ee92e2d63afc18"  # Ubuntu 22.04 LTS ap-south-1

echo "=== BiGeo: Installing OSRM + OR-Tools on EC2 ==="

if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region $REGION &>/dev/null; then
  aws ec2 create-key-pair --key-name "$KEY_NAME" --region $REGION \
    --query "KeyMaterial" --output text > /tmp/bigeo-osrm.pem
  chmod 600 /tmp/bigeo-osrm.pem
fi

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI \
  --instance-type c6i.2xlarge \
  --key-name "$KEY_NAME" \
  --region $REGION \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME},{Key=Project,Value=BiGeo},{Key=Env,Value=dev}]" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":60,"VolumeType":"gp3","Iops":3000}}]' \
  --user-data '#!/bin/bash
set -e
apt-get update -y
apt-get install -y docker.io python3-pip wget curl git cmake build-essential

# OR-Tools (Python) — install first, fast
pip3 install ortools pyvrp

# Test OR-Tools VRP
python3 -c "
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
print(\"OR-Tools installed OK\")
"

# OSRM via Docker (easiest production path)
systemctl start docker
docker pull osrm/osrm-backend

# Download India OSM
echo "Downloading India OSM (~700MB)..."
mkdir -p /opt/osrm-data
wget -q -O /opt/osrm-data/india-latest.osm.pbf \
  "https://download.geofabrik.de/asia/india-latest.osrm.pbf" \
  || wget -q -O /opt/osrm-data/india-latest.osm.pbf \
  "https://download.geofabrik.de/asia/india-latest.osm.pbf"

# Pre-process India road network (Contraction Hierarchies — fastest queries)
echo "Building OSRM graph (45-60 min)..."
docker run -t -v /opt/osrm-data:/data osrm/osrm-backend \
  osrm-extract -p /opt/car.lua /data/india-latest.osm.pbf 2>&1 | tee /tmp/osrm-extract.log

docker run -t -v /opt/osrm-data:/data osrm/osrm-backend \
  osrm-partition /data/india-latest.osrm 2>&1 | tee -a /tmp/osrm-extract.log

docker run -t -v /opt/osrm-data:/data osrm/osrm-backend \
  osrm-customize /data/india-latest.osrm 2>&1 | tee -a /tmp/osrm-extract.log

# Start OSRM HTTP server
docker run -d -p 5000:5000 -v /opt/osrm-data:/data osrm/osrm-backend \
  osrm-routed --algorithm mld /data/india-latest.osrm

echo "OSRM_READY" > /tmp/install-status
echo "Test: curl http://localhost:5000/route/v1/driving/78.8,17.4;78.9,17.5"
' \
  --query "Instances[0].InstanceId" --output text)

echo "Instance launched: $INSTANCE_ID"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region $REGION

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" --region $REGION \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

echo ""
echo "=== OSRM + OR-Tools EC2 is UP ==="
echo "Instance: $INSTANCE_ID | IP: $PUBLIC_IP"
echo ""
echo "Graph build takes ~60 min. Watch:"
echo "ssh -i /tmp/bigeo-osrm.pem ubuntu@$PUBLIC_IP 'tail -f /tmp/osrm-extract.log'"
echo ""
echo "Test OSRM routing after build:"
echo "curl \"http://$PUBLIC_IP:5000/route/v1/driving/78.847,18.103;78.815,17.996?overview=false\""
echo ""
echo "Test distance matrix (VRP input):"
echo "curl \"http://$PUBLIC_IP:5000/table/v1/driving/78.847,18.103;78.815,17.996;78.299,17.772\""
echo ""
echo "STOP when done:"
echo "aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $REGION"
