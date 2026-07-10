import boto3


class ResolutionCache:
    """DynamoDB-backed cache of previously resolved village addresses."""

    def __init__(self, table_name: str, resource=None):
        self.table = (resource or boto3.resource("dynamodb")).Table(table_name)

    def get(self, address: str) -> dict | None:
        response = self.table.get_item(Key={"address": address})
        return response.get("Item")

    def put(self, address: str, resolved: dict) -> None:
        self.table.put_item(Item={"address": address, **resolved})
