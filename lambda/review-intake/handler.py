"""
Consumes the review SQS queue and persists each pending resolution into the
review-status table for the (separate, not-yet-built) human review UI to
pick up. Kept deliberately minimal: writing confirmed human corrections
back into the reference-data table is a distinct workflow the review UI
will drive, not this intake handler.
"""

import json
import os
import time

import boto3

REGION = os.environ["AWS_REGION"]
REVIEW_STATUS_TABLE = os.environ["REVIEW_STATUS_TABLE"]

dynamodb = boto3.resource("dynamodb", region_name=REGION)
review_status_table = dynamodb.Table(REVIEW_STATUS_TABLE)


def lambda_handler(event, context):
    for record in event["Records"]:
        message = json.loads(record["body"])
        review_status_table.put_item(
            Item={
                "review_id": message["review_id"],
                "status": "pending",
                "queued_at": _iso_now(),
                "input": message["input"],
                "best_guess": json.dumps(message["best_guess"]),
            }
        )
    return {"processed": len(event["Records"])}


def _iso_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
