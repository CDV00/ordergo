# 03 — Indexing & Performance Strategy

> **Phiên bản**: v0.2 (2026-05-02)

Index là yếu tố quan trọng nhất quyết định performance MongoDB. File này là **playbook** — không phải lý thuyết.

## 1. Nguyên tắc cốt lõi

1. **Mọi query phải hit index** — `executionStats.totalDocsExamined` phải ≤ `nReturned × 2` (verify trong CI khi có integration test).
2. **Compound index theo ESR rule**: **E**quality fields → **S**ort field → **R**ange fields. Sai thứ tự = index không dùng được hết.
3. **`tenantId` luôn là field đầu tiên** trong mọi compound index. Đây là rule cứng.
4. **Build index off-peak** — `{ background: true }` cho online build, hoặc rolling index trên replica.
5. **Đo trước khi tối ưu** — dùng `explain('executionStats')`, không guess.
6. **Index không free** — mỗi index thêm ~10–30% write overhead. Đừng index "phòng khi cần".

## 2. ESR Rule (Equality, Sort, Range)

Pattern compound index nên theo thứ tự:

```
{ <equality field>: 1, <sort field>: ±1, <range field>: 1 }
```

### Ví dụ — `orders` query "đơn hôm nay của venue X status paid, sort theo paidAt"

```js
db.orders.find({
  tenantId: "...",         // E
  venueId: "...",          // E
  status: "paid",          // E
  paidAt: { $gte: today }  // R
}).sort({ paidAt: -1 })    // S
```

→ Index: `{ tenantId: 1, venueId: 1, status: 1, paidAt: -1 }` — covers Equality, Sort + Range collapse vì `paidAt` ở cuối.

❌ **Sai**: `{ tenantId: 1, paidAt: -1, venueId: 1, status: 1 }` — không match ESR, range trước equality, query phải scan.

## 3. Index master list

Bảng tổng hợp **index bắt buộc** cho từng collection. Mọi index đều có `{tenantId: 1, ...}` ở đầu (trừ `users` toàn cục).

### Identity

| Collection | Index | Type | Lý do |
| --- | --- | --- | --- |
| `users` | `{phone: 1}` | unique | login bằng phone |
| `users` | `{email: 1}` | unique sparse | login email (optional) |
| `users` | `{id: 1}` | unique | public ID lookup |
| `memberships` | `{tenantId: 1, userId: 1, venueId: 1}` | unique | uniqueness per (user, tenant, venue) |
| `memberships` | `{userId: 1, status: 1}` | — | list tenants của user |
| `memberships` | `{tenantId: 1, status: 1, roleCode: 1}` | — | list nhân viên theo role |
| `refresh_tokens` | `{userId: 1, revokedAt: 1}` | — | token list per user |
| `refresh_tokens` | `{tokenHash: 1}` | unique | lookup khi refresh |
| `refresh_tokens` | `{expiresAt: 1}` | TTL | auto cleanup |

### Tenant & Venue

| Collection | Index | Type |
| --- | --- | --- |
| `tenants` | `{id: 1}` | unique |
| `tenants` | `{ownerUserId: 1}` | — |
| `tenants` | `{taxCode: 1}` | unique sparse |
| `venues` | `{tenantId: 1, code: 1}` | unique |
| `venues` | `{tenantId: 1, status: 1}` | — |
| `venues` | `{tenantId: 1, businessType: 1}` | — |
| `venues` | `{address.geoPoint: "2dsphere"}` | geo (cho hotel marketplace tương lai) |

### Catalog F&B

| Collection | Index |
| --- | --- |
| `menu_categories` | `{tenantId: 1, venueId: 1, displayOrder: 1}` |
| `menu_categories` | `{tenantId: 1, isActive: 1}` |
| `menu_items` | `{tenantId: 1, venueId: 1, categoryId: 1, displayOrder: 1}` |
| `menu_items` | `{tenantId: 1, venueId: 1, isAvailable: 1}` |
| `menu_items` | `{tenantId: 1, sku: 1}` sparse |
| `menu_items` | `{tenantId: 1, name: "text", description: "text", tags: "text"}` text |
| `recipes` | `{tenantId: 1, menuItemId: 1, variantId: 1}` |

### Order

> Đây là collection **hot nhất**. Index cẩn thận.

| Collection | Index | Use case |
| --- | --- | --- |
| `orders` | `{tenantId: 1, venueId: 1, status: 1, createdAt: -1}` | list orders trang chính |
| `orders` | `{tenantId: 1, venueId: 1, orderNumber: 1}` unique | tra cứu số đơn |
| `orders` | `{tenantId: 1, customerId: 1, createdAt: -1}` sparse | lịch sử khách |
| `orders` | `{tenantId: 1, tableId: 1, status: 1}` sparse | bàn đang phục vụ — partial: `status IN [draft, sent, in_progress, ready, served]` |
| `orders` | `{tenantId: 1, bookingId: 1}` sparse | order của booking |
| `orders` | `{tenantId: 1, clientId: 1}` sparse unique | idempotency — TTL 24h sau create |
| `orders` | `{tenantId: 1, venueId: 1, paidAt: -1}` sparse | báo cáo doanh thu |
| `orders` | `{tenantId: 1, venueId: 1, businessContext: 1, createdAt: -1}` | filter F&B/Hotel |
| `orders` | `{"lines.kitchenStatus": 1, tenantId: 1, venueId: 1}` | KDS query |
| `order_events` | `{publishedAt: 1, occurredAt: 1}` | outbox publisher poll (publishedAt:null first) |
| `order_events` | `{tenantId: 1, aggregateId: 1, occurredAt: 1}` | event log of order |
| `order_events` | `{publishedAt: 1}` partial (publishedAt: {$ne: null}) TTL 30d | cleanup published |

> **Partial index** cho `orders.tableId`: filter `status IN [active states]` → index chỉ chứa active orders, nhỏ hơn nhiều.

### Payment

| Collection | Index |
| --- | --- |
| `payments` | `{tenantId: 1, orderId: 1}` |
| `payments` | `{tenantId: 1, venueId: 1, receivedAt: -1}` |
| `payments` | `{tenantId: 1, externalRef: 1}` sparse — webhook reconcile |
| `payments` | `{tenantId: 1, shiftId: 1}` sparse |
| `payments` | `{tenantId: 1, status: 1, receivedAt: -1}` |
| `payment_sessions` | `{tenantId: 1, orderId: 1, status: 1}` |
| `payment_sessions` | `{externalSessionId: 1}` |
| `payment_sessions` | `{expiresAt: 1}` TTL — auto expire |

### E-Invoice

| Collection | Index |
| --- | --- |
| `e_invoices` | `{tenantId: 1, orderId: 1}` |
| `e_invoices` | `{tenantId: 1, lookupCode: 1}` unique |
| `e_invoices` | `{tenantId: 1, providerInvoiceNo: 1, provider: 1}` unique |
| `e_invoices` | `{tenantId: 1, invoiceDate: -1}` |
| `e_invoices` | `{status: 1, submittedAt: 1}` partial (status:submitted) — worker retry |

### Customer & Loyalty

| Collection | Index |
| --- | --- |
| `customers` | `{tenantId: 1, phone: 1}` unique |
| `customers` | `{tenantId: 1, email: 1}` sparse |
| `customers` | `{tenantId: 1, name: "text"}` text |
| `customers` | `{tenantId: 1, "stats.lastOrderAt": -1}` |
| `customers` | `{tenantId: 1, tags: 1}` |
| `customers` | `{tenantId: 1, "stats.totalSpent.amount": -1}` |
| `loyalty_cards` | `{tenantId: 1, customerId: 1}` unique |
| `loyalty_cards` | `{tenantId: 1, cardNumber: 1}` unique |
| `loyalty_transactions` | `{tenantId: 1, cardId: 1, createdAt: -1}` |
| `vouchers` | `{tenantId: 1, code: 1}` unique |
| `vouchers` | `{tenantId: 1, status: 1, "validity.endsAt": 1}` |

### Inventory

| Collection | Index |
| --- | --- |
| `stock_items` | `{tenantId: 1, venueId: 1, sku: 1}` unique |
| `stock_items` | `{tenantId: 1, venueId: 1, name: "text"}` text |
| `stock_items` | `{tenantId: 1, venueId: 1, alertThreshold: 1}` partial (stockLevel < threshold) — alert query |
| `stock_movements` | `{tenantId: 1, stockItemId: 1, createdAt: -1}` |
| `stock_movements` | `{tenantId: 1, venueId: 1, createdAt: -1}` |
| `stock_movements` | `{tenantId: 1, referenceId: 1}` sparse |
| `purchase_orders` | `{tenantId: 1, venueId: 1, status: 1, createdAt: -1}` |
| `purchase_orders` | `{tenantId: 1, supplierId: 1, createdAt: -1}` |

### Shift

| Collection | Index |
| --- | --- |
| `shifts` | `{tenantId: 1, venueId: 1, status: 1, openedAt: -1}` |
| `shifts` | `{tenantId: 1, cashierId: 1, openedAt: -1}` |

### Hospitality (năm 2)

| Collection | Index |
| --- | --- |
| `rooms` | `{tenantId: 1, venueId: 1, number: 1}` unique |
| `rooms` | `{tenantId: 1, venueId: 1, status: 1}` |
| `rooms` | `{tenantId: 1, venueId: 1, roomTypeId: 1}` |
| `bookings` | `{tenantId: 1, venueId: 1, checkInDate: 1, status: 1}` |
| `bookings` | `{tenantId: 1, venueId: 1, bookingNumber: 1}` unique |
| `bookings` | `{tenantId: 1, customerId: 1, createdAt: -1}` |
| `bookings` | `{externalRef: 1}` sparse |
| `bookings` | `{tenantId: 1, roomId: 1, status: 1}` partial (status: checked_in) |
| `room_inventory` | `{tenantId: 1, venueId: 1, roomTypeId: 1, date: 1}` unique |

### Notification

| Collection | Index |
| --- | --- |
| `notifications` | `{tenantId: 1, status: 1, createdAt: 1}` — worker queue |
| `notifications` | `{tenantId: 1, recipientId: 1, createdAt: -1}` |
| `notifications` | `{createdAt: 1}` TTL 90 ngày |

### Audit

| Collection | Index |
| --- | --- |
| `audit_logs` | `{tenantId: 1, timestamp: -1}` |
| `audit_logs` | `{tenantId: 1, entityType: 1, entityId: 1, timestamp: -1}` |
| `audit_logs` | `{tenantId: 1, userId: 1, timestamp: -1}` |
| `audit_logs` | `{tenantId: 1, action: 1, timestamp: -1}` |

> Audit logs **không TTL ở MVP**. Sau 1 năm: archive sang cold storage, bỏ document khỏi DB chính.

### Integration

| Collection | Index |
| --- | --- |
| `api_keys` | `{tenantId: 1, status: 1}` |
| `api_keys` | `{keyPrefix: 1, keyHash: 1}` unique |
| `webhook_endpoints` | `{tenantId: 1, status: 1}` |
| `webhook_deliveries` | `{tenantId: 1, endpointId: 1, createdAt: -1}` |
| `webhook_deliveries` | `{status: 1, nextAttemptAt: 1}` partial (status: pending) |
| `webhook_deliveries` | `{createdAt: 1}` TTL 30 ngày sau delivered |

### Reporting (read models)

| Collection | Index |
| --- | --- |
| `daily_sales_summaries` | `{tenantId: 1, venueId: 1, date: -1}` |
| `customer_lifetime_values` | `{tenantId: 1, "stats.totalSpent.amount": -1}` |

---

## 4. TTL indexes

| Collection | Field | TTL | Lý do |
| --- | --- | --- | --- |
| `refresh_tokens` | `expiresAt` | 0 (use field value) | Auto cleanup expired tokens |
| `payment_sessions` | `expiresAt` | 0 | Auto expire QR sessions |
| `notifications` | `createdAt` | 90 ngày | Cleanup old notifs |
| `webhook_deliveries` | `createdAt` | 30 ngày | After delivered |
| `order_events` | `publishedAt` | 30 ngày (partial: published only) | Cleanup outbox after publish |

> **TTL caveat**: Mongo TTL chạy mỗi 60s — không guarantee precise. Đừng dùng TTL cho data sensitive về timing (vd: phiên đặt phòng).

## 5. Text search

Field text:
- `menu_items`: `name`, `description`, `tags`
- `customers`: `name`
- `stock_items`: `name`

> Vietnamese text search: Mongo text default không support tốt. Cân nhắc dùng:
> 1. `$regex` với case-insensitive cho query đơn giản (small dataset)
> 2. **MongoDB Atlas Search** (Lucene-based) cho production, hỗ trợ tiếng Việt diacritics
> 3. Tương lai: dedicated **Meilisearch** / **Typesense** cho UX search nhanh

## 6. Geo indexes

- `venues.address.geoPoint`: `2dsphere` — cho future "tìm cơ sở gần tôi" (nếu có app khách cuối)
- Không cần ở MVP

## 7. Partial indexes (giảm size + speed up query)

Example — chỉ index orders đang active:

```js
db.orders.createIndex(
  { tenantId: 1, tableId: 1 },
  {
    partialFilterExpression: {
      status: { $in: ["draft", "sent", "in_progress", "ready", "served"] },
      tableId: { $exists: true }
    },
    name: "active_orders_by_table"
  }
)
```

→ Index chỉ chứa orders đang active, không bao gồm `paid` (đa số orders sau 1 ngày là paid). Nhỏ hơn 10–50x.

Áp dụng tương tự:
- `bookings`: status `checked_in` → query "phòng nào đang có khách"
- `webhook_deliveries`: status `pending` → worker chỉ scan pending
- `payment_sessions`: status `pending` → tương tự

## 8. Sharding strategy (năm 2+)

### Khi nào shard
- DB > 500GB
- Write throughput > 10k/s
- Single replica set không scale vertical đủ

### Shard key chọn

| Collection | Shard key đề xuất | Lý do |
| --- | --- | --- |
| `orders` | `{tenantId: "hashed"}` | phân bố đều, tenant-isolated |
| `payments` | `{tenantId: "hashed"}` | giống orders |
| `audit_logs` | `{tenantId: 1, timestamp: 1}` | range, time-series |
| `notifications` | `{tenantId: "hashed"}` | |
| `customers` | `{tenantId: "hashed"}` | |
| `stock_movements` | `{tenantId: 1, createdAt: 1}` | time-series, range |
| `webhook_deliveries` | `{tenantId: "hashed"}` | |

### Tránh shard
- `tenants`, `venues`, `users`, `memberships`: nhỏ + lookup nhiều → giữ unsharded, broadcast OK
- `menu_items`, `tables`, `rooms`: nhỏ per tenant → unsharded

### Lưu ý
- Hashed shard key tốt cho phân bố nhưng **không cho range query trên shard key** — không vấn đề vì query luôn equality `tenantId`
- Compound shard key `{tenantId: 1, _id: 1}` cho phép cả write distribute và range scan trong tenant — alternative cho hashed

## 9. Read preferences

| Use case | Read preference | Lý do |
| --- | --- | --- |
| POS giờ peak (POS, KDS) | `primary` | Cần latest, không tolerate stale |
| Payment validate | `primary` | Critical |
| Báo cáo dashboard | `secondaryPreferred` | Stale 1–2s OK, giảm tải primary |
| Customer lookup (cashier) | `primaryPreferred` | Stale OK nếu primary down |
| Bookings calendar | `secondary` | Read-heavy |
| Audit log search | `secondary` | Đọc nhiều, không cần realtime |

## 10. Write concerns

| Use case | Write concern | Lý do |
| --- | --- | --- |
| Payment, e-invoice, audit log | `{w: "majority", j: true}` | Durability tuyệt đối |
| Order create/update | `{w: "majority"}` | Durability cao |
| Notification send | `{w: 1}` | Có thể retry |
| Reporting read model update | `{w: 1}` | Eventual consistent |

## 11. Document size limits

- Document Mongo max **16MB** — cứng
- Embedded array nên giới hạn:
  - `menu_items.variants`: max 20
  - `menu_items.toppingGroups`: max 10
  - `orders.lines`: max 200 (cảnh báo, soft limit) — nếu vượt → tách `order_lines` collection
  - `orders.appliedDiscounts`: max 5
  - `audit_logs.before/after`: cap snapshot size (truncate hoặc reference S3)

## 12. Profiling & monitoring

### Slow query log
- Bật `slowOpThresholdMs: 100ms` — mọi query > 100ms log lại
- Review weekly trong sprint review

### Atlas Performance Advisor
- Bật, follow gợi ý index nhưng verify trước khi apply (tránh redundant index)

### Custom metrics
- `mongodb_cursor_open` count
- `mongodb_connections_current`
- `mongodb_oplog_window` — cảnh báo khi < 24h

### Health checks
- Replica lag < 5s
- Index size growth weekly
- Disk usage < 70%

## 13. Anti-patterns cụ thể

- ❌ `find({tenantId, ...}).sort({createdAt: -1})` mà compound index có `createdAt: 1` (sort direction sai)
- ❌ `$regex` không anchored ở đầu chuỗi `/abc/` — full collection scan. Dùng `/^abc/` để hit index
- ❌ Index `{createdAt: 1}` không kèm `tenantId` — query phải scan all tenants
- ❌ `$or` query với mỗi nhánh hit index khác → mỗi nhánh build riêng tốn time. Tách 2 query app-level
- ❌ `$ne`, `$nin` — không hit index efficient
- ❌ Aggregate `$lookup` cross-collection lớn không kèm filter trước — đọc full collection bên kia
- ❌ Update không có filter `_id` hoặc indexed field → multi-doc lock
- ❌ Tạo nhiều index có cùng prefix dư thừa: `{a:1}` + `{a:1,b:1}` → drop `{a:1}`, prefix của index sau cover được

## 14. Index playbook khi thêm feature

Khi thêm endpoint mới:

1. Viết query Mongo dự kiến
2. `explain('executionStats')` — verify `IXSCAN` (không `COLLSCAN`)
3. `totalDocsExamined / nReturned` < 100 (lý tưởng < 10)
4. `executionTimeMillis` < 50ms cho query realtime, < 500ms cho báo cáo
5. Nếu fail → thêm/sửa index, document trong file này
6. Migration script tạo index với `{ background: true }`
7. Code review: PR phải có index nếu thêm query mới

## 15. Index size budget

Rule of thumb cho năm 1 (~500GB data):
- Tổng index size < 30% data size = ~150GB
- Per-collection index ratio < 50% (nếu hơn → quá index, drop bớt)

---
*Changelog: v0.2 — 2026-05-02 — bản đầu cho stack Mongo.*
