import json
from unittest.mock import MagicMock

from src import handler


def test_lambda_handler_returns_resolution(monkeypatch):
    mock_resolver = MagicMock()
    mock_resolver.resolve.return_value = {"district": "Y"}
    monkeypatch.setattr(handler, "_get_resolver", lambda: mock_resolver)

    event = {"body": json.dumps({"address": "Village X"})}
    response = handler.lambda_handler(event, None)

    assert response["statusCode"] == 200
    assert json.loads(response["body"]) == {"district": "Y"}
    mock_resolver.resolve.assert_called_once_with("Village X")


def test_lambda_handler_requires_address():
    response = handler.lambda_handler({"body": "{}"}, None)

    assert response["statusCode"] == 400
