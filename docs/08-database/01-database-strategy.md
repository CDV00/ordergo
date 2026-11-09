# 01 — Database Strategy

> **Phiên bản**: v0.2 (2026-05-01)
> Cập nhật so với v0.1: chuyển từ PostgreSQL sang MongoDB do quyết định stack mới (NestJS + Mongoose).

## 1. Nguyên tắc cốt lõi

Đặt trước mọi quyết định cụ thể:

1. **Một primary, một source of truth** — MongoDB. Không sync 2 chiều với Postgres ở MVP.
2. **Modular từ ngày 1** — mỗi module (Tenant, Catalog, Order, Payment, ...) sở hữu collection riêng, không cross-module foreign reference.
3. **ACID trong module, eventual consistency cross-module** — payment + order ở cùng module Order dùng multi-doc transaction. Order trừ kho ở module Inventory qua event.
4. **Schema is real** — Mongo không có nghĩa là không có schema. Validation rule + index + Mongoose schema bắt buộc.
5. **Tenant isolation > tất cả** — không tin trust app filter, validate ở repository layer + có integration test.
6. **Repository abstraction** — domain code không gọi Mongoose trực tiếp. Khi cần swap engine (Postgres / .NET rewrite), chỉ thay implementation.
7. **Index là first-class** — viết schema xong viết index ngay, không "tối ưu sau".
8. **Soft delete + audit log** ở mọi nơi — không xoá vật lý dữ liệu nghiệp vụ.

## 2. Tại sao MongoDB

Quyết định của founder; tài liệu này ghi nhận **lý do hợp lệ** và **rủi ro phải mitigate**.

### Lý do chấp nhận được
- Team NestJS + TypeScript thoải mái với document model
- Mongoose ecosystem mature, dev velocity cao
- Schema linh hoạt cho field như `modifiers`, `metadata`, `settings` — đỡ migration
- F&B menu structure (món với variants, toppings, recipes nested) **document-natural**: 1 menu item có thể embed variant/topping vào 1 document, đọc 1 query
- Atlas managed có sẵn backup, replica, monitoring

### Rủi ro đã chấp nhận
| Rủi ro | Mitigation |
| --- | --- |
| Transaction multi-doc performance | Hạn chế phạm vi transaction trong cùng module + monitor |
| Báo cáo phức tạp khó hơn SQL | Aggregation pipeline + thêm Postgres OLAP read-replica khi cần |
| Schema drift (mỗi document khác structure) | JSON Schema validation bắt buộc ở Mongo level |
| Cost cao hơn Postgres ở scale | Chấp nhận, monitor, plan migrate khi unit economics căng |
| Chuyển .NET tương lai | Repository abstraction → port code logic, schema giữ nguyên |

## 3. Topology

### MVP (đến ~100 venue)
```
┌────────────────────────────┐
│  NestJS API (1 instance)   │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  MongoDB Replica Set 3 node│
│  (Atlas M10 hoặc self)     │
│  Primary + 2 secondary     │
└────────────────────────────┘
             ▲
             │
┌────────────────────────────┐
│  Redis (cache + queue)     │
└────────────────────────────┘
```

### Năm 1 (100–1.000 venue)
- Mongo: Atlas M30 hoặc self host larger instance
- Replica set 3 node, 1 secondary read-only cho báo cáo
- Sharding chưa cần
- Redis cluster mode

### Năm 2 (1.000+ venue)
- Sharding theo `tenantId` hash
- Add **Postgres OLAP replica** qua Change Streams cho báo cáo phức tạp + benchmark cohort
- Tách collection lớn (orders, audit_logs) ra DB riêng nếu cần

### Năm 3+ (10.000+ venue, multi-vertical)
- Tenant Enterprise có cluster Mongo riêng (silo)
- Cân nhắc **rewrite sang .NET + Postgres** nếu scale economics nghiêng về relational

## 4. Quy ước đặt tên

### Collection
- **snake_case số nhiều**: `tenants`, `venues`, `menu_items`, `order_lines`, `audit_logs`
- Prefix module nếu cần disambiguate: `catalog_menu_items`, `hotel_rooms` (chỉ khi conflict — mặc định không prefix)

### Field
- **camelCase**: `tenantId`, `createdAt`, `isActive`
- Boolean prefix `is`/`has`: `isActive`, `hasInventory`
- Date suffix `At`: `createdAt`, `paidAt`, `deletedAt`
- Timestamp luôn UTC, store ISODate, hiển thị theo timezone của venue

### ID
- `_id`: **ObjectId** Mongo native (cho Mongo internal performance)
- ID public, cross-module reference: **UUID v7** field riêng (vd: `id`, `tenantId`, `venueId`) — UUID v7 vì có timestamp prefix → index-friendly, sort được theo creation time
- ID human-readable cho user: cột riêng (`orderNumber: "ORD-20260501-0001"`)

> **Tại sao 2 ID?** ObjectId tốt cho Mongo internals nhưng leak ra API là anti-pattern (timestamp + machine id leak metadata). UUID v7 public-safe + sort được + dễ port sang DB khác.

### Money
```ts
{ amount: 50000, currency: "VND" }
```
- `amount` integer (VND không có decimal). Nếu vertical có decimal (tip USD), convert sang đơn vị nhỏ nhất (cents).
- Không bao giờ dùng float/double cho tiền.

### Enum
- String snake_case lowercase: `"dine_in"`, `"paid"`, `"checked_in"`
- Mongo native enum trong schema validation

### Reference cross-collection
- Trong cùng module: có thể dùng Mongoose `ref` với populate (sparingly)
- Cross module: **chỉ store UUID** + snapshot — không bao giờ populate qua module

## 5. Multi-tenant strategy (recap, chi tiết ở `03-domain/04-multi-tenant.md`)

### Pooled — 1 cluster, mọi tenant chung

- Mọi document có `tenantId` (UUID v7)
- Repository inject `ITenantContext` → mọi query auto-filter `{ tenantId: ctx.tenantId }`
- Mongo không có Row-Level Security native → enforce ở app layer
- **Test isolation bắt buộc**: integration test với 2 tenant verify cross-leak

### Cấu trúc DB physical (MVP)

1 database duy nhất `ordergo` chứa mọi collection.

```
ordergo
├── tenants
├── venues
├── users
├── memberships
├── menu_categories
├── menu_items
├── tables
├── orders
├── order_events            // outbox
├── payments
├── customers
├── shifts
├── audit_logs
├── notifications
└── ... (per module)
```

### Cấu trúc DB physical (Năm 2+, sharding)

- Vẫn 1 database, sharded theo `tenantId` hash
- Collection nhỏ (tenants, users) un-sharded (lookup ít)
- Collection lớn (orders, order_lines, audit_logs) sharded

### Tenant Enterprise — silo (Năm 3+)
- DB riêng `ordergo_<tenant-slug>` cho khách enterprise
- Cùng schema, cùng codebase
- Routing layer chọn DB theo tenant từ JWT

## 6. Connection & Pooling

### NestJS + Mongoose config (reference, không phải code production)

```ts
MongooseModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    uri: config.get('MONGO_URI'),
    autoIndex: false,        // tắt prod, build index qua migration
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    retryWrites: true,
    writeConcern: { w: 'majority', j: true },  // durability cho payment
    readPreference: 'primary', // mặc định; secondary cho báo cáo
    readConcern: { level: 'majority' },
  }),
});
```

- `writeConcern: majority` cho mọi write tài chính (order, payment) — đảm bảo replica nhận ack
- Read split: critical path → primary; báo cáo + dashboard → `secondaryPreferred`
- Connection pool: 50 max là baseline, monitor và tune

## 7. Transactions

### Khi nào dùng multi-doc transaction
- Tạo Order + OrderLines + decrement Inventory cache
- Tạo Payment + update Order.status
- Refund: Payment + Order + audit_log

### Khi nào KHÔNG dùng transaction
- Cross-module work → dùng **Outbox pattern** (event eventual consistency)
- Reporting query — eventual consistent OK
- Webhook fanout

### Pattern code
```ts
// Pseudo-code, repository wrap
const session = await connection.startSession();
session.startTransaction();
try {
  await orderRepo.create(order, { session });
  await outboxRepo.create(orderCreatedEvent, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

> Outbox event được publish bởi worker đọc `outbox` collection — không publish trong cùng transaction (vì broker không tham gia transaction).

## 8. Soft Delete

- Mọi document nghiệp vụ có `deletedAt: Date | null`
- Query default filter `{ deletedAt: null }` qua Mongoose middleware
- Hard delete chỉ qua DBA flow đặc biệt sau retention period (90 ngày cho non-financial, 7 năm cho financial)
- Compound index include `deletedAt` để query nhanh

## 9. Audit Log

Tách collection `audit_logs` riêng, append-only.

```js
{
  _id: ObjectId,
  id: "uuid-v7",
  tenantId: "uuid",
  userId: "uuid",
  action: "order.cancel",
  entityType: "Order",
  entityId: "uuid",
  before: { ... },
  after: { ... },
  metadata: { reason: "...", ipAddress: "...", userAgent: "..." },
  timestamp: ISODate
}
```

- Không update / delete dòng audit log qua API
- TTL index 7 năm cho action tài chính, 1 năm cho action thường
- Sharded theo `tenantId` từ năm 2

## 10. Backup & Recovery

| Hạng mục | MVP | Năm 1+ |
| --- | --- | --- |
| Backup tần suất | Daily snapshot (Atlas auto hoặc `mongodump` cron) | Continuous WAL + daily snapshot |
| Retention | 30 ngày | 90 ngày + monthly archive 1 năm |
| Encryption | At-rest qua Atlas / KMS | Same |
| Cross-region copy | ❌ | ✅ |
| RPO | 5 phút (oplog tail) | < 1 phút |
| RTO | 1 giờ | 15 phút |
| Restore test | Monthly manual | Automated weekly |

Atlas có Point-in-Time Recovery built-in cho M10+ — nên dùng.

## 11. Schema versioning

Mỗi document có cột `schemaVersion: number` cho migration in-place.

```js
{
  _id: ObjectId,
  schemaVersion: 2,
  // fields version 2
}
```

Migration pattern:
1. Code app đọc cả v1 và v2 → write v2
2. Background job migrate v1 → v2 batch
3. Sau khi 100% v2 → bỏ code đọc v1

Không dùng "ALTER TABLE" như SQL — Mongo không có concept đó. Migration = job đọc-update-batch.

## 12. Anti-patterns cần tránh

- ❌ Embed unbounded array (vd: tất cả `orders` của 1 customer trong document Customer) — document size limit 16MB
- ❌ Cross-module Mongoose `ref` + populate — gây tight coupling
- ❌ Auto-create index trong production (`autoIndex: true`) — chậm khi deploy
- ❌ Aggregate trên primary giờ peak — dùng secondary
- ❌ `find({}).limit(N)` không có sort + index — Mongo không guarantee order
- ❌ Lưu password/secret raw — luôn hash/encrypt
- ❌ `$lookup` xuyên module — dùng denormalize hoặc query 2 lần ở app
- ❌ Cache key không có `tenantId` prefix
- ❌ `_id: ObjectId` làm public ID — leak timestamp + machine info

## 13. Thư viện & Tooling

| Mục đích | Tool |
| --- | --- |
| ODM | Mongoose 8+ |
| Validation | Mongoose Schema + Joi/Zod ở Application layer |
| Migration | `migrate-mongo` package |
| GUI tool | MongoDB Compass / Studio 3T |
| Monitoring | Atlas Performance Advisor + Prometheus exporter |
| Backup verify | `mongorestore --dryRun` weekly |
| UUID v7 | `uuid` package (v9.0+) hoặc tự gen với timestamp prefix |

## 14. Roadmap quyết định DB

| Mốc | Quyết định |
| --- | --- |
| MVP (T0–T3) | Mongo Atlas M10, single replica set |
| Tháng 6 | Đánh giá: cost, performance, complaint dev — go/no-go vẫn Mongo |
| Tháng 9 | Add Postgres OLAP replica nếu báo cáo > 3s p95 |
| Năm 2 | Sharding |
| Năm 3 | Đánh giá rewrite sang .NET + Postgres nếu unit economics thua |

---
*Changelog*:
- v0.2 — 2026-05-01: thay PostgreSQL → MongoDB primary do quyết định stack; giữ Postgres làm OLAP option tương lai.
- v0.1 — 2026-05-01: phiên bản đầu (Postgres primary, đã thay thế).
