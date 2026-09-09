"""
Load pincode → lat/lon/state/district into DynamoDB bigeo-pincodes table.
Groups multiple offices per pincode and averages coordinates.
"""
import csv, collections, boto3, sys
from decimal import Decimal

TABLE = "bigeo-pincodes"
CSV_PATH = "/home/user/BiGeo/external-data/indian-pincode/data/raw-data.csv"
REGION = "ap-south-1"

def title(s):
    return " ".join(w.capitalize() for w in s.strip().split()) if s else ""

def load():
    pins = collections.defaultdict(list)
    with open(CSV_PATH) as f:
        for r in csv.DictReader(f):
            try:
                lat = float(r["latitude"])
                lon = float(r["longitude"])
                if not lat or not lon:
                    continue
                pins[r["pincode"].strip()].append({
                    "lat": lat, "lon": lon,
                    "state": title(r["statename"]),
                    "district": title(r["district"]),
                    "circle": title(r.get("circlename", "")),
                    "division": title(r.get("divisionname", "")),
                })
            except (ValueError, KeyError):
                continue

    ddb = boto3.resource("dynamodb", region_name=REGION)
    table = ddb.Table(TABLE)

    total = 0
    with table.batch_writer() as batch:
        for pincode, entries in pins.items():
            avg_lat = sum(e["lat"] for e in entries) / len(entries)
            avg_lon = sum(e["lon"] for e in entries) / len(entries)
            batch.put_item(Item={
                "pincode": pincode,
                "lat": Decimal(str(round(avg_lat, 6))),
                "lon": Decimal(str(round(avg_lon, 6))),
                "state": entries[0]["state"],
                "district": entries[0]["district"],
                "circle": entries[0]["circle"],
                "division": entries[0]["division"],
                "office_count": len(entries),
            })
            total += 1
            if total % 1000 == 0:
                print(f"  {total} pincodes loaded...", flush=True)

    print(f"Done. Loaded {total} pincodes into {TABLE}.")

if __name__ == "__main__":
    load()
