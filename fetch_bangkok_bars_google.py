#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch Bangkok bars/pubs/nightclubs from Google Places API (New)
and save to  bangkok_bars_google.csv

Requirements:
  pip install requests

Setup:
  1. Enable "Places API (New)" in Google Cloud Console
  2. Create an API key and set:  set GOOGLE_PLACES_KEY=your_key_here   (Windows)
                                  export GOOGLE_PLACES_KEY=your_key_here (Mac/Linux)

The script searches a 5×5 grid over Bangkok so it covers the whole city
(Google Places returns max 20 results per request).
"""

import csv, os, sys, time, math, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    import requests
except ImportError:
    sys.exit("Run first:  pip install requests")

# ── API key from env (NEVER hardcode) ────────────────────────────────────────
API_KEY = os.environ.get("GOOGLE_PLACES_KEY", "")
if not API_KEY:
    sys.exit(
        "GOOGLE_PLACES_KEY environment variable is not set.\n"
        "Windows: set GOOGLE_PLACES_KEY=your_key_here\n"
        "Mac/Linux: export GOOGLE_PLACES_KEY=your_key_here"
    )

# ── Bangkok + ปริมณฑล bounding box ──────────────────────────────────────────
# Covers Bangkok, Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon
LAT_MIN, LAT_MAX = 13.35, 14.15
LNG_MIN, LNG_MAX = 100.10, 101.10

# Grid 12×12 = 144 cells × 2 types = 288 requests (~$9 at Places API rates)
# Smaller radius (3000m) splits the dense inner-city cells that hit the 20-result cap,
# surfacing venues that were hidden behind the cap in the 10×10 run.
GRID_N = 12
SEARCH_RADIUS = 3000   # metres

# Place types we want (Google's type names)
INCLUDE_TYPES = ["bar", "night_club"]

# ── Haversine helper ─────────────────────────────────────────────────────────
def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(a))

# ── Google Places Nearby Search (New) ───────────────────────────────────────
NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"

def search_nearby(lat, lng, radius, place_type):
    payload = {
        "includedTypes":   [place_type],
        "maxResultCount":  20,
        "locationRestriction": {
            "circle": {
                "center":    {"latitude": lat, "longitude": lng},
                "radius":    float(radius),
            }
        },
    }
    hdrs = {
        "Content-Type":   "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.location,"
            "places.formattedAddress,places.types,"
            "places.internationalPhoneNumber"
        ),
    }
    for attempt in range(5):
        r = requests.post(NEARBY_URL, json=payload, headers=hdrs, timeout=20)
        if r.status_code == 429:
            wait = 2 ** attempt * 3   # 3s, 6s, 12s, 24s, 48s
            print(f"  [429 rate-limit] waiting {wait}s …")
            time.sleep(wait)
            continue
        if r.status_code == 400:
            print(f"  [WARN] 400 at ({lat:.4f},{lng:.4f}) {place_type}: {r.text[:200]}")
            return []
        r.raise_for_status()
        return r.json().get("places", [])
    print(f"  [SKIP] gave up after 5 retries ({lat:.4f},{lng:.4f}) {place_type}")
    return []


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    req_count = GRID_N * GRID_N * len(INCLUDE_TYPES)
    print(f"Bangkok grid {GRID_N}×{GRID_N} × {len(INCLUDE_TYPES)} types = "
          f"{req_count} requests  (~{req_count}s ≈ {req_count//60}min)\n")

    all_places = {}  # id → dict  (deduplication by Google place ID)

    for i in range(GRID_N):
        for j in range(GRID_N):
            lat = LAT_MIN + (LAT_MAX - LAT_MIN) * (i + 0.5) / GRID_N
            lng = LNG_MIN + (LNG_MAX - LNG_MIN) * (j + 0.5) / GRID_N

            for ptype in INCLUDE_TYPES:
                try:
                    results = search_nearby(lat, lng, SEARCH_RADIUS, ptype)
                    for p in results:
                        pid = p.get("id", "")
                        if pid and pid not in all_places:
                            all_places[pid] = p
                    count = len(results)
                    print(f"  grid ({i},{j}) {ptype:10s}: {count} results  "
                          f"(total unique so far: {len(all_places)})")
                except Exception as e:
                    print(f"  grid ({i},{j}) {ptype}: ERROR {e}")

                time.sleep(1.0)    # 1 req/s — safe rate to avoid 429

    print(f"\nTotal unique places: {len(all_places)}")

    # Map Google types → our category
    def to_category(types):
        types = [t.lower() for t in (types or [])]
        if "night_club" in types:
            return "CLUB"
        return "BAR"

    rows = []
    for p in all_places.values():
        loc = p.get("location", {})
        lat = loc.get("latitude")
        lng = loc.get("longitude")
        if lat is None or lng is None:
            continue
        name = (p.get("displayName") or {}).get("text", "").strip()
        if not name:
            continue
        rows.append({
            "name":     name,
            "category": to_category(p.get("types", [])),
            "lat":      round(lat, 7),
            "lng":      round(lng, 7),
            "address":  p.get("formattedAddress", ""),
            "phone":    p.get("internationalPhoneNumber", ""),
            "gmaps":    f"https://www.google.com/maps/search/?api=1&query={lat},{lng}",
        })

    rows.sort(key=lambda r: r["name"].lower())

    out = "bangkok_bars_google.csv"
    with open(out, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["name","category","lat","lng","address","phone","gmaps"])
        w.writeheader()
        w.writerows(rows)

    print(f"Saved: {out}  ({len(rows)} venues)")


if __name__ == "__main__":
    main()
