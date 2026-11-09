# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

`ordergo/` is a git repo (workspace) with two **git submodules**, each its own repo with its own toolchain:

- `ordergo-api/` — NestJS 11 + Mongoose 9 + MongoDB backend (TypeScript). **The only backend.** The old .NET `ordergo-api-v2` was dropped (2026-11-09); ignore any .NET/linq2db/PostgreSQL/SignalR mentions that survive in older docs.
- `ordergo-web/` — Next.js 15 (App Router, Turbopack) + React 19 + Tailwind 4 + shadcn/ui: admin, POS, KDS and the customer QR-ordering pages.
- `docs/` — product/architecture docs (Vietnamese). `docs/08-database/` is the source of truth for Mongo schema.
- `docker-compose.infra.yml` (Mongo replica set `rs0` + Redis, daily dev), `docker-compose.yml` (full prod-style), `docker-compose.dev.yml` (override).

There is no top-level package.json: `cd` into a submodule before running commands. Commit inside the submodule first, then commit the updated submodule pointer in the workspace repo.

## Toolchain

- Node 20, **Yarn 4.18.1 via corepack** (`packageManager` in each `package.json`): run `corepack enable` once. The globally installed yarn may be older and reject `.yarnrc.yml` (`approvedGitRepositories`).
- Do not keep `npmMinimalAgeGate: 0` if Yarn adds it to `.yarnrc.yml` — that disables the supply-chain age gate.
- Line endings are LF everywhere (`.gitattributes`); prettier enforces `endOfLine: lf`.

## Common commands

### `ordergo-api`
```bash
yarn start:dev          # watch mode, http://localhost:4000/v1, Swagger at /api-docs
yarn build              # nest build → dist/
yarn lint:check         # eslint, no --fix (CI). `yarn lint` auto-fixes.
yarn format:check
yarn test               # jest unit tests (*.spec.ts next to code, rootDir src/)
yarn test -- src/modules/tenant          # one folder / file
yarn test:e2e           # test/app.e2e-spec.ts — needs a real Mongo (see below)
yarn seed:demo          # build + reset + seed the demo café "Cà phê Góc Phố"
```
- Config: `.env.development` (committed, dev-only secrets) then `.env`; real env vars win. Joi validation requires `MONGODB_URI` and `JWT_*_SECRET` ≥ 32 chars.
- E2E uses DB `ordergo_e2e` (dropped each run) at `E2E_MONGODB_URI` (default `mongodb://localhost:27017/?directConnection=true`).
- Port 27017 may be taken on a dev machine: start infra with `MONGO_PORT=27018 docker compose -f docker-compose.infra.yml up -d` and point `MONGODB_URI`/`E2E_MONGODB_URI` at 27018.
- Demo seed logins: `0900000001`…`0900000005` (owner, venue_manager, cashier, server, kitchen), password `ordergo123` (override with `DEMO_PASSWORD`). Reset only touches the demo tenant. VietQR bank account only via `DEMO_BANK_*` env — never invent an account number.

### `ordergo-web`
```bash
yarn dev                # http://localhost:3000 (API from NEXT_PUBLIC_API_URL, default http://localhost:4000/v1)
yarn build
yarn tsc --noEmit
yarn lint               # NOTE: eslint.config.mjs is empty, so this checks nothing yet
yarn format:check
```

## Backend architecture (`ordergo-api/src`)

- `modules/<name>/` — one Nest module per bounded context: `*.module.ts`, `*.controller.ts` (thin), `*.service.ts`, `dto/` (class-validator), `schemas/` (Mongoose), `repositories/`. Modules: identity, tenant, catalog, table, table-session, order, payment, reporting, customer, loyalty, otp, public-api.
- **Tenant isolation (read before touching auth or data access):**
  1. `TenantContextMiddleware` opens an `AsyncLocalStorage` context from the JWT only.
  2. Global `JwtAuthGuard` verifies the JWT, then `TenantAccessService.resolve()` takes the requested tenant/venue (`X-Tenant-Id` / `X-Venue-Id` headers, falling back to JWT claims) and **checks it against active memberships in the DB** → 403 `TENANT_ACCESS_DENIED` / `VENUE_ACCESS_DENIED`. Permissions come from the membership, not the JWT. It then mutates the ALS context and sets `req.user`.
  3. Global `PermissionsGuard` enforces `@RequirePermissions(...)` (`*` = owner). Role → permission map: `ROLE_PERMISSIONS` in `modules/tenant/schemas/membership.schema.ts`.
  4. Repositories extend `BaseTenantRepository` (`shared/base/`), which injects `tenantId` + `deletedAt: null` into every query and stamps audit fields. Never read tenant from headers in services; never query a model raw without adding `tenantId`.
  - `@Public()` routes skip the guard and only see the JWT tenant. `public-api` (customer QR flow) builds its own context via `tenantCtx.run(...)` from a table session.
- Responses are wrapped `{ data }` by `TransformInterceptor`; errors are `{ error: { code, message, details, requestId } }` from `AllExceptionsFilter`. Throw `HttpException`s with `{ code, message }` (Vietnamese message).
- IDs: UUID v7 from `shared/utils/uuid.ts` (`newId()`), stored in `id`; Mongo `_id` is not a business key. Money is `{ amount: integer VND, currency: 'VND' }` (`shared/utils/money.ts`).
- Cross-module events go to the `order_events` outbox collection; no broker yet.
- **Order lifecycle:** lines with `sentToKitchenAt = null` are not yet sent (KDS hides them). `POST /orders/:id/lines` appends, `send-to-kitchen` sends every unsent line, `DELETE /orders/:id/lines/:lineId` deletes unsent lines or cancels sent ones (needs `order.cancel`). Pricing and derived order status live in pure functions in `modules/order/order-pricing.ts` (prices include VAT; service charge = `venue.settings.serviceChargeRate` × (subtotal − discount)). Creating an order occupies its table; paid → table `cleaning`, cancelled/moved → `available` once no open order remains.
- Permissions: `common/auth/permissions.ts` `hasPermission()` — `*` = all, `<resource>.manage` implies every `<resource>.*`. Membership permissions are stored per membership at creation, so editing `ROLE_PERMISSIONS` does not change existing members.
- Dates for reports/payments are computed in the venue timezone via `shared/utils/time.ts` (`dayRange`, `hourIn`) — never use server-local `setHours`.
- Uploads: `POST /v1/uploads/images` (multipart `file`, JPG/PNG/WEBP by magic bytes, ≤2MB, `menu.manage`) saves to `UPLOAD_DIR` and returns a relative `/uploads/<tenantId>/<uuid>.<ext>`, served statically outside `/v1` (`app.setup.ts`). Web resolves it with `mediaUrl()` (`lib/media.ts`).
- Known gaps: realtime is polling (Socket.IO planned, Phase 2); no staff invite/role API yet (Phase 3).

## Web architecture (`ordergo-web/src`)

- `app/(main)/*` authenticated screens (pos, tables, orders, kds, menu, staff, customers, chef, payments); `app/(public)/m/[tenantSlug]/*` customer QR ordering; `app/login`, `app/setup` (setup wizard).
- Data: axios client `lib/api-client.ts` (attaches Bearer + `X-Tenant-Id`/`X-Venue-Id` from localStorage, refresh on 401) + TanStack Query hooks in `hooks/api/*`. Add API calls as hooks there, not `fetch` in components. Public QR pages use `lib/public-api-client.ts`.
- POS (`app/(main)/pos`): selecting a table with an open order shows its lines ("Đã gọi"); the cart is "Gọi thêm" and is appended to that order, never a new order. Takeaway opens payment right after sending. Payment dialog handles discount, cash tendered/change, VietQR (`GET /orders/:id/payment-qr`) and card; receipts print from `app/print/receipt/[orderId]` (80mm, `?auto=1` auto-prints).
- Shared helpers: `lib/format.ts` (`formatVnd`, status labels/classes), `lib/media.ts`, `components/image-upload.tsx`. Radix `Select` bound to react-hook-form must ignore `""` from `onValueChange` (it fires while options are still loading).
- Mock data from `app/data.ts` remains only in chef, customers and staff pages. Navigation is defined in `lib/nav-config.ts`; `/reports` is linked but doesn't exist yet.
- Pages render inside the `(main)` layout's `<main>`, which owns vertical scrolling; full-height screens (POS, KDS) size themselves with `h-svh`.
- State: Zustand stores in `lib/*-store.ts`. UI primitives: `components/ui/*` (shadcn/Radix); use `cn()` from `@/lib/utils` and the `@/*` alias.

## Conventions

- All user-facing text and code comments are Vietnamese — keep them Vietnamese when refactoring.
- Work on a branch; never commit directly to `main` in any of the three repos.
