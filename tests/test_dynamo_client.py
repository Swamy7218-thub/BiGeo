import boto3
from moto import mock_aws

from src.dynamo_client import ResolutionCache


def _cache(resource):
    resource.create_table(
        TableName="test-cache",
        KeySchema=[{"AttributeName": "address", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "address", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    return ResolutionCache(table_name="test-cache", resource=resource)


@mock_aws
def test_put_and_get_cache_entry():
    resource = boto3.resource("dynamodb", region_name="ap-south-1")
    cache = _cache(resource)

    cache.put("Village X, Taluk Y", {"district": "Y"})

    assert cache.get("Village X, Taluk Y") == {
        "address": "Village X, Taluk Y",
        "district": "Y",
    }


@mock_aws
def test_get_missing_entry_returns_none():
    resource = boto3.resource("dynamodb", region_name="ap-south-1")
    cache = _cache(resource)

    assert cache.get("unknown") is None
