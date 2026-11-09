# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

`D:\ordergo` is a workspace folder, not a single repo. It contains four sibling projects, each with its own toolchain (and `ordergo-api` / `ordergo-web` are independent git repos):

- `ordergo-api/` — NestJS 11 + MongoDB backend (TypeScript, yarn). Original/legacy API.
- `ordergo-api-v2/` — .NET 8 modular monolith (linq2db + SQL Server). Replacement API being built from a `RestaurantManagement_Full_Modular_Linq2DB.zip` scaffold.
- `ordergo-web/` — Next.js 15 (App Router, Turbopack) + React 19 + Tailwind 4 + shadcn/ui admin UI (Vietnamese).
- `ordergo-mobile/` — empty placeholder.

There is no top-level workspace, lockfile, or build orchestration: change directory into the specific project before running commands.

## Common commands

### `ordergo-api` (NestJS, yarn)
```bash
yarn install
yarn start:dev          # watch mode (default port 4000, Swagger at /api-docs)
yarn build              # nest build → dist/
yarn start:prod         # node dist/main
yarn lint               # eslint --fix on src,apps,libs,test
yarn format             # prettier write
yarn test               # jest (testRegex: *.spec.ts under src/)
yarn test -- path/to/file.spec.ts   # run a single test file
yarn test -- -t "name"  # filter by test name
yarn test:e2e           # jest with test/jest-e2e.json
yarn test:cov           # coverage → ../coverage
```
Requires `MONGODB_URI` (and optionally `MONGODB_DB`) in `.env.development`; `src/config/mongodb.ts` throws on startup if `MONGODB_URI` is missing.

### `ordergo-api-v2` (.NET 8)
```bash
dotnet restore RestaurantManagement.sln
dotnet build RestaurantManagement.sln
dotnet run --project src/Api/Restaurant.Api/Restaurant.Api.csproj
# launchSettings: https://localhost:59579 ; http://localhost:59580
```
Requires `ConnectionStrings:Default` (SQL Server) in appsettings — `Program.cs` calls `UseSqlServer(...)` on it. No test project yet.

### `ordergo-web` (Next.js 15)
```bash
yarn install
yarn dev                # next dev --turbopack (http://localhost:3000)
yarn build              # next build (Dockerfile expects standalone output)
yarn start              # next start
yarn lint               # next lint
```
The committed `eslint.config.mjs` is fully commented out, so `next lint` only runs the default Next ruleset. Path alias `@/*` → `src/*`. Production image is built via the multi-stage `Dockerfile` (Node 20 alpine, yarn 4 via corepack, expects Next standalone output and Sentry build secret).

## Architecture

### `ordergo-api` (NestJS) — early scaffold
- Standard Nest layout under `src/`: `modules/{chefs,menus,orders,payments,staffs,tables}`, plus empty `common/`, `config/`, `controllers/`, `models/`, `services/`, `shared/`. Most module folders are empty — the project is in initial scaffold and `AppModule` (`src/app.module.ts`) imports nothing yet.
- `src/main.ts` boots Nest with Swagger (`SwaggerModule.setup('api-docs', ...)`, Bearer auth registered) on `process.env.PORT ?? 4000`.
- `src/config/mongodb.ts` exports a singleton `clientPromise` from the raw `mongodb` driver. In `NODE_ENV=development` it caches the client on `globalThis._mongoClientPromise` to survive HMR; in prod a fresh client is created. There is no Mongoose; data access is via the native MongoDB client.
- The intended structure is documented in `docs/structure.md` (in Vietnamese) — follow that layout when adding modules: each feature gets `<feature>.controller.ts`, `<feature>.service.ts`, `<feature>.module.ts`, plus `schemas/` and `dto/` subfolders. Cross-cutting concerns go under `common/` (decorators, filters, guards, interceptors, pipes, utils) and reusable services under `shared/` (mail, cache, logger).

### `ordergo-api-v2` (.NET 8 modular monolith)
- One ASP.NET Core host (`src/Api/Restaurant.Api`) composes feature modules from `src/Modules/<Module>` (currently `Menu`, `Order`, `Notify`). Each module exposes a static `Add<Module>Module(IServiceCollection)` extension; `Program.cs` calls them sequentially. Add new modules by creating a new csproj under `src/Modules/<Name>`, adding it to `RestaurantManagement.sln` and `Restaurant.Api.csproj`, and exposing an `Add<Name>Module` extension.
- Modules follow a layered convention inside their csproj: `Domain/` (linq2db `[Table]/[Column]` POCOs), `Infrastructure/` (repositories taking `AppDataConnection` + `IRestaurantContext`), `Application/` (handlers / use-cases). Modules reference `Shared` only — they do **not** reference each other directly. Cross-module communication goes through events on `IEventBus` (e.g. `Notify` subscribes to `Modules.Order.Application.OrderCreated`).
- `Shared/`:
  - `Database/AppDataConnection.cs` — single linq2db `DataConnection` registered via `AddLinqToDBContext<AppDataConnection>` against `ConnectionStrings:Default` (SQL Server).
  - `Common/IRestaurantContext` + `RestaurantContextMiddleware` — multi-tenant scoping. Every repository must filter/stamp rows by `_ctx.RestaurantId` (see `MenuRepository.GetAll/Insert`). The middleware currently **hardcodes** RestaurantId/EmployeeId GUIDs (`11111…1` / `22222…2`); replacing this with real auth extraction is an outstanding TODO — keep the contract (`Guid RestaurantId`, `Guid EmployeeId`, `string Role`) when wiring real auth.
  - `EventBus/IEventBus` + `InMemoryEventBus` — process-local pub/sub, **not thread-safe** and registered as a Singleton. Fine for in-process notifications inside one host; do not assume durability or cross-process delivery.
- `Program.cs` has a known bug: line 22 references `options` instead of the lambda parameter `opt` (`return options.UseSqlServer(...)`). Fix to `opt.UseSqlServer(...)` when touching DB wiring.

### `ordergo-web` (Next.js admin)
- App Router under `src/app/`. Authenticated screens live under the `(main)` route group; each feature has `page.tsx` + `loading.tsx` + `[id]/` for detail (`orders`, `menu`, `tables`, `staff`, `customers`, `chef`, `payments`). `login/` is outside the group.
- Layout shell (`src/app/layout.tsx`) wraps every page in `ThemeProvider` (next-themes, attribute=`class`, supports system / dark) and `SidebarProvider` + `AppSidebar` + `SidebarInset`. The sidebar nav is hardcoded in `src/components/app-sidebar.tsx` — add new top-level routes there. UI strings are Vietnamese (`lang="vi"`, Inter with vietnamese subset).
- Components: `src/components/ui/*` is the shadcn/ui (Radix) primitive set; bespoke shell components (`app-sidebar`, `mobile-header`, `notifications`, `responsive-table`, `search-bar`, `theme-provider`) live one level up. Use the `cn()` helper from `@/lib/utils` for class merging and the `@/*` path alias for imports.
- No state library, no API client, no auth wiring is in place yet — pages currently render from local mock data (`src/app/data.ts`). When integrating with `ordergo-api` / `ordergo-api-v2`, introduce the client at the boundary rather than scattering `fetch` calls in components.
- `next.config.ts` is a stub; the active config is the `module.exports = nextConfig` block (image formats: avif/webp). The Dockerfile expects `output: "standalone"` — add it to `next.config.ts` before relying on the production image build.

## Cross-project notes

- The two API projects (`ordergo-api`, `ordergo-api-v2`) target different stacks and databases (Mongo vs SQL Server). They are alternatives, not layers — confirm which one a task targets before editing.
- All projects use Vietnamese for user-facing text and code comments. Preserve Vietnamese strings in UI copy and don't "translate" them to English when refactoring.
