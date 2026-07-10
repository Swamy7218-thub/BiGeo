import boto3
from moto import mock_aws

from src.s3_client import AddressGraphStore


def _bucket(client):
    client.create_bucket(
        Bucket="test-bucket",
        CreateBucketConfiguration={"LocationConstraint": "ap-south-1"},
    )
    return AddressGraphStore(bucket="test-bucket", client=client)


@mock_aws
def test_put_and_get_object():
    client = boto3.client("s3", region_name="ap-south-1")
    store = _bucket(client)

    store.put_object("village.json", b'{"name": "test"}')

    assert store.object_exists("village.json") is True
    assert store.get_object("village.json") == b'{"name": "test"}'


@mock_aws
def test_object_exists_false_for_missing_key():
    client = boto3.client("s3", region_name="ap-south-1")
    store = _bucket(client)

    assert store.object_exists("missing.json") is False
