# Module Catalog

> Liệt kê các module trong codebase, ranh giới, dependency, owner. Map 1:1 với folder `src/Modules/<Name>` trong backend.

## Nguyên tắc module

1. **Một module = một bounded context**. Không 1 module gánh 2 domain.
2. **Module chỉ depend vào `Shared`** + có thể read-only sub-namespace của module khác (cho event types). Không circular.
3. **Cross-module communication = events**. Không gọi method module khác trực tiếp ngoại trừ qua interface published.
4. **Mỗi module có 1 owner người** (về sau, lúc đầu founder owner all).
5. **Module có thể bật/tắt theo gói SaaS** — feature flag ở runtime (`tenant.has_module(Hospitality)`).

## Bản đồ module (target năm 2)

```
                          ┌──────────────────────┐
                          │       Api Host        │
                          │    (Restaurant.Api)   │
                          └──────┬───────┬───────┘
                                 │       │
              ┌──────────────────┴───┐   │
              │                      │   │
    ┌─────────▼────────┐    ┌────────▼──┴────────┐
    │      Shared      │    │       Modules      │
    │                  │    │                    │
    │ ├─ Identity      │    │ ├─ Catalog.FB      │
    │ ├─ Tenant        │    │ ├─ Catalog.Hotel   │
    │ ├─ EventBus      │    │ ├─ Order           │
    │ ├─ Database      │    │ ├─ Booking (v2)    │
    │ ├─ Common        │    │ ├─ Payment         │
    │ ├─ Outbox        │    │ ├─ Inventory       │
    │ └─ Telemetry     │    │ ├─ Customer        │
    └──────────────────┘    │ ├─ Loyalty (v1)    │
                            │ ├─ Reporting       │
                            │ ├─ Notification    │
                            │ ├─ Invoice (HĐĐT)  │
                            │ ├─ Marketing (v2)  │
                            │ └─ Integration     │
                            └────────────────────┘
```

## Module — đặc tả

### Shared / Core (cross-cutting)

#### Shared.Identity
- Auth, login, signup, password, 2FA, sessions
- User, Membership, Role, Permission
- API: `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `GET /me`
- Events publish: `UserRegistered`, `UserLoggedIn`
- Owner: bất kỳ BE senior

#### Shared.Tenant
- CRUD Tenant, Venue, Plan, Subscription
- API: `GET/POST /tenants`, `/tenants/{id}/venues`
- Events: `TenantCreated`, `VenueCreated`, `PlanChanged`
- Owner: founder (sensitive về billing)

#### Shared.EventBus
- Trừu tượng event bus (in-memory cho MVP, switch RabbitMQ/Kafka sau)
- API hậu phương: `IEventBus.Publish<T>`, `Subscribe<T>`
- Code hiện tại đã có `InMemoryEventBus` (cần thêm thread-safety + Outbox)

#### Shared.Outbox
- Transactional outbox pattern: lưu event vào DB cùng transaction nghiệp vụ, worker đẩy event sau
- Đảm bảo "at-least-once" delivery cho cross-module events
- Cần thiết khi tách microservice sau

#### Shared.Database
- linq2db `AppDataConnection`
- Migration runner (FluentMigrator hoặc EF Core migrations)
- Multi-tenant filter qua `IRestaurantContext` (đổi tên thành `ITenantContext`)

#### Shared.Common
- `ITenantContext`, middleware
- Common types (Money, Phone, Email value objects)
- Result pattern (Result<T>, Error)

#### Shared.Telemetry
- OpenTelemetry tracing
- Structured logging (Serilog)
- Metrics (Prometheus format)
- Health checks

### Modules nghiệp vụ

#### Modules.Catalog.FB
- Owner entity: MenuCategory, MenuItem, Variant, Topping, Combo, Recipe, BoM
- API: `GET/POST/PUT/DELETE /menu-items`, `/menu-categories`
- Events publish: `MenuItemPriceChanged`, `MenuItemUnavailable`
- Subscribe: `OrderPaid` (chỉ để denorm "popular items" report)

#### Modules.Catalog.Hotel (v2)
- Owner entity: RoomType, Room, RatePlan, Amenity
- API: `GET/POST /room-types`, `/rooms`, `/rate-plans`
- Events publish: `RoomStatusChanged`

#### Modules.Order
- **Module quan trọng nhất** — entity Order là cốt lõi cross-vertical
- Owner entity: Order, OrderLine, OrderHistory (audit)
- API: `GET/POST /orders`, `POST /orders/{id}/lines`, `POST /orders/{id}/cancel`, `POST /orders/{id}/split`
- Events publish: `OrderCreated`, `OrderUpdated`, `OrderCancelled`, `OrderPaid`, `OrderLineAdded`
- Subscribe: `MenuItemPriceChanged` (chỉ cho draft orders), `BookingConfirmed` (tạo room order tự động)

#### Modules.Booking (v2)
- Owner entity: Booking, Stay, Folio
- API: `GET/POST /bookings`, `POST /bookings/{id}/check-in`
- Events: `BookingCreated`, `BookingConfirmed`, `GuestCheckedIn`, `GuestCheckedOut`
- Subscribe: order events để charge vào folio

#### Modules.Payment
- Owner entity: Payment, Refund, PaymentSession (cho cổng QR)
- Adapter pattern cho từng method: Cash, VietQR, Momo, VNPay, ZaloPay, Card
- API: `POST /orders/{id}/payments`, `POST /payments/{id}/refund`
- Events: `PaymentReceived`, `RefundIssued`
- Subscribe: nothing direct (chỉ webhook từ external)

#### Modules.Inventory
- Owner entity: StockItem, StockMovement, Supplier, PurchaseOrder, Wastage
- API: `GET/POST /stock-items`, `POST /stock-movements`
- Events publish: `StockBelowThreshold`
- Subscribe: `OrderPaid` → trừ kho theo BoM

#### Modules.Customer
- Owner entity: Customer, CustomerSegment, CustomerNote
- API: `GET/POST/PUT /customers`
- Events publish: `CustomerCreated`, `CustomerUpdated`
- Subscribe: `OrderPaid` → update `total_spent`, `last_visit_at`

#### Modules.Loyalty (v1)
- Owner entity: LoyaltyCard, LoyaltyTier, Voucher, Campaign
- API: `GET /customers/{id}/loyalty`, `POST /vouchers`
- Events publish: `PointsEarned`, `PointsRedeemed`, `TierUpgraded`
- Subscribe: `OrderPaid` → cộng điểm; `CustomerBirthday` → tự sinh voucher

#### Modules.Reporting
- **Read-only module** — không own entity, dùng read model riêng (denormalized table hoặc materialized view)
- API: `GET /reports/sales-daily`, `/reports/top-items`, `/reports/staff-performance`
- Subscribe: hầu như tất cả events lớn để cập nhật read model
- Có thể tách CQRS sau khi traffic lớn

#### Modules.Notification
- Owner entity: NotificationTemplate, NotificationLog, NotificationPreference
- Adapter: FCM (push), SES/SendGrid (email), ESMS (SMS), Zalo OA
- API: `POST /notifications/test`, `GET /notifications/log`
- Subscribe: nhiều events → render template → gửi

#### Modules.Invoice (HĐĐT VN)
- Owner entity: EInvoice, EInvoiceTemplate, EInvoiceProvider (config)
- Adapter: VNPT, Viettel-Sinvoice, MISA-MeInvoice
- API: `POST /e-invoices`, `GET /e-invoices/{lookup_code}`
- Subscribe: `OrderPaid` → tạo HĐĐT (nếu enabled)

#### Modules.Marketing (v2)
- Owner entity: Campaign, BroadcastJob, Template
- API: `POST /marketing/campaigns`, `POST /marketing/broadcasts`
- Subscribe: nhận events khách hàng để segmentation

#### Modules.Integration
- Owner entity: WebhookEndpoint, ApiKey, OAuthClient
- API: `GET/POST /api-keys`, `/webhooks`
- Subscribe: tất cả events lớn → fan-out webhook
- Module "ngoại giao" với 3rd-party

---

## Module dependency graph

```
                       ┌──────────────┐
                       │   Shared.*   │
                       └──────────────┘
                              ▲
              ┌───────────────┼─────────────────┐
              │               │                 │
       ┌──────┴─────┐ ┌──────┴──────┐  ┌────────┴────────┐
       │  Catalog.* │ │  Customer   │  │   Notification  │
       └────────────┘ └─────────────┘  └─────────────────┘
              ▲              ▲
              │              │
              │              │
       ┌──────┴────────┐     │
       │     Order     │◀────┤
       └──┬───────┬────┘     │
          │       │          │
          ▼       ▼          │
   ┌─────────┐ ┌──────────┐  │
   │ Payment │ │ Inventory│  │
   └─────────┘ └──────────┘  │
                             │
                ┌────────────┴──┐
                │   Loyalty     │
                └───────────────┘

(Booking, Reporting, Invoice, Marketing, Integration: subscribe to events
 from above — không hiển thị edge để giảm rối)
```

---

## Quy tắc khi thêm module mới

1. Tạo project `src/Modules/<Name>` (csproj reference Shared)
2. Thêm vào `RestaurantManagement.sln` và `Restaurant.Api.csproj`
3. Định nghĩa public events ở `<Module>.Application.Events.*`
4. Expose `Add<Name>Module(IServiceCollection)` extension
5. Thêm vào `Program.cs`: `builder.Services.Add<Name>Module()`
6. Viết tài liệu module ở file này (mục "Modules nghiệp vụ")
7. Thêm vào `02-product/05-feature-catalog.md`

## Quy tắc bật/tắt module theo plan

- Mỗi tenant có `enabled_modules` list trong `Tenant` entity
- API gateway / middleware kiểm tra trước khi route đến module endpoint
- UI ẩn nav item khi module disabled
- DB không xoá data khi tắt module — chỉ giấu UI

---

## Khi nào tách module thành microservice

Module được tách khi đồng thời:
- Traffic của module ≥ 30% tổng traffic
- Team owner ≥ 3 dev (cần deploy cadence riêng)
- Có scaling pattern khác phần còn lại (vd: Reporting cần CPU heavy, Payment cần latency thấp ổn định)
- Outbox pattern đã hoạt động ổn định ≥ 3 tháng

Trước đó: cứ ở chung monolith, profile + scale vertical đủ rồi.

---
*Changelog: v0.1 — 2026-05-01.*
