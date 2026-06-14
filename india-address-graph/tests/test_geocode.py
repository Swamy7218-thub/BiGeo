"""
Smoke tests for geocode helpers — no DB required (mock session).
Run with: pytest tests/
"""

import pytest
from app.services.geocode_service import _extract_pincode, _tokenise, _classify_address_parts
from app.schemas import GeocodeResponse


@pytest.mark.parametrize("text,expected", [
    ("H.No 3-12, Narsapur, Medak, Telangana 502313", "502313"),
    ("PIN: 110001 New Delhi", "110001"),
    ("no pin here",  None),
    ("000000 invalid",  None),   # starts with 0
])
def test_extract_pincode(text, expected):
    assert _extract_pincode(text) == expected


def test_tokenise_removes_stopwords():
    tokens = _tokenise("near Govt School, Narsapur, Medak")
    assert "near" not in tokens
    assert "govt" not in tokens   # after lower-case
    assert "narsapur" in tokens or "Narsapur".lower() in [t.lower() for t in tokens]


def test_classify_fills_house():
    resp = GeocodeResponse()
    _classify_address_parts(resp, ["3-12", "MainStreet", "Narsapur"])
    assert resp.house == "3-12"


def test_classify_fills_landmark():
    resp = GeocodeResponse()
    _classify_address_parts(resp, ["BigHospital", "SomeLocality"])
    assert resp.landmark is not None
