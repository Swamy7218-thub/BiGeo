import boto3
from botocore.exceptions import ClientError


class AddressGraphStore:
    """Wraps S3 access to the Bharat Address Graph dataset."""

    def __init__(self, bucket: str, client=None):
        self.bucket = bucket
        self.client = client or boto3.client("s3")

    def get_object(self, key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    def put_object(self, key: str, data: bytes) -> None:
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data)

    def object_exists(self, key: str) -> bool:
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as error:
            if error.response["Error"]["Code"] in ("404", "NoSuchKey"):
                return False
            raise
