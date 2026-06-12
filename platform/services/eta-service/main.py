"""
BiGeo ETA Service — Bedrock Haiku-powered delivery time prediction
"""

from __future__ import annotations

import json
import math
import os
from typing import Any

import boto3
from fastapi import FastAPI
from pydantic import BaseModel

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
bedrock    = boto3.client("bedrock-runtime", region_name=AWS_REGION)

app = FastAPI(title="BiGeo ETA Service", version="1.0.0")

VEHICLE_SPEEDS = {"truck": 45, "mini_truck": 50, "bike": 35, "auto": 30, "default": 40}
ROAD_FACTORS   = {"highway": 1.0, "state": 0.85, "district": 0.70, "village": 0.55}

class ETARequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    vehicle_type: str = "truck"
    cargo_kg: float = 0
    road_type: str = "district"
    use_ai: bool = False

@app.get("/health")
def health():
    return {"status": "ok", "service": "eta-service"}

@app.post("/predict")
def predict_eta(req: ETARequest) -> dict[str, Any]:
    distance_km = _haversine(req.origin_lat, req.origin_lng, req.dest_lat, req.dest_lng)
    speed       = VEHICLE_SPEEDS.get(req.vehicle_type, 40)
    road_factor = ROAD_FACTORS.get(req.road_type, 0.70)
    cargo_factor = 1 + (req.cargo_kg / 5000) * 0.15

    base_minutes = (distance_km / (speed * road_factor)) * 60 * cargo_factor
    loading_min  = min(30, req.cargo_kg / 100)
    buffer_min   = 15

    total_min = round(base_minutes + loading_min + buffer_min)

    result: dict[str, Any] = {
        "eta_minutes":  total_min,
        "distance_km":  round(distance_km, 2),
        "breakdown": {
            "transit_min":  round(base_minutes),
            "loading_min":  round(loading_min),
            "buffer_min":   buffer_min,
        },
        "confidence": 0.75,
        "ai_enhanced": False,
    }

    if req.use_ai and distance_km > 0:
        ai_result = _ai_enhance(req, result)
        if ai_result:
            result.update(ai_result)
            result["ai_enhanced"] = True

    return result

def _ai_enhance(req: ETARequest, base: dict) -> dict | None:
    prompt = f"""Rural India logistics ETA prediction. Return JSON only.
Origin→Destination: {round(base['distance_km'], 1)}km
Vehicle: {req.vehicle_type}, Cargo: {req.cargo_kg}kg, Road: {req.road_type}
Base estimate: {base['eta_minutes']} minutes

Adjust for: monsoon season risks, rural road conditions, typical delays.
Return: {{"adjusted_eta_minutes": int, "confidence": float, "risk_factors": [str]}}"""

    try:
        resp = bedrock.invoke_model(
            modelId="global.anthropic.claude-haiku-4-5-20251001",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 256,
                "messages": [{"role": "user", "content": prompt}],
            }),
        )
        body = json.loads(resp["body"].read())
        text = body["content"][0]["text"]
        s, e = text.find("{"), text.rfind("}") + 1
        data = json.loads(text[s:e])
        return {"eta_minutes": data.get("adjusted_eta_minutes", base["eta_minutes"]),
                "confidence":  data.get("confidence", 0.75),
                "risk_factors": data.get("risk_factors", [])}
    except Exception as exc:
        print(f"AI enhance failed: {exc}")
        return None

def _haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))
