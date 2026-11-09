# Tech Stack — Quyết định & Lý do

> Mỗi lựa chọn dưới đây có **alternatives đã cân nhắc** và **lý do từ chối**. Khi muốn đổi stack, mở doc này, đối chiếu lý do, propose lại.

## Backend

> **v0.3 (2026-11-09)** — đã chốt **NestJS + MongoDB**, thay cho quyết định .NET 8 ở v0.1. Code `ordergo-api-v2` (.NET) dừng phát triển và không còn trong workspace.

### Quyết định: **NestJS 11** (Node.js 20, TypeScript)

**Lý do**:
- Codebase `ordergo-api` đã chạy được các luồng chính: đăng ký → setup wizard → menu → bàn → gọi món → bếp → thu tiền, cùng luồng khách quét QR gọi món
- Cùng ngôn ngữ (TypeScript) với web admin Next.js → chia sẻ kiểu dữ liệu, 1 team full-stack
- Module system + DI của Nest khớp kiến trúc modular monolith (mỗi bounded context 1 module)
- Ecosystem đủ cho realtime (Socket.IO gateway), cron (`@nestjs/schedule`), Swagger, validation

**Alternatives đã cân nhắc**:
- **.NET 8 (`ordergo-api-v2`)**: hiệu năng tốt hơn ở workload CPU nặng, nhưng scaffold mới ở mức khung (tenant hardcode, chưa auth) → phải viết lại toàn bộ luồng đã có trên NestJS
- **Go**: nhanh, deploy nhỏ; ecosystem cho auth/payment VN yếu hơn, team không quen

**Rủi ro chấp nhận**: Node đơn luồng — tách việc nặng (báo cáo, HĐĐT, gửi thông báo) sang worker/queue khi cần; đo trước khi tối ưu.

---

### Database & ODM: **MongoDB 7 + Mongoose 9**

**Lý do** (chi tiết ở `08-database/01-database-strategy.md`):
- Menu F&B (món + biến thể + topping) và đơn hàng (lines + snapshot) là document tự nhiên — đọc 1 query
- Replica set cho multi-document transaction (setup wizard, thanh toán)
- Atlas/managed có sẵn backup, monitoring

**Quy ước bắt buộc**:
- Mọi repository nghiệp vụ kế thừa `BaseTenantRepository` (tự lọc `tenantId` + `deletedAt: null`)
- Tenant/venue của request chỉ lấy từ `TenantContextService`, đã được `JwtAuthGuard` đối chiếu với membership — không đọc header trực tiếp
- ID public là UUID v7 (`shared/utils/uuid.ts`), không lộ `ObjectId` làm khoá nghiệp vụ

**Alternatives**: PostgreSQL + Prisma/TypeORM — chỉ cân nhắc lại khi báo cáo phức tạp vượt khả năng aggregation (xem `08-database/05-postgres-sync-and-migration.md`).

---

### Cache + Queue + PubSub: **Redis**

**Lý do**:
- Đa năng (cache + queue + pub/sub + lock distributed)
- Managed có ở mọi cloud (rẻ)
- Mature, dev VN biết

**Alternatives đã cân nhắc**:
- **Memcached**: chỉ cache, không pub/sub
- **RabbitMQ**: tốt cho queue nhưng không cache. **Sẽ thêm RabbitMQ năm 2** khi event bus in-memory không đủ
- **Kafka**: overkill MVP, sẽ cân nhắc năm 3 cho event sourcing

---

### Realtime: **Socket.IO** (`@nestjs/websockets` + `@nestjs/platform-socket.io`)

**Lý do**:
- Tích hợp sẵn trong NestJS (Gateway, guard, DI dùng chung với REST)
- Auto fallback (WebSocket → long polling), reconnect phía client
- `@socket.io/redis-adapter` cho multi-instance — Redis đã có trong hạ tầng
- Client JS dùng chung cho web admin, KDS, trang QR của khách, mobile (React Native)

**Room**: `tenant:{tenantId}:venue:{venueId}` — POS, KDS, chủ quán cùng nghe; khách QR nghe `session:{sessionId}`.

**Alternatives**:
- **SSE**: đơn giản, 1 chiều — đủ cho KDS nhưng không cho trang khách gửi tín hiệu
- **Ably / Pusher**: managed, tốt nhưng cost cao + vendor lock-in

**Hiện trạng**: KDS, POS, trang khách đang polling 2–5s → thay ở Phase 2.

---

## Frontend

### Web Admin: **Next.js 15** (App Router) + **Tailwind 4** + **shadcn/ui**

**Lý do**:
- Đã có codebase `ordergo-web` setup tốt
- App Router + Server Components → cải thiện performance + SEO
- Tailwind: fast styling, ít CSS-in-JS overhead
- shadcn (Radix primitives): accessible, customize tự do, không lock-in
- TypeScript

**Alternatives**:
- **Remix**: tốt nhưng hệ sinh thái nhỏ hơn Next
- **SvelteKit**: nhẹ nhưng dev VN ít, ecosystem nhỏ
- **Vue/Nuxt**: tốt nhưng team founder đang quen React

---

### Mobile POS: **React Native** (đề xuất)

**Lý do**:
- Share component logic với web (Next.js đã React)
- Expo + EAS Build → CI/CD đơn giản
- Native modules cho máy in Bluetooth, scanner, NFC có sẵn
- Performance đủ cho POS workload (không phải game)
- Tuyển dev RN dễ hơn Flutter ở VN
- Hot reload nhanh

**Alternatives đã cân nhắc**:
- **Flutter**: UI consistency tốt hơn, performance nhỉnh hơn; nhưng Dart ít dev VN biết, share code với web khó
- **Native iOS + Android**: chất lượng nhất, nhưng 2x cost dev, không khả thi cho startup
- **PWA**: rẻ, nhưng integration thiết bị (máy in BT, NFC) yếu, offline kém

**Quyết định kèm**:
- Stack: React Native + Expo + Tamagui (UI lib cross-platform với Tailwind feel) hoặc NativeBase
- State: Zustand (đơn giản, hợp early stage)
- Local DB: SQLite via op-sqlite hoặc WatermelonDB (cho offline-first)
- Networking: TanStack Query + Axios

---

### KDS: **Next.js PWA** (web app trên tablet)

**Lý do**:
- Tablet bếp chỉ dùng 1 chức năng — không cần app native
- Web app: ship instant, không qua App Store/Play Store review
- PWA cài lên home screen, full-screen, offline cache
- Dùng chung codebase với Web Admin

---

## Infrastructure

### Hosting: **DigitalOcean** (MVP) → **AWS** (năm 2+)

**MVP — DigitalOcean**:
- Cost: 1 droplet 4GB ($24) + Managed Postgres ($15) + Managed Redis ($15) + Spaces ($5) + LB ($12) ≈ $70–100/tháng
- Ops đơn giản, UI rõ
- Singapore region, latency tới VN < 50ms
- Đủ cho 100–500 venues

**Năm 2 — AWS** (khi cần scale):
- ECS/EKS, RDS Multi-AZ, ElastiCache, S3
- Nhiều dịch vụ managed hơn, mature
- Cost cao hơn DO ~30–50% nhưng đáng

**Alternatives**:
- **GCP**: tốt nhưng VN ít dev quen
- **Azure**: cân nhắc nếu được offer credits
- **Vietnam cloud (VNG, Viettel IDC)**: cần cho Enterprise tier; cost cao, UI thua quốc tế

---

### CDN + Edge: **Cloudflare**

- Free tier đủ MVP
- DDoS protection
- WAF managed rules
- Workers cho API rate limit/edge auth nếu cần

---

### Object Storage: **S3-compatible**

- DO Spaces (MVP) → R2 (Cloudflare, egress free) hoặc S3 (AWS)
- Lưu: menu images, bill PDFs (5 năm tax), HĐĐT XML, avatar, attachment

---

## DevOps & Tooling

### CI/CD: **GitHub Actions**

- Build, test, lint trên push/PR
- Build Docker image, push registry
- Deploy via ssh hoặc DO App Platform
- Migration tự động on deploy với gate manual

### Container: **Docker**

- Backend `Dockerfile` (Node 20 alpine, `nest build`, chạy `node dist/main`)
- Web `Dockerfile` đã có (Next.js standalone)
- Compose cho dev local

### Secret Management
- MVP: GitHub Secrets + env file mã hoá (sops)
- Năm 1: AWS SSM Parameter Store hoặc DO Secrets
- Năm 2: HashiCorp Vault nếu cần

### IaC
- MVP: Terraform optional (DO support tốt)
- Năm 2: Terraform bắt buộc

---

## Observability

| Concern | MVP | Năm 1+ |
| --- | --- | --- |
| Logs | DO logs / CloudWatch | Loki + Grafana hoặc Datadog |
| Metrics | Prometheus + Grafana self-hosted | Datadog hoặc Grafana Cloud |
| Traces | OpenTelemetry → Jaeger self | Honeycomb hoặc Datadog APM |
| Error tracking | **Sentry** (đã setup ở Dockerfile web) | Sentry Pro |
| Uptime monitor | UptimeRobot free | BetterStack |

---

## Auth & Security

- **JWT** custom (RS256) với key rotation
- **Argon2id** cho password hashing (package `argon2` — đã dùng)
- **2FA TOTP** với `otplib` (chưa làm)
- **Rate limiting**: `@nestjs/throttler` + Redis storage (chưa làm)
- **Tenant isolation**: `JwtAuthGuard` đối chiếu `X-Tenant-Id` / `X-Venue-Id` với membership trong DB; quyền lấy từ membership, không lấy từ JWT
- **CORS**: whitelist origin theo env

---

## Payment integration

| Provider | Module | Doc |
| --- | --- | --- |
| **Momo Business** | Modules.Payment.Adapters.Momo | https://developers.momo.vn |
| **VNPay QR** | Modules.Payment.Adapters.VNPay | https://sandbox.vnpayment.vn |
| **ZaloPay** | (v1) | https://docs.zalopay.vn |
| **VietQR (NAPAS chuẩn)** | Modules.Payment.Adapters.VietQR | https://vietqr.io/api |

---

## E-Invoice integration

| Provider | Doc | Note |
| --- | --- | --- |
| **VNPT-Invoice** | https://invoice.vnpt.vn/api-docs | Phổ biến, doc tốt — chọn cho MVP |
| **Viettel-Sinvoice** | https://sinvoice.viettel.vn | Mạnh enterprise, doc khó hơn |
| **MISA-MeInvoice** | https://meinvoice.vn | Tốt nếu khách dùng MISA accounting |

---

## Notification

| Channel | Provider | Cost ước |
| --- | --- | --- |
| Push | Firebase Cloud Messaging | Free |
| Email | SendGrid (MVP) → AWS SES (scale) | $15/tháng → $0.0001/email |
| SMS | ESMS / FPT-SMS | ~250đ/tin |
| Zalo OA | Zalo Notification Service | ~150đ/tin |

---

## Tổng kết quyết định stack

| Component | Choice | Có thể đổi sau? | Cost MVP/tháng |
| --- | --- | --- | --- |
| Backend lang | NestJS 11 (Node 20) | Khó (rewrite) | $0 |
| ODM | Mongoose 9 | Trung bình | $0 |
| DB | MongoDB 7 (replica set) | Trung bình | $0–57 (self-host / Atlas M10) |
| Cache | Redis | Dễ | $15 |
| Realtime | Socket.IO + Redis adapter | Trung bình | $0 |
| Frontend Web | Next.js 15 | Khó | $0 |
| Mobile | React Native | Khó | $0 |
| Hosting | DigitalOcean | Dễ | $40 |
| CDN | Cloudflare | Dễ | $0 |
| Storage | DO Spaces | Dễ | $5 |
| Email | SendGrid | Dễ | $15 |
| Monitor | Sentry | Dễ | $0 |
| **Total MVP** | | | **~$90/tháng** |

---

## Action items khi nhận quyết định

- [x] Chốt NestJS + MongoDB, dừng `ordergo-api-v2` (.NET)
- [x] Dockerfile cho backend + frontend, docker-compose (infra / full / dev)
- [x] CI GitHub Actions: lint, format, test, build (+ e2e với Mongo) cho `ordergo-api` và `ordergo-web`
- [x] Script seed dữ liệu demo (`yarn seed:demo`)
- [ ] Realtime Socket.IO cho POS ↔ KDS ↔ khách QR (Phase 2)
- [ ] Mobile POS: dùng PWA trước, app native sau khi có phản hồi pilot
- [ ] Document onboarding dev mới ở `06-process/`

---
*Changelog: v0.1 — 2026-05-01. v0.3 — 2026-11-09: chốt NestJS + MongoDB, bỏ .NET 8 / linq2db / PostgreSQL.*
