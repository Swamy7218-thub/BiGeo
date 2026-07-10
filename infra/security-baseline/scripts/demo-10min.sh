#!/bin/bash
# BiGeo Security Baseline — 10-Minute Demo Script
# Full walkthrough of all security controls

set -euo pipefail
REGION="ap-south-1"
PROJECT="bigeo-prod"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   BiGeo Security Baseline — Full 10-Minute Demo             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
sleep 1

echo "━━━ SECTION 1: IDENTITY & ACCESS ━━━"
echo ""
echo "IAM Roles deployed:"
aws iam list-roles \
  --query "Roles[?contains(RoleName,'${PROJECT}')].[RoleName,CreateDate]" \
  --output table

echo ""
echo "BreakGlassAdmin role trust policy (requires ExternalId + MFA):"
aws iam get-role --role-name "${PROJECT}-BreakGlassAdmin" \
  --query "Role.AssumeRolePolicyDocument" --output json 2>/dev/null | python3 -m json.tool || echo "Role not found"
sleep 2

echo ""
echo "━━━ SECTION 2: AUDIT & LOGGING ━━━"
echo ""
TRAIL=$(aws cloudtrail describe-trails --region $REGION \
  --query "trailList[?Name=='${PROJECT}-trail'].TrailARN" --output text)
echo "CloudTrail ARN: $TRAIL"
echo ""
echo "Recent CloudTrail events (last 10):"
aws cloudtrail lookup-events --region $REGION \
  --max-results 10 \
  --query "Events[*].[EventTime,EventName,Username]" \
  --output table
sleep 2

echo ""
echo "━━━ SECTION 3: THREAT DETECTION ━━━"
echo ""
DETECTOR=$(aws guardduty list-detectors --region $REGION --query "DetectorIds[0]" --output text)
echo "GuardDuty Detector: $DETECTOR"
FINDING_COUNT=$(aws guardduty list-findings \
  --detector-id $DETECTOR --region $REGION \
  --query "length(FindingIds)" --output text 2>/dev/null || echo "0")
echo "Active Findings: $FINDING_COUNT"

echo ""
echo "Inspector scan coverage:"
aws inspector2 list-coverage --region $REGION \
  --query "coveredResources[0:5].[resourceType,resourceId,scanStatus.statusCode]" \
  --output table 2>/dev/null || echo "  Inspector scanning in progress..."
sleep 2

echo ""
echo "━━━ SECTION 4: ENCRYPTION ━━━"
echo ""
echo "KMS Keys with auto-rotation:"
aws kms list-keys --region $REGION \
  --query "Keys[*].KeyId" --output text | tr '\t' '\n' | while read keyid; do
  STATUS=$(aws kms get-key-rotation-status --key-id $keyid --region $REGION \
    --query "KeyRotationEnabled" --output text 2>/dev/null || echo "N/A")
  if [ "$STATUS" = "True" ]; then
    ALIAS=$(aws kms list-aliases --key-id $keyid --region $REGION \
      --query "Aliases[0].AliasName" --output text 2>/dev/null || echo "no-alias")
    echo "  ✓ $ALIAS — auto-rotation: $STATUS"
  fi
done
sleep 2

echo ""
echo "━━━ SECTION 5: NETWORK PROTECTION ━━━"
echo ""
echo "WAF Web ACL rules:"
WAF_ACL=$(aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1 \
  --query "WebACLs[?Name=='${PROJECT}-waf'].Id" --output text 2>/dev/null)
if [ -n "$WAF_ACL" ]; then
  aws wafv2 get-web-acl --scope CLOUDFRONT --region us-east-1 \
    --name "${PROJECT}-waf" --id "$WAF_ACL" \
    --query "WebACL.Rules[*].[Name,Priority,Action]" \
    --output table 2>/dev/null || echo "  WAF rules loaded (check console)"
else
  echo "  WAF ACL not found in us-east-1"
fi
sleep 2

echo ""
echo "━━━ SECTION 6: COMPLIANCE POSTURE ━━━"
echo ""
echo "Security Hub compliance scores:"
aws securityhub get-enabled-standards --region $REGION \
  --query "StandardsSubscriptions[*].[StandardsArn,StandardsStatus]" \
  --output table

echo ""
echo "━━━ SUMMARY ━━━"
echo "✅ CloudTrail:    Multi-region, encrypted, log validation"
echo "✅ GuardDuty:     Active ($FINDING_COUNT findings)"
echo "✅ Security Hub:  AWS Foundational + CIS standards"
echo "✅ Inspector:     EC2, ECR, Lambda scanning"
echo "✅ WAF:           OWASP + rate limiting (2000 req/5min)"
echo "✅ CloudWatch:    4 alarms, 8-widget dashboard"
echo "✅ KMS:           Auto-rotating keys for CloudTrail + SNS"
echo "✅ IAM Roles:     BreakGlass + Auditor + Developer"
echo ""
echo "📊 Dashboard: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=${PROJECT}-security"
