#!/usr/bin/env python3
"""
Process Tier 1 data sources for BiGeo Knowledge Base:
1. PMGSY habitations → GPS-tagged habitation points (all states)
2. Indian Pincode → 165K post offices with lat/lng
"""
import os, json, csv, glob, shapefile
from pathlib import Path

KB_DIR = Path("/home/user/BiGeo/knowledge-base")
KB_DIR.mkdir(exist_ok=True)
CHUNK_SIZE = 5000

# ── State name normalisation ──────────────────────────────────────────
STATE_MAP = {
    "AndhraPradesh": "Andhra Pradesh", "ArunachalPradesh": "Arunachal Pradesh",
    "Assam": "Assam", "Bihar": "Bihar", "Chhattisgarh": "Chhattisgarh",
    "Gujarat": "Gujarat", "Haryana": "Haryana", "HimachalPradesh": "Himachal Pradesh",
    "JammuAndKashmir": "Jammu & Kashmir", "Jharkhand": "Jharkhand",
    "Karnataka": "Karnataka", "Kerala": "Kerala", "Ladakh": "Ladakh",
    "MadhyaPradesh": "Madhya Pradesh", "Maharashtra": "Maharashtra",
    "Manipur": "Manipur", "Meghalaya": "Meghalaya", "Mizoram": "Mizoram",
    "Nagaland": "Nagaland", "Odisha": "Odisha", "Punjab": "Punjab",
    "Rajasthan": "Rajasthan", "Sikkim": "Sikkim", "Tamilnadu": "Tamil Nadu",
    "Telangana": "Telangana", "Tripura": "Tripura", "UttarPradesh": "Uttar Pradesh",
    "Uttarakhand": "Uttarakhand", "WestBengal": "West Bengal",
}

# ── 1. PMGSY Habitations ─────────────────────────────────────────────
print("\n📍 Processing PMGSY Habitations (all states)...")
HAB_DIR = Path("/home/user/BiGeo/pmgsy-geosadak/data/Habitation")

all_habitations = []
state_counts = {}

for state_key, state_name in STATE_MAP.items():
    hab_dir = HAB_DIR / f"{state_key}_hab"
    if not hab_dir.exists():
        continue
    shp_files = list(hab_dir.glob("*.shp"))
    if not shp_files:
        continue
    try:
        sf = shapefile.Reader(str(shp_files[0]))
        fields = [f[0] for f in sf.fields[1:]]
        count = 0
        for rec, shape in zip(sf.records(), sf.shapes()):
            if not shape.points:
                continue
            lng, lat = shape.points[0]
            # Basic bounds check for India
            if not (6 < lat < 38 and 68 < lng < 98):
                continue
            d = dict(zip(fields, rec))
            hab_name = str(d.get("HAB_NAME", "")).strip()
            if not hab_name:
                continue
            all_habitations.append({
                "type": "pmgsy_habitation",
                "name": hab_name,
                "state": state_name,
                "hab_id": d.get("HAB_ID"),
                "state_id": d.get("STATE_ID"),
                "district_id": d.get("DISTRICT_I"),
                "block_id": d.get("BLOCK_ID"),
                "population": d.get("TOT_POPULA"),
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "source": "pmgsy",
            })
            count += 1
        state_counts[state_name] = count
        print(f"  ✅ {state_name}: {count:,} habitations")
    except Exception as e:
        print(f"  ❌ {state_name}: {e}")

print(f"\n  Total habitations: {len(all_habitations):,}")

# Write habitations in chunks
print("  Writing habitation KB chunks...")
for i in range(0, len(all_habitations), CHUNK_SIZE):
    chunk = all_habitations[i:i+CHUNK_SIZE]
    chunk_num = str(i // CHUNK_SIZE + 1).zfill(3)
    fname = KB_DIR / f"pmgsy-habitations-{chunk_num}.json"
    with open(fname, "w") as f:
        json.dump(chunk, f, ensure_ascii=False)
    print(f"    Written {fname.name} ({len(chunk):,} records)")

print(f"  ✅ PMGSY done — {(len(all_habitations)//CHUNK_SIZE)+1} files")

# ── 2. Indian Pincode (165K post offices with GPS) ────────────────────
print("\n📮 Processing Indian Pincode dataset (165K post offices)...")
PINCODE_CSV = Path("/home/user/BiGeo/external-data/indian-pincode/data/raw-data.csv")

pincodes = []
seen = set()

with open(PINCODE_CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            lat = float(row.get("latitude", "") or 0)
            lng = float(row.get("longitude", "") or 0)
        except (ValueError, TypeError):
            lat, lng = None, None

        pincode = row.get("pincode", "").strip()
        if not pincode:
            continue

        pincodes.append({
            "type": "post_office",
            "pincode": pincode,
            "office_name": row.get("officename", "").strip(),
            "office_type": row.get("officetype", "").strip(),
            "district": row.get("district", "").strip().title(),
            "state": row.get("statename", "").strip().title(),
            "division": row.get("divisionname", "").strip(),
            "circle": row.get("circlename", "").strip(),
            "delivery": row.get("delivery", "").strip(),
            "lat": round(lat, 6) if lat else None,
            "lng": round(lng, 6) if lng else None,
            "source": "india-pincode",
        })

print(f"  Total post offices: {len(pincodes):,}")

# Write pincode chunks
print("  Writing pincode KB chunks...")
for i in range(0, len(pincodes), CHUNK_SIZE):
    chunk = pincodes[i:i+CHUNK_SIZE]
    chunk_num = str(i // CHUNK_SIZE + 1).zfill(3)
    fname = KB_DIR / f"postoffices-india-{chunk_num}.json"
    with open(fname, "w") as f:
        json.dump(chunk, f, ensure_ascii=False)
    print(f"    Written {fname.name} ({len(chunk):,} records)")

print(f"  ✅ Pincode done — {(len(pincodes)//CHUNK_SIZE)+1} files")

# ── Summary ───────────────────────────────────────────────────────────
print("\n" + "="*55)
print("BiGeo Knowledge Base — Tier 1 Data Summary")
print("="*55)
print(f"  PMGSY Habitations (GPS): {len(all_habitations):,}")
print(f"  Post Offices (GPS):      {len(pincodes):,}")
print(f"  NEW GPS points added:    {len(all_habitations) + len(pincodes):,}")
print(f"\n  Previous GPS villages:   101,881")
print(f"  New total GPS coverage:  ~{101881 + len(all_habitations):,} locations")
print("="*55)

# List all KB files
kb_files = sorted(KB_DIR.glob("*.json"))
total_size = sum(f.stat().st_size for f in kb_files)
print(f"\n  Total KB files: {len(kb_files)}")
print(f"  Total KB size:  {total_size/1024/1024:.1f} MB")
