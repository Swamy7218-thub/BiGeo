# BiGeo Google Cloud Setup Guide

Project ID: bigeo-491617

## Step 1: Enable APIs (do this in GCP Console)

Go to: https://console.cloud.google.com/apis/library?project=bigeo-491617

Enable these APIs (click each, then "Enable"):
1. **Vertex AI API** → https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
2. **Cloud Translation API** → https://console.cloud.google.com/apis/library/translate.googleapis.com
3. **BigQuery API** → https://console.cloud.google.com/apis/library/bigquery.googleapis.com
4. **Dialogflow API** → https://console.cloud.google.com/apis/library/dialogflow.googleapis.com

## Step 2: Create Service Account

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=bigeo-491617
2. Click "Create Service Account"
3. Name: `bigeo-backend`
4. Description: "BiGeo backend services — Vertex AI, Translation, BigQuery"
5. Click "Create and Continue"
6. Add these roles:
   - **Vertex AI User** (roles/aiplatform.user)
   - **Cloud Translation API User** (roles/cloudtranslate.user)
   - **BigQuery Data Editor** (roles/bigquery.dataEditor)
   - **BigQuery Job User** (roles/bigquery.jobUser)
   - **Dialogflow API Client** (roles/dialogflow.client)
7. Click "Done"
8. Click on the service account → "Keys" tab → "Add Key" → "JSON"
9. Download the JSON file — this is your credential

## Step 3: Store credential in AWS Secrets Manager

Run this (replace the JSON content):
```bash
aws secretsmanager create-secret \
  --name "bigeo/gcp-service-account" \
  --description "GCP service account for Vertex AI, Translation, BigQuery" \
  --secret-string "$(cat /path/to/your-key.json)" \
  --region ap-south-1
```

## Step 4: Store Project ID in AWS SSM Parameter Store
```bash
aws ssm put-parameter \
  --name "/bigeo/gcp/project-id" \
  --value "bigeo-491617" \
  --type String \
  --region ap-south-1
```

## Verify GenAI App Builder credit is active
https://console.cloud.google.com/billing/credits?project=bigeo-491617
