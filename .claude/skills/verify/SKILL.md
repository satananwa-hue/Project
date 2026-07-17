# NightCheck Verify Skill

## Servers
- **API** (NestJS): `launch.json` name `api`, port 4000, prefix `/api`
- **Mobile web** (Flutter): `launch.json` name `mobile-web`, port 5001

Both managed via `preview_start { name }`.

## Test credentials
- Admin: `admin@nightcheck.dev` / `Admin@NightCheck1`
- Creator 01: `creator01@nightcheck.dev` / `Demo@Creator01`

Login: `POST /api/auth/login` → `{ accessToken, account: { points } }`
Me: `GET /api/auth/me` (Bearer token) → `{ points, ... }`

## Database
SQLite at `apps/api/prisma/dev.db`. Tables: `accounts`, `venues`, `reviews`, `share_events`, `invites`.
Query via: `sqlite3 "apps/api/prisma/dev.db" "SELECT ..."`

## Key flows to drive

### Points system (API)
- Create review: `POST /api/reviews` — formula: 1 (rating) + 10 (text) + 5 (text>200 chars) + 2×notes
- Social share: `POST /api/reviews/:id/social-share` → `{ points: 5 }`
- Delete review: `DELETE /api/reviews/:id` (204) — deducts review-earned pts, NOT share pts

### Level system (Flutter)
- Tap avatar → profile sheet → shows `Lv.N · Title`, progress bar, character image
- Assets at `assets/images/levels/level_1.png` through `level_5.png` (transparent bg)

### Share card (Flutter)
- After writing review → review-submitted screen → tap Instagram or Facebook
- Awards +5 via API, shows story card dialog with level character + venue name + pts

## Known issue
- Browser screenshot tool times out in some sessions. Fall back to:
  - API verification via PowerShell `Invoke-RestMethod`
  - `sqlite3` for direct DB state checks
  - `preview_logs` + `read_console_messages` for runtime confirmation

## Bonus threshold
`> 200` (strictly), not `>= 200`. 200-char review does NOT get the bonus.
