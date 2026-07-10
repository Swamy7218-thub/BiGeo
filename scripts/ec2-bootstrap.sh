#!/usr/bin/env bash
# Bootstrap an EC2 instance (Amazon Linux or Ubuntu/Debian) with the AWS CLI v2
# and the AWS SDK for Python (boto3), so you can run `aws ...` / boto3 scripts
# from the box. Does NOT create or attach any IAM policy — pair this with an
# instance profile scoped to what the box actually needs, or run `aws configure`
# to use your own credentials.
#
# Usage: sudo ./ec2-bootstrap.sh
# Can also be passed as EC2 user-data (runs as root automatically).

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run as root (sudo ./ec2-bootstrap.sh)" >&2
  exit 1
fi

. /etc/os-release
echo "Detected OS: $PRETTY_NAME"

case "$ID" in
  amzn)
    dnf -y update
    dnf -y install unzip curl python3 python3-pip
    ;;
  ubuntu|debian)
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y unzip curl python3 python3-pip
    ;;
  *)
    echo "Unsupported distro '$ID' — install unzip, curl, python3, and python3-pip manually, then re-run." >&2
    exit 1
    ;;
esac

if ! command -v aws &>/dev/null; then
  echo "Installing AWS CLI v2..."
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) AWSCLI_ARCH="x86_64" ;;
    aarch64) AWSCLI_ARCH="aarch64" ;;
    *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;;
  esac
  TMP_DIR=$(mktemp -d)
  trap 'rm -rf "$TMP_DIR"' EXIT
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${AWSCLI_ARCH}.zip" -o "$TMP_DIR/awscliv2.zip"
  unzip -q "$TMP_DIR/awscliv2.zip" -d "$TMP_DIR"
  "$TMP_DIR/aws/install"
else
  echo "AWS CLI already installed: $(aws --version)"
fi

echo "Installing boto3..."
pip3 install --upgrade boto3

echo
echo "Done."
aws --version
python3 -c "import boto3; print('boto3', boto3.__version__)"
echo
echo "Next step: provide credentials via 'aws configure', environment variables,"
echo "or (recommended) attach an IAM instance profile scoped to this box's needs."
