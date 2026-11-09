# API Guidelines

> Quy ước cho mọi REST API trong OrderGo. Áp dụng cho `ordergo-api` (backend NestJS, prefix `/v1`) và mọi public API hướng đối tác.

## 1. Style & Versioning

### URL pattern
```
https://api.ordergo.vn/v1/{resource}[/{id}[/{sub-resource}]]
```

- **HTTPS bắt buộc**, redirect HTTP → HTTPS
- `api.ordergo.vn` — domain riêng cho API (không chung domain web app)
- **Versioning ở path**: `/v1/`, `/v2/` — không versioning ở query/header (rõ ràng hơn)
- Resource **số nhiều**: `/orders`, `/menu-items` (không `/order`)
- **kebab-case** cho resource: `/menu-items`, `/order-lines`
- Sub-resource: `/orders/{id}/lines`, `/customers/{id}/orders`

### Naming
- Resource: danh từ số nhiều
- Action không phải CRUD → POST với verb: `POST /orders/{id}/cancel`, `POST /shifts/{id}/close`
- **Không** `/getOrders` hay `/cancelOrder` style

## 2. HTTP methods & status codes

| Method | Use | Idempotent | Status thành công |
| --- | --- | --- | --- |
| GET | Đọc | ✅ | 200 |
| POST | Tạo / action | ❌ | 201 (tạo) / 200 (action) / 202 (async) |
| PUT | Replace toàn bộ | ✅ | 200 |
| PATCH | Update partial | ✅ (với version) | 200 |
| DELETE | Xoá (soft) | ✅ | 204 |

### Status codes chuẩn

| Code | Khi dùng |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 202 | Accepted (async job) |
| 204 | No Content (DELETE thành công) |
| 400 | Bad Request — validation fail |
| 401 | Unauthenticated — chưa login / token hết hạn |
| 403 | Forbidden — đã login nhưng thiếu quyền |
| 404 | Not Found |
| 409 | Conflict — version mismatch, duplicate |
| 410 | Gone — resource bị xoá vĩnh viễn |
| 422 | Unprocessable — semantic error (vd: order đã thanh toán không sửa được) |
| 429 | Too Many Requests — rate limit |
| 500 | Server error (không bao giờ leak stack trace) |
| 503 | Service Unavailable — maintenance |

## 3. Request/Response format

### Headers tiêu chuẩn

**Request**:
```
Authorization: Bearer <jwt>
X-Tenant-Id: <uuid>           // optional, default = active tenant trong JWT
X-Venue-Id: <uuid>            // optional, default = active venue trong JWT
X-Request-Id: <uuid>          // client gửi để trace; nếu không có server tự gen
Idempotency-Key: <uuid>       // bắt buộc cho POST/PUT/PATCH gây side-effect
Content-Type: application/json
Accept: application/json
Accept-Language: vi-VN | en-US
```

**Response**:
```
X-Request-Id: <uuid>
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1714560000
```

### Body format — JSON only

- **camelCase** cho tất cả field (kể cả khi DB dùng snake_case)
- Date/time: **ISO 8601** với timezone (`2026-05-01T10:30:00+07:00`)
- Money: object `{ "amount": 50000, "currency": "VND" }` (không dùng float, dùng integer trong unit nhỏ nhất hoặc decimal string)
- ID: UUID string (`"550e8400-e29b-41d4-a716-446655440000"`)
- Enum: string snake_case lowercase (`"dine_in"`, `"paid"`, `"checked_in"`) — không phải số

### Response success format

**List**:
```json
{
  "data": [
    { "id": "...", "name": "..." }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 134,
    "totalPages": 7
  }
}
```

**Single**:
```json
{
  "data": {
    "id": "...",
    "name": "..."
  }
}
```

**Action không trả entity**:
```json
{ "data": { "success": true } }
```

### Response error format

```json
{
  "error": {
    "code": "ORDER_ALREADY_PAID",
    "message": "Đơn này đã thanh toán, không thể sửa.",
    "details": [
      { "field": "amount", "code": "INVALID", "message": "Số tiền không khớp" }
    ],
    "requestId": "..."
  }
}
```

- `code` — uppercase snake, ổn định, client switch dựa trên code
- `message` — tiếng Việt cho end-user (Accept-Language vi-VN), tiếng Anh cho dev
- `details` — array errors chi tiết (chỉ ở 400/422)
- `requestId` — để báo support tra log

## 4. Pagination, Sort, Filter

### Pagination — page + pageSize
```
GET /orders?page=1&pageSize=20
```
- Default `page=1`, `pageSize=20`
- Max `pageSize=100`

### Cursor pagination cho list lớn / realtime
```
GET /orders?cursor=eyJpZCI6Ii4uLiJ9&limit=50
```
- Trả `nextCursor` trong response
- Cho `/audit-log`, `/orders` lúc realtime

### Sort
```
GET /orders?sort=-createdAt,name
```
- Prefix `-` = descending
- Comma-separated multiple fields

### Filter
```
GET /orders?status=paid&createdAtFrom=2026-05-01&createdAtTo=2026-05-30
```
- Query string flat
- Range: `xxxFrom`, `xxxTo`
- Multi-value: comma `?status=paid,refunded`
- Search: `?q=text` (full-text, không filter exact)

## 5. Idempotency

Bắt buộc cho **mọi POST/PUT/PATCH gây side-effect tài chính** (Order, Payment, Refund, E-Invoice).

```
POST /orders
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

- Server lưu key + response 24h
- Client retry với cùng key → server trả response cũ, không tạo duplicate
- Nếu request body khác với lần đầu → trả 409

## 6. Concurrency / Optimistic locking

- Mỗi entity có cột `version` (int) hoặc `updatedAt` (timestamp)
- PATCH/PUT phải gửi `If-Match: <version>` header hoặc `version` trong body
- Server compare → nếu mismatch → 409 với current version

## 7. Authentication

### Public endpoints
```
POST /v1/auth/register
POST /v1/auth/login
POST /v1/auth/refresh
POST /v1/auth/forgot-password
POST /v1/auth/reset-password
GET  /v1/health
```

### Authenticated endpoints
- Bearer JWT trong `Authorization` header
- Token expiry: access 15 phút, refresh 30 ngày
- Token bị invalidate khi: logout, đổi password, admin force logout

### API Key (cho 3rd-party integration — v1+)
```
Authorization: ApiKey <key>
X-Api-Secret: <secret>
```
- Sinh từ Web Admin → Settings → API Keys
- Scope: `order.read`, `order.write`, `customer.read`, ...
- Rate limit theo key

## 8. Authorization

- Endpoint declare policy: `[Authorize(Policy = "order.create")]`
- Policy = list permission cần thiết
- Middleware check: user role có permission → pass; không → 403
- Tenant isolation: ngầm (qua `ITenantContext`), không cần declare ở mỗi endpoint

## 9. Rate limiting

- **Default**: 1000 req/phút per user
- **Public** (chưa login): 100 req/phút per IP
- **API Key**: tuỳ plan
  - Starter: 1k/giờ
  - Pro: 10k/giờ
  - Business: 100k/giờ
  - Enterprise: tuỳ negotiation

Headers trả về như mục 3.

## 10. Validation

- Server-side validation **bắt buộc**, client-side là phụ
- Dùng `FluentValidation` cho .NET
- Lỗi validation → 422 với `details` array

## 11. Webhooks (cho 3rd-party)

### Cấu hình
- Khách tạo webhook ở Web Admin → Settings → Webhooks
- URL + secret + events subscribe
- Test endpoint: `POST /v1/webhooks/test`

### Format gửi
```http
POST https://customer-endpoint
X-OrderGo-Event: order.paid
X-OrderGo-Signature: sha256=<hmac>
X-OrderGo-Delivery: <uuid>
Content-Type: application/json

{
  "event": "order.paid",
  "createdAt": "2026-05-01T10:30:00+07:00",
  "data": { ... order entity ... }
}
```

### Retry policy
- Server expect 2xx response trong 10s
- Nếu fail: retry 5 lần với exponential backoff (1m, 5m, 30m, 2h, 6h)
- Sau 5 lần fail → đánh dấu webhook unhealthy, gửi email cho khách

### Signature verification
```python
hmac.new(secret, body, sha256).hexdigest() == signature
```

## 12. Realtime API (Socket.IO) — *Phase 2, chưa làm*

### Namespace
```
wss://api.ordergo.vn/realtime   (Socket.IO, path mặc định /socket.io)
```

### Auth
JWT gửi trong `auth` lúc handshake: `io(url, { auth: { token: '<jwt>' } })` — server đối chiếu membership giống `JwtAuthGuard` trước khi cho join room.

### Subscribe
```js
socket.on("order.updated", (order) => { ... });
```

### Topics tự động sub theo tenant/venue trong JWT
- `tenant:{id}:venue:{id}:orders.created`
- `tenant:{id}:venue:{id}:orders.updated`
- `tenant:{id}:venue:{id}:tables.status_changed`
- `tenant:{id}:venue:{id}:kds.new_order`
- `tenant:{id}:venue:{id}:kds.item_ready`

## 13. Documentation — OpenAPI

- **Swagger UI** ở `/api-docs` (đã setup)
- OpenAPI JSON ở `/swagger/v1/swagger.json`
- Public docs portal năm 1: `developer.ordergo.vn`

## 14. Deprecation policy

- Khi deprecate endpoint:
  1. Email/notification cho mọi API consumer trước **6 tháng**
  2. Trả header `Deprecation: true` + `Sunset: <date>` + `Link: <new-endpoint>`
  3. Vẫn hoạt động đầy đủ cho đến date sunset
- Major version (v1 → v2): **12 tháng** parallel support

## 15. Examples

### Tạo order
```http
POST /v1/orders
Authorization: Bearer eyJ...
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "venueId": "...",
  "orderType": "dine_in",
  "tableId": "...",
  "lines": [
    { "menuItemId": "...", "quantity": 2, "modifiers": [{"toppingId": "..."}], "note": "không hành" }
  ]
}
```

Response 201:
```json
{
  "data": {
    "id": "...",
    "orderNumber": "ORD-20260501-0001",
    "status": "draft",
    "subtotal": { "amount": 100000, "currency": "VND" },
    "lines": [ ... ],
    "createdAt": "2026-05-01T10:30:00+07:00"
  }
}
```

### Action — gửi đơn xuống bếp
```http
POST /v1/orders/{id}/send-to-kitchen
```

Response 200:
```json
{ "data": { "id": "...", "status": "sent", "sentAt": "..." } }
```

### Lỗi validation
```http
POST /v1/orders
{ "lines": [] }
```

Response 422:
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Đơn phải có ít nhất 1 món.",
    "details": [
      { "field": "lines", "code": "MIN_LENGTH", "message": "Phải có ít nhất 1 dòng" }
    ],
    "requestId": "..."
  }
}
```

---
*Changelog: v0.1 — 2026-05-01.*
