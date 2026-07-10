#!/bin/bash
# BiGeo — Tier 2: Nominatim + PMGSY on EC2
# Replaces HERE Maps geocoding entirely.
# Needs r6g.xlarge (16GB RAM) + 120GB EBS for India OSM + PMGSY data
# Cost: ~$0.20/hour during build, then stop and snapshot

set -euo pipefail

REGION="ap-south-1"
KEY_NAME="bigeo-nominatim-key"
INSTANCE_NAME="bigeo-nominatim-build"
AMI="ami-0f5ee92e2d63afc18"  # Ubuntu 22.04 LTS ap-south-1

echo "=== BiGeo: Installing Nominatim + PMGSY on EC2 ==="

# Key pair
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region $REGION &>/dev/null; then
  aws ec2 create-key-pair --key-name "$KEY_NAME" --region $REGION \
    --query "KeyMaterial" --output text > /tmp/bigeo-nominatim.pem
  chmod 600 /tmp/bigeo-nominatim.pem
fi

# Launch r6g.xlarge — needs 16GB RAM for Nominatim India import
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI \
  --instance-type r6i.xlarge \
  --key-name "$KEY_NAME" \
  --region $REGION \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME},{Key=Project,Value=BiGeo},{Key=Env,Value=dev}]" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":120,"VolumeType":"gp3","Iops":3000}}]' \
  --user-data '#!/bin/bash
set -e
apt-get update -y
apt-get install -y postgresql postgresql-contrib postgis postgresql-15-postgis-3 \
  cmake g++ libboost-dev libboost-system-dev libboost-filesystem-dev \
  libexpat1-dev zlib1g-dev libbz2-dev libpq-dev libicu-dev \
  python3-pip osmium-tool curl wget git

# Nominatim
git clone --depth 1 https://github.com/osm-search/Nominatim.git /opt/nominatim
cd /opt/nominatim
pip3 install nominatim-db nominatim-api

# PostgreSQL setup
sudo -u postgres createuser -s nominatim
sudo -u postgres createuser -s www-data

# Download India OSM (latest)
echo "Downloading India OSM (~700MB)..."
wget -q -O /tmp/india-latest.osm.pbf \
  "https://download.geofabrik.de/asia/india-latest.osm.pbf"

# Download PMGSY habitation data from datameet
echo "Downloading PMGSY-GeoSadak data..."
wget -q -O /tmp/pmgsy-habitations.geojson \
  "https://raw.githubusercontent.com/datameet/pmgsy-geosadak/master/data/habitations.geojson" \
  || echo "PMGSY direct download failed - will merge manually"

# Initialize Nominatim
cd /opt/nominatim
nominatim import --osm-file /tmp/india-latest.osm.pbf \
  --threads 4 2>&1 | tee /tmp/nominatim-import.log

echo "NOMINATIM_READY" > /tmp/install-status
echo "Test: curl http://localhost/nominatim/search?q=Siddipet&format=json"
' \
  --query "Instances[0].InstanceId" --output text)

echo "Instance launched: $INSTANCE_ID"
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region $REGION

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" --region $REGION \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

echo ""
echo "=== Nominatim EC2 is UP ==="
echo "Instance: $INSTANCE_ID | IP: $PUBLIC_IP"
echo "Import takes ~2 hours for India. Watch progress:"
echo "ssh -i /tmp/bigeo-nominatim.pem ubuntu@$PUBLIC_IP 'tail -f /tmp/nominatim-import.log'"
echo ""
echo "After import, test:"
echo "curl \"http://$PUBLIC_IP/nominatim/search?q=Yellareddyguda+Siddipet&format=json&countrycodes=in\""
echo ""
echo "STOP when done (save money, snapshot later for Lambda):"
echo "aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $REGION"
