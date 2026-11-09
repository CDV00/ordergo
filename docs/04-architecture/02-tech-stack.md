# Tech Stack — Quyết định & Lý do

> Mỗi lựa chọn dưới đây có **alternatives đã cân nhắc** và **lý do từ chối**. Khi muốn đổi stack, mở doc này, đối chiếu lý do, propose lại.

## Backend

### Quyết định: **.NET 8** (ASP.NET Core)

**Lý do**:
- Đã có scaffold `ordergo-api-v2` đang dùng .NET 8 + linq2db + modular monolith
- Performance vượt trội Node.js, Python ở workload tương tự (POS request thrust)
- Type-safe, async/await mature, ecosystem lớn
- SignalR realtime native, SDK tốt cho payment/HĐĐT VN
- VN có dev .NET nhiều hơn Go/Rust

**Alternatives đã cân nhắc**:
- **NestJS (Node.js)**: hệ sinh thái JS, share type với FE; nhưng performance kém ở concurrent workload, type system yếu hơn C#
- **Go**: nhanh, deploy nhỏ; nhưng ecosystem Go cho enterprise app (auth, ORM, payment) yếu hơn .NET, dev VN ít hơn
- **Java Spring Boot**: ổn định nhưng heavyweight, dev VN có nhưng cost cao

**Quyết định kèm**: 
- **Bỏ `ordergo-api` (NestJS)** — không phát triển tiếp, chỉ giữ làm reference. Tập trung 100% vào `ordergo-api-v2`.

---

### ORM: **linq2db**

**Lý do**:
- Đã chọn ở v2
- Performance gần raw SQL (faster than EF Core 30–50% ở complex query)
- Không có lazy loading "magic" — query rõ ràng
- Generated SQL đơn giản, debug dễ
- Đủ tốt cho linq query phức tạp + bulk operations

**Alternatives**:
- **EF Core**: phổ biến nhưng overhead, lazy loading dễ N+1, change tracking nặng
- **Dapper**: nhẹ nhất nhưng phải viết SQL tay, dài, ít refactor
- **NHibernate**: cũ, ít dev biết

---

### Database: **PostgreSQL** (đề xuất đổi từ SQL Server hiện tại)

**Lý do đổi**:
- **Cost**: SQL Server license ~$3.700/core/năm cho Standard. Postgres free.
- **Cloud managed**: AWS RDS Postgres, DO Managed Postgres rẻ hơn nhiều SQL Server
- **JSONB**: query JSON native, tốt cho `settings_json`, `modifiers_json`
- **Extensions**: pg_trgm (full-text VN), pgcrypto, TimescaleDB cho metrics
- **Ecosystem mở**: pgBouncer connection pool, Citus cho sharding
- **Cross-platform**: dev local trên macOS/Linux dễ hơn SQL Server

**Cost saving ước tính**: $5–10k/năm tiết kiệm khi scale lên 10–20 tenant Enterprise.

**Alternatives**:
- **SQL Server**: đang dùng, tốt nhưng license đắt
- **MySQL**: phổ biến nhưng JSON yếu hơn Postgres, foreign key MyISAM legacy issues
- **MongoDB**: không phù hợp — cần ACID transaction strong cho payment/order
- **CockroachDB**: distributed SQL, mạnh nhưng overkill MVP, cost cao

**Quyết định kèm**:
- Migrate `Program.cs:22` từ `UseSqlServer` → `UsePostgreSQL`
- Update `linq2db.SqlServer` → `linq2db.PostgreSQL` package
- Update connection string format

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

### Realtime: **SignalR** (.NET native)

**Lý do**:
- Built-in .NET 8
- Auto fallback (WebSocket → SSE → Long Polling)
- Backplane Redis cho multi-instance
- Client SDK có cho JS, Java, Swift, .NET (Mobile)

**Alternatives**:
- **Socket.io**: Node.js-centric, integration với .NET mệt
- **Ably / Pusher**: managed, tốt nhưng cost cao + vendor lock-in
- **MQTT**: tốt cho IoT, không phải dùng case này

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
- **Azure**: phù hợp nếu Microsoft-shop, ecosystem .NET tốt; cân nhắc nếu được offer credits
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

- Backend `Dockerfile` build .NET app slim image
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
- **Argon2id** cho password hashing (dùng `Microsoft.AspNetCore.Cryptography.KeyDerivation` hoặc `Konscious.Security.Cryptography`)
- **2FA TOTP** với `Otp.NET`
- **Rate limiting**: ASP.NET Core 8 built-in middleware
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
| Backend lang | .NET 8 | Khó (rewrite) | $0 |
| ORM | linq2db | Trung bình | $0 |
| DB | PostgreSQL | Trung bình | $15 |
| Cache | Redis | Dễ | $15 |
| Realtime | SignalR | Trung bình | $0 |
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

- [ ] Sửa `ordergo-api-v2/src/Api/Restaurant.Api/Program.cs:22` — `options` → `opt`
- [ ] Đổi `UseSqlServer` → `UseLinqToDB` cho Postgres + cập nhật package `linq2db.PostgreSQL`
- [ ] Thêm appsettings cho Postgres connection
- [ ] Khởi tạo Mobile POS project (Expo init)
- [ ] Setup CI/CD GitHub Actions cho cả 3 codebase
- [ ] Tạo Dockerfile cho backend (chưa có)
- [ ] Document onboarding dev mới ở `06-process/`

---
*Changelog: v0.1 — 2026-05-01.*
