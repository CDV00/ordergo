# Tổng quan kiến trúc

## Triết lý

1. **Modular monolith** trước, microservice sau (chỉ tách khi có lý do cụ thể)
2. **Pragmatic over pure** — DDD-light, CQRS chỉ ở Reporting, không over-engineer
3. **Cloud-native nhưng cost-conscious** — AWS/DO với managed services, không tự host PostgreSQL nếu không cần
4. **Mobile-first cho POS, web-first cho admin** — tách 2 client codebase với UX tối ưu cho từng surface
5. **Realtime là first-class citizen** — WebSocket/SignalR cho POS↔KDS, không polling
6. **Offline-first cho POS** — queue local, sync khi online, idempotency keys

## Bird's-eye

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                        │
│                                                                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Web Admin │  │ Mobile POS   │  │   KDS Web    │  │ 3rd-party    │  │
│  │ (Next.js)  │  │ (RN/Flutter) │  │ (Next.js PWA)│  │ (API/Webhook)│  │
│  └─────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└────────┼─────────────────┼─────────────────┼─────────────────┼─────────┘
         │ HTTPS/WSS       │ HTTPS/WSS       │ HTTPS/WSS       │ HTTPS
         ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          EDGE                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Cloudflare (CDN, DDoS, WAF)                                    │   │
│  │  → API Gateway (rate limit, auth)                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API HOST (.NET 8)                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Restaurant.Api  (modular monolith)                             │   │
│  │                                                                  │   │
│  │  Modules: Identity, Tenant, Catalog.FB, Catalog.Hotel,          │   │
│  │           Order, Booking, Payment, Inventory, Customer,         │   │
│  │           Loyalty, Reporting, Notification, Invoice,            │   │
│  │           Marketing, Integration                                │   │
│  │                                                                  │   │
│  │  Cross-cutting: Identity, Tenant Middleware, Telemetry, Outbox │   │
│  └────────┬─────────────┬──────────────────┬──────────────────────┘   │
└───────────┼─────────────┼──────────────────┼──────────────────────────┘
            │             │                  │
            ▼             ▼                  ▼
    ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐
    │  PostgreSQL  │ │  Redis      │ │  Object Storage  │
    │  (primary +  │ │  (cache +   │ │  (S3-compatible) │
    │   replica)   │ │   queue +   │ │  - menu images   │
    │              │ │   pub/sub)  │ │  - bill PDFs     │
    └──────────────┘ └─────────────┘ └──────────────────┘

         ▼                                      ▼
    ┌──────────────────────┐         ┌──────────────────────┐
    │  Workers (.NET)      │         │  External services   │
    │  - Outbox publisher  │         │  - Momo, VNPay       │
    │  - Notification jobs │         │  - VNPT-Invoice      │
    │  - Report aggregator │         │  - SES/SendGrid      │
    │  - HĐĐT submitter    │         │  - FCM, ESMS         │
    └──────────────────────┘         └──────────────────────┘
```

## Lớp logic (Layers)

Mỗi module trong monolith theo cấu trúc layered DDD-light:

```
Modules.<Name>/
├── Domain/              # Entity, Value Object, Domain Event, Aggregate
├── Application/         # Use case, Command/Query handler, Application service
├── Infrastructure/      # Repository (linq2db), External adapter
├── Api/                 # Controller, DTO, validator
└── <Name>Module.cs      # DI extension method (AddXModule)
```

## Realtime layer

- **SignalR** (.NET native) cho push từ server → client
- Topic pattern: `tenant:{tenantId}:venue:{venueId}:orders` — phục vụ subscribe; KDS subscribe; chủ subscribe
- Broker: Redis Pub/Sub backplane (cho horizontal scale)

## Offline + Sync (POS app)

- POS app dùng **SQLite local** lưu pending orders + reference data (menu, table)
- Khi mất mạng: tạo order với `client_id` (UUID), enqueue
- Khi có mạng lại: POST `/orders` với header `Idempotency-Key: <client_id>` — server bỏ qua nếu đã thấy
- Realtime updates sang KDS sau khi server commit

## Authentication & Authorization

- **JWT** access token (15 phút) + refresh token (30 ngày)
- Claims: `sub` (user_id), `tenant_id` (active tenant), `venue_id` (active venue), `roles`
- **2FA TOTP** cho role Owner/TenantAdmin
- Middleware: `JwtBearer` validate → `TenantContextMiddleware` set `ITenantContext` → policy `[Authorize(Policy = "order.create")]` ở controller

## Database access

- **linq2db** (đã chọn ở v2) — typed, performant, ít magic hơn EF
- Migration: **FluentMigrator** hoặc **DbUp** — không phụ thuộc EF
- Repository pattern light — không lạm dụng generic repository
- Multi-tenant filter ở repository layer (đã giải thích ở `03-domain/04-multi-tenant.md`)

## Caching strategy

- **Redis** (managed: ElastiCache / DO Managed Redis)
- Cache keys phải có `tenant_id` prefix: `tenant:{id}:menu:items` — tránh leak
- Layer:
  - **L1 (in-memory per instance)**: 30s TTL cho menu, settings (rất hot, thay đổi ít)
  - **L2 (Redis distributed)**: 5–15 phút TTL cho dashboard, list views
- Cache invalidation qua event bus: `MenuItemUpdated` → publish → cache layer subscribe → invalidate

## Event flow (cross-module)

```
Module A
  │
  │ 1. Update entity + write event to Outbox table (cùng transaction)
  ▼
[DB transaction]
  │
  │ 2. Outbox Publisher (background worker) đọc Outbox → publish
  ▼
[Event Bus] (in-memory MVP, RabbitMQ năm 2)
  │
  ├─▶ Module B subscriber 1
  ├─▶ Module C subscriber 2
  └─▶ Webhook fanout (Modules.Integration)
```

Đảm bảo **at-least-once** delivery + ordering trong cùng entity.

## Observability

3 trụ:

1. **Logs**: Serilog → stdout → Loki / CloudWatch
2. **Metrics**: Prometheus format / OpenTelemetry → Grafana / CloudWatch
3. **Traces**: OpenTelemetry → Jaeger / Tempo / Honeycomb

Health check endpoint: `/health/live`, `/health/ready`

## Deployment topology

### MVP (3–6 tháng đầu)
- 1 instance API (DigitalOcean Droplet 4GB, Singapore)
- 1 PostgreSQL managed (DO Managed DB, $15/tháng base)
- 1 Redis managed
- 1 Object storage (DO Spaces)
- Cloudflare free
- Total cost: ~$80/tháng

### Năm 1
- 2 instances API behind LB (auto-scale 2–4)
- PostgreSQL primary + 1 replica
- Redis cluster mode
- Workers tách riêng (1–2 instance)
- CDN: Cloudflare Pro
- Cost: ~$300–500/tháng

### Năm 2
- Multi-AZ
- Tách Reporting DB (read model riêng)
- Message broker (RabbitMQ managed)
- Cost: ~$1.500–3.000/tháng

## Technology choices summary

> Chi tiết và lý do ở `02-tech-stack.md`. Tóm tắt:

| Layer | Choice |
| --- | --- |
| Backend | .NET 8 (đã có v2 scaffold) |
| ORM | linq2db |
| DB | PostgreSQL (recommend đổi từ SQL Server hiện tại) |
| Cache/Queue/PubSub | Redis |
| Realtime | SignalR |
| Web Admin | Next.js 15 + Tailwind + shadcn (đã có) |
| Mobile POS | React Native (recommend) hoặc Flutter |
| Object Storage | S3-compatible (DO Spaces / R2) |
| Hosting | DigitalOcean MVP → AWS năm 2+ |
| Auth | JWT custom + Identity module |
| HĐĐT | VNPT-Invoice (chính), Viettel/MISA (lựa chọn) |

## Nguyên tắc khi thêm độ phức tạp

> "Nếu không đo được pain hiện tại, đừng thêm complexity để giải pre-emptive."

- **Không thêm message broker** đến khi event bus in-memory thật sự fail
- **Không thêm CQRS** đến khi 1 query model rõ ràng cần read khác write
- **Không tách microservice** đến khi tách monolith đem lại lợi ích cụ thể (deploy độc lập, scaling khác pattern)
- **Không thêm Kubernetes** đến khi 2 droplets không đủ
- **Không thêm Kafka** đến khi RabbitMQ không đủ

## Anti-pattern cần tránh

- ❌ EF Core với Lazy Loading + auto migration (đã chọn linq2db chính vì điều này)
- ❌ Generic repository `IRepository<T>` — leak abstraction
- ❌ Service Locator pattern — dùng DI explicit
- ❌ Long-running HTTP requests (> 10s) — push sang background job
- ❌ Sync gọi external API trong request handler — qua queue
- ❌ Polling realtime — dùng SignalR
- ❌ Hardcode connection string — dùng config + secret manager
- ❌ Console.WriteLine logging — Serilog structured

---
*Changelog: v0.1 — 2026-05-01.*
