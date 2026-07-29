#!/usr/bin/env python3
"""
Import Bangkok bars into the nightcheck database.

Deduplication strategy (layered):
  1. Within CSV  — skip if a row with the same normalised name already processed
  2. Against DB  — skip if an existing venue matches by name OR by coordinates (5dp ~1m)

Usage:
  python scripts/import_bars.py                              # defaults to Google CSV
  python scripts/import_bars.py --csv bangkok_bars_osm.csv  # OSM fallback
  python scripts/import_bars.py --dry                        # preview without writing
"""

import csv, json, sys, time, argparse, getpass, unicodedata, re

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

# ── Helpers ───────────────────────────────────────────────────────────────────
def norm_name(name: str) -> str:
    """Lowercase, strip accents, collapse whitespace, remove punctuation."""
    name = name.lower().strip()
    name = unicodedata.normalize("NFKD", name)
    name = re.sub(r"[^\w\s]", "", name, flags=re.UNICODE)
    name = re.sub(r"\s+", " ", name)
    return name

def coord_key(lat: float, lng: float) -> tuple:
    return (round(lat, 5), round(lng, 5))   # ~1m precision

# ── Read CSV ──────────────────────────────────────────────────────────────────
try:
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
except FileNotFoundError:
    sys.exit(
        f"CSV not found: {CSV_PATH}\n"
        "Run fetch_bangkok_bars_google.py first (needs GOOGLE_PLACES_KEY env var)"
    )

print(f"Total rows in CSV : {len(rows)}")

is_google_format = "category" in (rows[0] if rows else {})

def get_category(row):
    if is_google_format:
        return row.get("category", "BAR").strip() or "BAR"
    return OSM_TYPE_TO_CATEGORY.get(row.get("type", "bar").strip().lower(), "BAR")

def valid(row):
    try:
        float(row.get("lat", "")); float(row.get("lng", ""))
    except (TypeError, ValueError):
        return False
    name = row.get("name", "").strip()
    return bool(name) and name not in ("(ไม่มีชื่อ)", "(no name)")

rows = [r for r in rows if valid(r)]
print(f"After validity    : {len(rows)}")

# ── Dedup within CSV (same normalised name) ───────────────────────────────────
seen_names_csv = set()
unique_rows = []
for r in rows:
    key = norm_name(r["name"])
    if key not in seen_names_csv:
        seen_names_csv.add(key)
        unique_rows.append(r)
print(f"After CSV dedup   : {len(unique_rows)}  (dropped {len(rows) - len(unique_rows)} intra-CSV dupes)")
rows = unique_rows

# ── Fetch existing venues from DB ─────────────────────────────────────────────
print("\nFetching existing venues from DB …")
existing_names  = set()   # normalised names
existing_coords = set()   # (lat 5dp, lng 5dp)

try:
    ex_res = requests.get(
        f"{API}/venues",
        params={"pageSize": "9999", "publishedOnly": "true"},
        timeout=30
    )
    if ex_res.status_code == 200:
        ex_items = ex_res.json().get("items", [])
        for v in ex_items:
            existing_names.add(norm_name(v["name"]))
            existing_coords.add(coord_key(float(v["lat"]), float(v["lng"])))
        print(f"  {len(ex_items)} existing venues  "
              f"({len(existing_names)} unique names, {len(existing_coords)} unique coords)")
    else:
        print(f"  [WARN] {ex_res.status_code} — dedup disabled, ALL rows will be attempted")
except Exception as e:
    print(f"  [WARN] {e} — dedup disabled, ALL rows will be attempted")

def is_db_duplicate(name: str, lat: float, lng: float) -> str | None:
    if norm_name(name) in existing_names:
        return "name"
    if coord_key(lat, lng) in existing_coords:
        return "coord"
    return None

before = len(rows)
new_rows, skipped = [], 0
for r in rows:
    reason = is_db_duplicate(r["name"], float(r["lat"]), float(r["lng"]))
    if reason:
        skipped += 1
    else:
        new_rows.append(r)

rows = new_rows
print(f"\nAfter DB dedup    : {len(rows)}  (skipped {skipped} already in DB)\n")

# ── Import ────────────────────────────────────────────────────────────────────
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
        print(f"[DRY] {i}/{len(rows)}  {payload['name']:45s}  {category}")
        ok += 1
        continue

    try:
        r = requests.post(f"{API}/admin/venues", headers=headers,
                          json=payload, timeout=15)
        if r.status_code in (200, 201):
            ok += 1
            # Add to seen sets so later rows in this batch don't re-import
            existing_names.add(norm_name(payload["name"]))
            existing_coords.add(coord_key(lat, lng))
            if i % 50 == 0:
                print(f"  {i}/{len(rows)}  ({ok} ok, {err} err)")
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
