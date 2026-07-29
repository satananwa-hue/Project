#!/usr/bin/env python3
"""
Import Bangkok bars into the nightcheck database.

Supports two CSV formats:
  • bangkok_bars_google.csv   (from fetch_bangkok_bars_google.py)  — has 'category' column
  • bangkok_bars_osm.csv      (from fetch_bangkok_bars.py)         — has 'type' column

Usage:
  python scripts/import_bars.py                              # defaults to Google CSV
  python scripts/import_bars.py --csv bangkok_bars_osm.csv  # OSM fallback
  python scripts/import_bars.py --dry                        # preview without writing
"""

import csv, json, sys, time, argparse, getpass

try:
    import requests
except ImportError:
    sys.exit("pip install requests")

DEFAULT_API = "https://nightcheck-apiv.onrender.com/api"
DEFAULT_CSV = "bangkok_bars_google.csv"

OSM_TYPE_TO_CATEGORY = {
    "bar":       "BAR",
    "pub":       "BAR",
    "nightclub": "CLUB",
}

parser = argparse.ArgumentParser()
parser.add_argument("--api", default=DEFAULT_API)
parser.add_argument("--csv", default=DEFAULT_CSV)
parser.add_argument("--dry", action="store_true", help="Preview only, no writes")
args = parser.parse_args()

API = args.api.rstrip("/")
CSV_PATH = args.csv

# ── Auth ─────────────────────────────────────────────────────────────────────
print(f"Target API : {API}")
print(f"CSV file   : {CSV_PATH}\n")
email    = input("Admin email: ").strip()
password = getpass.getpass("Admin password: ")

res = requests.post(f"{API}/auth/login",
                    json={"email": email, "password": password}, timeout=15)
if res.status_code != 200:
    sys.exit(f"Login failed ({res.status_code}): {res.text}")

token = res.json().get("access_token") or res.json().get("accessToken")
if not token:
    sys.exit(f"No token in response: {res.text}")

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("✓ Logged in\n")

# ── Read CSV ─────────────────────────────────────────────────────────────────
try:
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
except FileNotFoundError:
    sys.exit(
        f"CSV not found: {CSV_PATH}\n"
        "Run fetch_bangkok_bars_google.py first (needs GOOGLE_PLACES_KEY env var)"
    )

print(f"Total rows : {len(rows)}")

# Determine format by checking which columns exist
sample = rows[0] if rows else {}
is_google_format = "category" in sample   # Google CSV has 'category'; OSM CSV has 'type'

def get_category(row):
    if is_google_format:
        return row.get("category", "BAR").strip() or "BAR"
    osm_type = row.get("type", "bar").strip().lower()
    return OSM_TYPE_TO_CATEGORY.get(osm_type, "BAR")

# Remove rows without valid coords or names
def valid(row):
    try:
        float(row.get("lat", "")); float(row.get("lng", ""))
    except (TypeError, ValueError):
        return False
    name = row.get("name", "").strip()
    return bool(name) and name not in ("(ไม่มีชื่อ)", "(no name)")

rows = [r for r in rows if valid(r)]
print(f"After filter: {len(rows)}")

# ── Fetch existing venues to skip duplicates ──────────────────────────────────
print("Fetching existing venues to skip duplicates …")
existing_coords = set()
try:
    # Use a wide search to fetch all published venues
    ex_res = requests.get(
        f"{API}/venues",
        params={"pageSize": "9999", "publishedOnly": "true"},
        timeout=30
    )
    if ex_res.status_code == 200:
        ex_body = ex_res.json()
        ex_items = ex_body.get("items", [])
        for v in ex_items:
            lat_r = round(float(v["lat"]), 4)
            lng_r = round(float(v["lng"]), 4)
            existing_coords.add((lat_r, lng_r))
        print(f"  {len(ex_items)} existing venues loaded ({len(existing_coords)} unique coords)")
    else:
        print(f"  [WARN] Could not fetch existing venues ({ex_res.status_code}), skipping dedup")
except Exception as e:
    print(f"  [WARN] Dedup fetch failed: {e}")

def is_duplicate(lat, lng):
    # Round to 4 decimal places (~11m precision) for matching
    return (round(lat, 4), round(lng, 4)) in existing_coords

# Filter out duplicates
before = len(rows)
rows = [r for r in rows if not is_duplicate(float(r["lat"]), float(r["lng"]))]
print(f"After dedup: {len(rows)}  (skipped {before - len(rows)} already in DB)\n")

# ── Import ───────────────────────────────────────────────────────────────────
ok = err = 0

for i, row in enumerate(rows, 1):
    lat = float(row["lat"])
    lng = float(row["lng"])
    category = get_category(row)
    address  = row.get("address", "").strip() or f"Bangkok ({lat:.4f}, {lng:.4f})"

    payload = {
        "name":        row["name"].strip(),
        "category":    category,
        "address":     address,
        "lat":         lat,
        "lng":         lng,
        "city":        "Bangkok",
        "isPublished": True,
    }

    if args.dry:
        print(f"[DRY] {i}/{len(rows)}  {payload['name']:40s}  {category}")
        ok += 1
        continue

    try:
        r = requests.post(f"{API}/admin/venues", headers=headers,
                          data=json.dumps(payload), timeout=15)
        if r.status_code in (200, 201):
            ok += 1
            if i % 50 == 0:
                print(f"  {i}/{len(rows)} ({ok} ok, {err} err)")
        else:
            err += 1
            print(f"  ✗ [{r.status_code}] {payload['name']}: {r.text[:120]}")
    except Exception as e:
        err += 1
        print(f"  ✗ {payload['name']}: {e}")

    time.sleep(1.0)   # 1 req/s — Render free tier limit

print(f"\n{'[DRY RUN] ' if args.dry else ''}Done:")
print(f"  ✓ {ok} imported")
print(f"  ✗ {err} errors")
