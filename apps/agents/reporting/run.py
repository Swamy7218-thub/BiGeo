"""Reporting Agent entry point: builds the daily report and emails it via SES."""

from __future__ import annotations

import logging
import os
from datetime import date

import boto3

from app.db.session import SessionLocal
from agents.reporting.daily_report import build_daily_report

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reporting_agent")


def send_email(to_address: str, subject: str, body_text: str) -> None:
    sender = os.environ.get("REPORTS_FROM_EMAIL")
    if not sender:
        logger.warning("REPORTS_FROM_EMAIL not set; printing report instead of emailing")
        print(f"Subject: {subject}\n\n{body_text}")
        return

    client = boto3.client("ses", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    client.send_email(
        Source=sender,
        Destination={"ToAddresses": [to_address]},
        Message={"Subject": {"Data": subject}, "Body": {"Text": {"Data": body_text}}},
    )


def run(user_id: str, to_address: str) -> None:
    db = SessionLocal()
    try:
        report = build_daily_report(db, user_id, date.today())
        send_email(
            to_address=to_address,
            subject=f"Job agent daily report — {report.report_date}",
            body_text=report.summary_text,
        )
        logger.info("Daily report sent for user %s", user_id)
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python run.py <user_id> <to_email>")
        raise SystemExit(1)
    run(sys.argv[1], sys.argv[2])
