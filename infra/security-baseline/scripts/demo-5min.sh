#!/bin/bash
# BiGeo Security Baseline — 5-Minute Demo Script
# Shows live security controls deployed in production

set -euo pipefail
REGION="ap-south-1"
PROJECT="bigeo-prod"

echo "╔══════════════════════════════════════════════════╗"
echo "║   BiGeo Security Baseline — 5-Minute Demo       ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

echo "1️⃣  CloudTrail — Multi-region audit trail"
aws cloudtrail describe-trails --region $REGION \
  --query "trailList[?Name=='${PROJECT}-trail'].[Name,IsMultiRegionTrail,LogFileValidationEnabled,KMSKeyId]" \
  --output table
echo ""

echo "2️⃣  GuardDuty — Threat detection status"
DETECTOR=$(aws guardduty list-detectors --region $REGION --query "DetectorIds[0]" --output text)
aws guardduty get-detector --detector-id $DETECTOR --region $REGION \
  --query "[Status,FindingPublishingFrequency,DataSources.S3Logs.Status,DataSources.MalwareProtection.ScanEc2InstanceWithFindings.EbsVolumes.Status]" \
  --output table
echo ""

echo "3️⃣  Security Hub — Standards compliance"
aws securityhub get-enabled-standards --region $REGION \
  --query "StandardsSubscriptions[*].[StandardsArn,StandardsStatus]" \
  --output table
echo ""

echo "4️⃣  CloudWatch Alarms — Security monitoring"
aws cloudwatch describe-alarms --region $REGION \
  --alarm-name-prefix "$PROJECT" \
  --query "MetricAlarms[*].[AlarmName,StateValue,Threshold]" \
  --output table
echo ""

echo "5️⃣  WAF — Request protection (us-east-1)"
aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1 \
  --query "WebACLs[?Name=='${PROJECT}-waf'].[Name,ARN]" \
  --output table
echo ""

echo "✅ Security baseline deployed and active"
echo "📊 Dashboard: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=${PROJECT}-security"
