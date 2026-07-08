"""
API Gateway TOKEN authorizer validating Auth0-issued OAuth 2.0 access
tokens (RS256 JWTs) for external /external/oauth/* callers.

Requires a Lambda layer providing `pyjwt` and `cryptography` (not in the
Python 3.13 base runtime) -- see terraform/modules/api-gateway/variables.tf
`authorizer_layer_arns`.
"""

import json
import os
import time
import urllib.request

import jwt
from jwt import PyJWKClient

AUTH0_DOMAIN = os.environ["AUTH0_DOMAIN"]
AUTH0_AUDIENCE = os.environ["AUTH0_AUDIENCE"]
JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"

_jwk_client = PyJWKClient(JWKS_URL)


def lambda_handler(event, context):
    token = _extract_bearer_token(event.get("authorizationToken", ""))
    if not token:
        raise Exception("Unauthorized")

    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )
    except Exception:
        raise Exception("Unauthorized")

    tier = claims.get("https://bigeo.in/tier", "standard")

    return {
        "principalId": claims["sub"],
        "policyDocument": _allow_policy(event["methodArn"]),
        "context": {"caller_sub": claims["sub"], "sla_tier": tier},
    }


def _extract_bearer_token(auth_header: str) -> str:
    parts = auth_header.split(" ")
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return ""


def _allow_policy(method_arn: str) -> dict:
    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "execute-api:Invoke",
                "Effect": "Allow",
                "Resource": method_arn,
            }
        ],
    }
