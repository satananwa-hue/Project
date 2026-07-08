# NightCheck

Invite-only nightlife community for discovering and reviewing bars and clubs in Thailand.
Public users can discover; only invited reviewers can contribute.

## Monorepo layout

```
apps/
  api/    NestJS backend (REST API, Prisma/PostgreSQL+PostGIS, OTP auth, invites, venues, reviews)
  web/    Next.js website (SSR venue pages, search, SEO) - also the reviewer web experience for MVP
packages/
  shared-types/   Zod schemas + TS types shared between api and web
```

## Why website-first, not native apps first

Native iOS/Android apps are deferred past the initial MVP. The reviewer flows (write review,
upload photo, redeem invite) and public discovery (search, venue pages) ship first as a
responsive, SSR'd website, because:

- It gets Google indexing and organic discovery working immediately, which native apps can't do.
- It avoids app-store review latency while the invite/reputation loop is still being validated.
- Native (React Native + Expo) wraps the same API once the core loop is proven, so this isn't
  throwaway work - the backend and shared types are used unchanged by the future mobile app.

## Local development

Prerequisites: Node 20+, Docker (for local Postgres+PostGIS).

```bash
npm install
docker compose up -d          # starts Postgres+PostGIS on localhost:5432
cp apps/api/.env.example apps/api/.env   # fill in secrets locally, never commit .env
cd apps/api && npx prisma migrate deploy   # applies the committed migrations
cd ../..
npm run dev                   # runs api (port 4000) and web (port 3000) via turbo
```

After changing `prisma/schema.prisma`, generate a new migration with
`cd apps/api && npx prisma migrate dev --name <description>` against your local database.

## Data model

See `apps/api/prisma/schema.prisma` for the full schema. Key design decisions:

- **Invite graph** uses a materialized path (`User.invitePath`, e.g. `/admin/alice/bob/`) rather
  than naive parent pointers, so "top inviters" and subtree analytics are indexed prefix queries
  instead of recursive CTEs. `Invite` itself only stores single inviter→invitee edges.
- **Rating dimensions** (atmosphere, music, drinks, value, crowd, service, cleanliness) live in a
  separate `ReviewSubrating` table, not fixed columns, so adding a new dimension is a data change,
  not a migration. `VenueRatingAggregate` precomputes per-dimension averages so venue pages read
  one small row instead of scanning all reviews.
- **Cities** are first-class from day one (`City` model) so expansion beyond Bangkok never
  requires a schema redesign.
- **Phone numbers are never stored raw** - only `phoneHash` - to limit blast radius of a data
  breach given Thailand's PDPA obligations.

## Status

Early scaffold. See open tasks / issues for what's implemented vs. planned.
