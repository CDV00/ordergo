# Development Workflow

## Bố cục codebase

Workspace `D:\ordergo` có:
- `ordergo-api-v2/` — backend .NET 8 (chính thức)
- `ordergo-web/` — Next.js admin
- `ordergo-mobile/` — React Native (sẽ init sprint 0)
- `ordergo-api/` — **deprecated** (NestJS scaffold cũ — không phát triển tiếp)
- `docs/` — bộ tài liệu này

## Git strategy

### Branching model: **Trunk-based + short-lived feature branch**

```
main (always deployable)
  │
  ├── feature/order-create    # 1–3 ngày, merge ngay
  ├── feature/menu-import     # 1–3 ngày
  └── hotfix/payment-bug      # < 1 ngày
```

- **Không** dùng GitFlow (release/develop branch) — thừa cho team < 10 người
- Branch sống quá **5 ngày** → merge ngay (kể cả chưa hoàn thành, dùng feature flag)
- Không có long-running branch
- `main` luôn deployable — CI fail = chặn merge

### Naming
- `feature/<short-description>` — tính năng mới
- `fix/<bug-id>` — fix bug
- `chore/<task>` — refactor, dependency update
- `docs/<topic>` — chỉ docs

### Commit message — Conventional Commits

```
<type>(<scope>): <subject>

<body — optional, why not what>

<footer — issue ref, breaking change>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`

Ví dụ:
```
feat(order): add split bill by item

Allow server to split a bill across multiple payments. Required for
group dining feature.

Refs #123
```

## Pull Request workflow

### Quy ước
- 1 PR = **1 thay đổi logic** — không gộp 5 features vào 1 PR
- PR < 400 dòng diff (lý tưởng), > 600 dòng phải giải thích lý do
- PR title = commit message
- PR description bắt buộc:
  - **What**: thay đổi gì
  - **Why**: tại sao cần
  - **How tested**: test thế nào
  - **Screenshots/video** nếu UI

### Review
- Tối thiểu **1 reviewer** approve trước merge
- Code chạm payment/auth/security: **2 reviewer**
- Reviewer respond < 4h trong giờ làm việc
- Reviewer block không kèm lý do → bị contest

### Merge strategy
- **Squash merge** vào main (giữ history sạch)
- Branch tự delete sau merge
- Không cherry-pick, không rebase main vào feature branch (thay bằng merge main → feature)

### CI gates (bắt buộc pass)
- Build pass
- Unit test pass
- Lint pass (no warning new)
- Type check pass
- Coverage không giảm > 2%
- Security scan no critical CVE

## Sprint cadence

### Sprint = 2 tuần

| Day | Activity |
| --- | --- |
| Mon W1 | Sprint planning (90 phút) — chọn user story, estimate, commit |
| Daily | Standup async (text trên Slack) — không họp standup |
| Mid-sprint Wed | Mid-sprint check-in (30 phút) — risk |
| Fri W2 | Sprint review (60 phút) — demo, stakeholder feedback |
| Fri W2 | Retro (45 phút) — keep / drop / try |

### Async standup format

Mỗi sáng, Slack channel `#standups`:
```
🟢 Yesterday: …
🎯 Today: …
🚧 Blockers: …
```

Không trả lời trong 24h → manager check trực tiếp.

## Estimation

- **T-shirt size**: XS (1 ngày), S (2–3 ngày), M (3–5 ngày), L (1 tuần), XL (> 1 tuần phải tách)
- Estimate tham chiếu, không hứa hẹn deadline cứng
- Re-estimate sau mỗi sprint dựa velocity thực tế

## Coding standards

### Backend (.NET 8)
- C# 12, nullable enabled
- StyleCop / EditorConfig
- Async/await mọi I/O
- `Result<T>` pattern thay throw exception cho expected error
- Domain entity không depend trên framework (Pure C#)
- DI explicit (không Service Locator)
- Test: xUnit + FluentAssertions

### Frontend (Next.js)
- TypeScript strict
- Eslint rule (đang commented out — phải bật lại)
- Component < 200 dòng — refactor nếu vượt
- Feature folder, không page-based
- TanStack Query cho data fetching
- Tailwind class — không inline style
- shadcn UI primitives, không styled-components

### Mobile (React Native)
- Expo managed (MVP)
- TypeScript strict
- Zustand cho state
- TanStack Query
- React Navigation
- Local DB: op-sqlite hoặc WatermelonDB

## Code review checklist

- [ ] Tested? (unit + integration nếu cần)
- [ ] Tenant isolation? (filter `tenant_id`)
- [ ] Audit log nếu action sensitive?
- [ ] Idempotent nếu POST?
- [ ] Validation server-side?
- [ ] No secret hardcoded?
- [ ] No `console.log` / `Console.WriteLine` debug?
- [ ] Accessible (UI: keyboard, screen reader)?
- [ ] Mobile-tested nếu UI?
- [ ] Migration script nếu DB schema thay đổi?
- [ ] Doc update nếu thay đổi behavior?

## Test pyramid

```
              E2E (5%)        — Playwright cho web, Detox cho mobile
            ┌─────────┐
            │         │
         Integration (25%)    — Test với DB thật, mock external
       ┌─────────────────┐
       │                 │
    Unit tests (70%)               — xUnit, Jest, Vitest
  ┌─────────────────────────┐
```

- Coverage target: 70% line, 60% branch (không over-engineer)
- Test slow > 100ms phải mark `[Fact(Slow)]` để tách suite
- E2E chỉ cho golden path

## Database migration

- Script-based, versioned (FluentMigrator hoặc DbUp)
- 1 PR = 1 migration tối đa
- Migration phải reversible (Down method)
- Run trên staging trước, prod sau
- Long migration (> 30s) → breaking change → schedule maintenance window
- Backfill data lớn → background job, không trong migration

## Feature flags

- Mọi feature nhạy cảm phải có flag (Flagsmith / Unleash / cờ DB tự build)
- Flag default OFF cho tenant chưa explicit ON
- Flag retire trong 30 ngày sau full rollout
- Memory: chú ý đến điểm 1 ở `00-vision/03-core-values.md` về flag cleanup — schedule task tự động remove khi 100% rollout

## Observability trong dev

- Mọi service phải emit:
  - Health check (`/health/live`, `/health/ready`)
  - Metric (request rate, latency, error rate)
  - Trace (OpenTelemetry)
  - Structured log với `request_id`, `tenant_id`, `user_id`

## Local dev setup (target — viết SETUP.md sau)

```bash
# Clone
git clone .../ordergo

# Backend
cd ordergo-api-v2
docker-compose up -d  # postgres + redis
dotnet run --project src/Api/Restaurant.Api

# Web
cd ordergo-web
yarn install && yarn dev

# Mobile
cd ordergo-mobile
yarn install && yarn ios
```

Mục tiêu: dev mới onboard từ clone đến có app chạy < 1 giờ.

## Definition of Ready (DoR) — story ready cho sprint

- [ ] Có acceptance criteria rõ
- [ ] Có wireframe/mockup nếu UI
- [ ] Estimate (T-shirt size)
- [ ] Dependency rõ (block / blocked by)
- [ ] Test plan (unit + integration nếu cần)

## Definition of Done (DoD)

> Đầy đủ ở `02-definition-of-done.md`. Tóm tắt:
- Code merged + deployed staging
- Test pass + coverage không giảm
- PR review approved
- Doc update
- QA verify trên staging
- Stakeholder review demo

---
*Changelog: v0.1 — 2026-05-01.*
