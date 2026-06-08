# Crowned In His Glory 2026

A premium event website for The Church of Pentecost – Port Elizabeth District Youth Ministry. Handles ticket registration, digital ticket generation with QR codes, admin dashboard, and event check-in scanning.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, binds `0.0.0.0` for Android LAN access)
- `pnpm --filter @workspace/crowned-in-glory run dev` — run the frontend (port 24155)
- `pnpm --filter @workspace/admin-portal exec expo start` — Android admin app (dashboard, tickets, QR scanner)
- `bash scripts/test-api.sh` — smoke-test all API endpoints once the server is running
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` or `SUPABASE_DB_PASSWORD` — Postgres connection string
- Android admin app: set `EXPO_PUBLIC_API_URL` in `.env` (emulator: `http://10.0.2.2:8080`, real device: `http://<your-lan-ip>:8080`)
- Admin login: username `admin`, password `glory2026` (override with `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, Framer Motion, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Ticket QR codes: `qrcode` package
- Ticket download: `html2canvas`
- QR scanning: `html5-qrcode`
- Admin auth: JWT (`jsonwebtoken`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/tickets.ts` — tickets table
- `lib/db/src/schema/checkins.ts` — check-ins table
- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/crowned-in-glory/src/pages/` — all frontend pages
- `artifacts/api-server/src/lib/ticketNumber.ts` — ticket number generation (CG2026-XXXXXX)

## Architecture decisions

- Ticket numbers follow the pattern `CG2026-000001` (sequential, zero-padded to 6 digits)
- QR codes encode `{ ticketNumber, name, eventId }` as JSON — scanned at the door
- Admin auth uses a simple JWT with 24h expiry; credentials configurable via env vars
- No email field on registration — tickets identified by name + ticket number only
- Max capacity set at 250 in stats calculation (configurable in `routes/stats.ts`)
- Ticket download uses `html2canvas` to capture the rendered ticket DOM as a PNG

## Product

- **Landing page** (`/`) — Luxury hero with gold particles, countdown timer, event details, live ticket count
- **Registration** (`/register`) — Form (first name, last name, phone, gender, church assembly), no email
- **Ticket view** (`/ticket/:id`) — Digital gold ticket matching the physical design; downloadable as PNG
- **QR Scanner** (`/scan`) — Staff check-in tool with camera, green/orange/red result screens
- **Admin dashboard** (`/admin`) — Login, stats, all tickets table with search/filter/export/cancel

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any schema change in `lib/db/src/schema/`, run `pnpm run typecheck:libs` then `pnpm --filter @workspace/db run push`
- The `@workspace/db` lib must be rebuilt (`pnpm run typecheck:libs`) before `@workspace/api-server` can see new table exports
- Admin credentials default to `admin` / `glory2026` — change via env vars before going to production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
