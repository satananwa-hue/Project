#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch Bangkok bars/pubs/nightclubs from Google Places API (New).
MERGES into an existing bangkok_bars_google.csv instead of overwriting,
so multiple runs with different grid sizes accumulate results safely.

Requirements:  pip install requests
Setup:
  set GOOGLE_PLACES_KEY=your_key_here   (Windows)
  export GOOGLE_PLACES_KEY=your_key_here (Mac/Linux)
"""

import csv, os, sys, time, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    import requests
except ImportError:
    sys.exit("Run first:  pip install requests")

# ── API key ───────────────────────────────────────────────────────────────────
API_KEY = os.environ.get("GOOGLE_PLACES_KEY", "")
if not API_KEY:
    sys.exit(
        "GOOGLE_PLACES_KEY environment variable is not set.\n"
        "Windows: set GOOGLE_PLACES_KEY=your_key_here\n"
        "Mac/Linux: export GOOGLE_PLACES_KEY=your_key_here"
    )

# ── Bangkok + ปริมณฑล bounding box ──────────────────────────────────────────
LAT_MIN, LAT_MAX = 13.35, 14.15
LNG_MIN, LNG_MAX = 100.10, 101.10

# ── Grid settings ─────────────────────────────────────────────────────────────
# 25×25 = 625 cells × 2 types = 1,250 requests  (~$40 at $0.032/req, ~21 min)
# 1500m radius: small cells to avoid hitting the 20-result cap in dense areas.
# Merges with existing CSV so previous runs are not lost.
GRID_N        = 25
SEARCH_RADIUS = 1500   # metres

INCLUDE_TYPES = ["bar", "night_club"]
OUT_CSV       = "bangkok_bars_google.csv"
FIELDNAMES    = ["name", "category", "lat", "lng", "address", "phone", "gmaps"]

# ── Google Places Nearby Search (New) ────────────────────────────────────────
NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"

def search_nearby(lat, lng, radius, place_type):
    payload = {
        "includedTypes":   [place_type],
        "maxResultCount":  20,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius),
            }
        },
    }
    hdrs = {
        "Content-Type":    "application/json",
        "X-Goog-Api-Key":  API_KEY,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.location,"
            "places.formattedAddress,places.types,"
            "places.internationalPhoneNumber"
        ),
    }
    for attempt in range(5):
        r = requests.post(NEARBY_URL, json=payload, headers=hdrs, timeout=20)
        if r.status_code == 429:
            wait = 3 * (2 ** attempt)   # 3 / 6 / 12 / 24 / 48 s
            print(f"  [429] rate-limit, waiting {wait}s …")
            time.sleep(wait)
            continue
        if r.status_code == 400:
            print(f"  [WARN] 400 ({lat:.4f},{lng:.4f}) {place_type}: {r.text[:200]}")
            return []
        r.raise_for_status()
        return r.json().get("places", [])
    print(f"  [SKIP] 5 retries exhausted ({lat:.4f},{lng:.4f}) {place_type}")
    return []

def to_category(types):
    return "CLUB" if "night_club" in [t.lower() for t in (types or [])] else "BAR"

def gmaps_key(lat, lng):
    return f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"

# ── Load existing CSV (merge mode) ───────────────────────────────────────────
all_rows = {}   # gmaps_key → row dict  (deduplication by exact coordinate)

if os.path.exists(OUT_CSV):
    with open(OUT_CSV, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            k = row.get("gmaps", "")
            if k:
                all_rows[k] = row
    print(f"Loaded {len(all_rows)} existing venues from {OUT_CSV}")
else:
    print("No existing CSV — starting fresh")

already_had = len(all_rows)

# ── Fetch ─────────────────────────────────────────────────────────────────────
req_count = GRID_N * GRID_N * len(INCLUDE_TYPES)
cost_usd  = req_count * 0.032
print(f"\nGrid {GRID_N}×{GRID_N}, radius {SEARCH_RADIUS}m → "
      f"{req_count} requests  ~${cost_usd:.0f}  ~{req_count//60}min\n")

seen_ids = set()   # Google Place IDs seen in this run (dedup within run)

for i in range(GRID_N):
    for j in range(GRID_N):
        cell_lat = LAT_MIN + (LAT_MAX - LAT_MIN) * (i + 0.5) / GRID_N
        cell_lng = LNG_MIN + (LNG_MAX - LNG_MIN) * (j + 0.5) / GRID_N

        for ptype in INCLUDE_TYPES:
            try:
                results = search_nearby(cell_lat, cell_lng, SEARCH_RADIUS, ptype)
                added = 0
                for p in results:
                    pid = p.get("id", "")
                    if not pid or pid in seen_ids:
                        continue
                    seen_ids.add(pid)

                    loc  = p.get("location", {})
                    plat = loc.get("latitude")
                    plng = loc.get("longitude")
                    if plat is None or plng is None:
                        continue
                    name = (p.get("displayName") or {}).get("text", "").strip()
                    if not name:
                        continue

                    key = gmaps_key(plat, plng)
                    if key not in all_rows:
                        all_rows[key] = {
                            "name":     name,
                            "category": to_category(p.get("types", [])),
                            "lat":      round(plat, 7),
                            "lng":      round(plng, 7),
                            "address":  p.get("formattedAddress", ""),
                            "phone":    p.get("internationalPhoneNumber", ""),
                            "gmaps":    key,
                        }
                        added += 1

                print(f"  ({i:02d},{j:02d}) {ptype:10s}: "
                      f"{len(results):2d} results  +{added} new  total={len(all_rows)}")
            except Exception as e:
                print(f"  ({i:02d},{j:02d}) {ptype}: ERROR {e}")

            time.sleep(1.0)   # 1 req/s — stay well under QPM limit

# ── Save merged CSV ───────────────────────────────────────────────────────────
rows = sorted(all_rows.values(), key=lambda r: r["name"].lower())

with open(OUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=FIELDNAMES)
    w.writeheader()
    w.writerows(rows)

newly_added = len(all_rows) - already_had
print(f"\nDone!  {OUT_CSV}  →  {len(rows)} total  (+{newly_added} new this run)")
