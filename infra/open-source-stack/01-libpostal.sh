#!/bin/bash
# BiGeo — Tier 1: libpostal + pypostal on EC2
# Run this in CloudShell. Creates a t3.medium EC2, installs libpostal.
# Cost: ~$0.04/hour (~$30/month) — much cheaper than Bedrock per-call

set -euo pipefail

REGION="ap-south-1"
KEY_NAME="bigeo-libpostal-key"
INSTANCE_NAME="bigeo-libpostal"
AMI="ami-0f5ee92e2d63afc18"  # Ubuntu 22.04 LTS ap-south-1

echo "=== BiGeo: Installing libpostal on EC2 ==="

# 1. Create key pair if not exists
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region $REGION &>/dev/null; then
  aws ec2 create-key-pair --key-name "$KEY_NAME" --region $REGION \
    --query "KeyMaterial" --output text > /tmp/bigeo-libpostal.pem
  chmod 600 /tmp/bigeo-libpostal.pem
  echo "Key saved to /tmp/bigeo-libpostal.pem"
fi

# 2. Launch EC2 instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI \
  --instance-type t3.medium \
  --key-name "$KEY_NAME" \
  --region $REGION \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME},{Key=Project,Value=BiGeo},{Key=Env,Value=dev}]" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
  --user-data '#!/bin/bash
apt-get update -y
apt-get install -y curl autoconf automake libtool pkg-config python3-pip git build-essential
# libpostal
git clone https://github.com/openvenues/libpostal /opt/libpostal
cd /opt/libpostal
./bootstrap.sh
./configure --datadir=/opt/libpostal-data
make -j4
make install
ldconfig
# pypostal
pip3 install pypostal
# Test
python3 -c "from postal.parser import parse_address; print(parse_address(\"Near banyan tree, Yellareddyguda, Siddipet, Telangana\"))"
echo "LIBPOSTAL_READY" > /tmp/install-status
' \
  --query "Instances[0].InstanceId" --output text)

echo "Instance launched: $INSTANCE_ID"
echo "Waiting for it to be running..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region $REGION

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" --region $REGION \
  --query "Reservations[0].Instances[0].PublicIpAddress" --output text)

echo ""
echo "=== libpostal EC2 is UP ==="
echo "Instance ID: $INSTANCE_ID"
echo "Public IP:   $PUBLIC_IP"
echo "SSH:         ssh -i /tmp/bigeo-libpostal.pem ubuntu@$PUBLIC_IP"
echo ""
echo "Install runs in background (~10 min). Check status:"
echo "ssh -i /tmp/bigeo-libpostal.pem ubuntu@$PUBLIC_IP 'cat /tmp/install-status'"
echo ""
echo "IMPORTANT: Stop instance when done to avoid charges:"
echo "aws ec2 stop-instances --instance-ids $INSTANCE_ID --region $REGION"
