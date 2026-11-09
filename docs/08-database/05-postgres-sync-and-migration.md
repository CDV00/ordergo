# 05 — Postgres Sync & Migration Path

> **Phiên bản**: v0.2 (2026-05-02)
>
> Hai chủ đề riêng nhưng liên quan:
> 1. **Khi nào** thêm Postgres làm OLAP read replica (sync 1 chiều từ Mongo)
> 2. **Migration path** nếu tương lai chuyển stack sang .NET + Postgres làm primary

## Phần A — Postgres OLAP Read Replica

### A.1 Vì sao có thể cần (sau này)

MongoDB tốt cho OLTP (transactional) nhưng có những hạn chế cho OLAP:

| Use case | Mongo aggregation | Postgres SQL |
| --- | --- | --- |
| Báo cáo tổng hợp đơn giản | OK (`$group`, `$sum`) | OK |
| Báo cáo nhiều bảng JOIN | `$lookup` chậm khi data lớn | JOIN tối ưu tốt |
| Window function (running total, rank) | Cồng kềnh | Native |
| Cohort analysis | Khó viết | SQL GROUP BY thuần |
| Ad-hoc query của analyst | Aggregation pipeline khó học | SQL universal |
| BI tool integration | Ít tool support Mongo | Mọi BI tool support Postgres |

→ **Khi nào thêm Postgres**:
- Báo cáo p95 > 3s (target NFR `04-architecture/05-nfr.md`)
- Founder/business team cần ad-hoc analytics
- Tích hợp BI tool (Metabase, Looker, Superset)
- Cohort/retention analysis cần thiết cho growth team

→ **Khi nào KHÔNG cần**: MVP và năm 1, < 1.000 venue. Aggregation Mongo + read replica + cache là đủ.

### A.2 Architecture — One-way sync (Mongo → Postgres)

```
                ┌──────────────────────┐
                │  MongoDB Replica Set │  (source of truth)
                │  Primary + Secondary │
                └──────────┬───────────┘
                           │ Change Streams (oplog tail)
                           ▼
                ┌──────────────────────┐
                │  CDC Pipeline        │
                │  (Debezium / custom) │
                └──────────┬───────────┘
                           │ Transform
                           ▼
                ┌──────────────────────┐
                │  PostgreSQL          │  (read-only, OLAP)
                │  + JSONB / relational│
                └──────────────────────┘
                           ▲
                           │
                ┌──────────┴───────────┐
                │  BI tools, reports   │
                │  (Metabase/Superset) │
                └──────────────────────┘
```

**Quan trọng**: chỉ là **read replica**. App không bao giờ write vào Postgres. Đây là design chống dual-write hell.

### A.3 Tech options cho CDC pipeline

| Option | Ưu | Nhược | Recommend |
| --- | --- | --- | --- |
| **Debezium + Kafka Connect** | Industry standard, hỗ trợ MongoDB | Setup phức tạp, cần Kafka | Năm 2+ với scale lớn |
| **MongoDB Atlas Stream Processing** | Native, managed, Atlas tích hợp | Atlas only, mới (~2024+) | Nếu đã dùng Atlas |
| **Custom Node.js worker dùng Change Streams** | Đơn giản, full control | Phải tự handle reliability, retry | MVP của Postgres sync |
| **Airbyte / Fivetran** | Out-of-box ETL, nhiều destination | Cost cao, latency cao (batch) | BI-only use case, không real-time |

**Khuyến nghị**: bắt đầu với **Custom worker** khi mới thêm Postgres (lúc đó có 500–1k venue). Switch Debezium khi traffic lớn.

### A.4 Schema mapping — Mongo doc → Postgres table

#### Strategy 1: Mirror schema (relational)

Cho mỗi collection Mongo → 1 table Postgres tương đương.

```sql
-- Postgres schema for orders (read-only OLAP)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  venue_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  order_type TEXT,
  business_context TEXT,
  customer_id UUID,
  table_id UUID,
  status TEXT,
  subtotal_amount BIGINT,
  total_amount BIGINT,
  currency TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  -- snapshots & embedded → JSONB
  customer_snapshot JSONB,
  applied_discounts JSONB,
  raw_doc JSONB,                -- toàn bộ doc gốc, fallback
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- order_lines tách bảng (vì array embedded trong Mongo)
CREATE TABLE order_lines (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  tenant_id UUID NOT NULL,
  line_number INT,
  product_type TEXT,
  product_id UUID,
  product_name TEXT,
  quantity NUMERIC,
  unit_price_amount BIGINT,
  line_total_amount BIGINT,
  modifiers JSONB,
  raw_line JSONB
);

CREATE INDEX idx_orders_tenant_paid ON orders(tenant_id, paid_at DESC);
CREATE INDEX idx_orders_tenant_venue_status ON orders(tenant_id, venue_id, status, created_at DESC);
CREATE INDEX idx_order_lines_order ON order_lines(order_id);
CREATE INDEX idx_order_lines_tenant_product ON order_lines(tenant_id, product_id);
```

→ Tốt cho query SQL, JOIN, BI tools. Tốn công transform.

#### Strategy 2: Raw JSONB

Cho mỗi collection → 1 table `(_id, raw_doc JSONB)`.

```sql
CREATE TABLE orders_raw (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  raw_doc JSONB NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_raw_tenant ON orders_raw(tenant_id);
CREATE INDEX idx_orders_raw_paid_at ON orders_raw((raw_doc->>'paidAt'));
```

→ Đơn giản sync, query phức tạp hơn. Tốt khi mới bắt đầu.

#### Khuyến nghị
**Hybrid**: 
- Collection nhỏ + ít query analytics (e.g. `tenants`, `venues`, `users`) → Strategy 2 (raw)
- Collection nhiều/quan trọng analytics (`orders`, `order_lines`, `payments`, `bookings`) → Strategy 1 (mirror)

### A.5 CDC worker — code skeleton

```ts
// Pseudocode — không phải production code
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

const mongo = new MongoClient(MONGO_URI);
const pg = new Pool({ connectionString: PG_URI });

async function start() {
  const ordersColl = mongo.db('ordergo').collection('orders');

  // Resume token persisted để recover
  const resumeToken = await loadResumeToken('orders');

  const changeStream = ordersColl.watch([], {
    fullDocument: 'updateLookup',
    resumeAfter: resumeToken,
  });

  for await (const change of changeStream) {
    try {
      await handleChange(change);
      await saveResumeToken('orders', change._id);
    } catch (err) {
      logger.error('CDC handle failed', { err, change });
      // dead letter queue → manual fix
    }
  }
}

async function handleChange(change) {
  const doc = change.fullDocument;
  switch (change.operationType) {
    case 'insert':
    case 'replace':
    case 'update':
      await upsertOrder(doc);
      await syncOrderLines(doc);
      break;
    case 'delete':
      await pg.query('UPDATE orders SET deleted_at = NOW() WHERE id = $1', [change.documentKey._id]);
      break;
  }
}

async function upsertOrder(doc) {
  await pg.query(`
    INSERT INTO orders (id, tenant_id, venue_id, order_number, status, total_amount, currency, paid_at, raw_doc, synced_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW())
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      total_amount = EXCLUDED.total_amount,
      paid_at = EXCLUDED.paid_at,
      raw_doc = EXCLUDED.raw_doc,
      synced_at = NOW()
  `, [doc.id, doc.tenantId, doc.venueId, doc.orderNumber, doc.status,
      doc.pricing.total.amount, doc.pricing.total.currency, doc.paidAt, doc, ]);
}
```

### A.6 Reliability concerns

| Concern | Mitigation |
| --- | --- |
| Worker crash giữa chừng | Resume token persisted vào Postgres `cdc_state` table |
| Schema Mongo đổi | Worker phải backwards-compatible — handle missing field gracefully |
| Postgres down | Buffer local (file/Redis) để retry |
| Out-of-order events | Dùng `_id` (ObjectId timestamp) hoặc `updatedAt` để detect, ignore stale |
| Initial backfill | One-time `mongodump` → load Postgres → sau đó tail change stream |
| Schema drift Mongo vs Postgres | Test integration weekly: count + sample compare |

### A.7 Lag SLA

- **Target**: lag < 5s p95
- **Alert**: lag > 60s
- **Monitor**: query oldest unsynced doc trên cả 2 side

### A.8 Cost

| Component | MVP +Postgres | Năm 2 +Postgres |
| --- | --- | --- |
| Postgres managed (DO/RDS) | $15–30/tháng | $200–500/tháng |
| CDC worker compute | $10/tháng | $50/tháng |
| Monitoring | $0 | $30/tháng |
| **Tổng thêm vào** | **$25–40/tháng** | **$280–580/tháng** |

→ Nhỏ so với benefit nếu thật sự dùng. **Đừng thêm pre-emptive**.

### A.9 Khi nào KHÔNG cần Postgres OLAP

- Mongo Atlas Charts đủ dùng cho dashboard
- Báo cáo p95 < 1s (Mongo aggregation đủ nhanh)
- Không có analyst dùng SQL ad-hoc
- Cost matter hơn flexibility

---

## Phần B — Migration Path (Mongo → Postgres làm primary)

> Scenario: 2–3 năm tới, founder quyết định **rewrite stack sang .NET + Postgres** vì:
> - Quy mô lớn (10k+ venue), Mongo cost cao
> - Cần ACID + JOIN mạnh hơn
> - Hire team .NET dễ hơn ở scale lớn
> - Cohort analysis + reporting nặng

Migration này **lớn** — phải plan kỹ. Đây là playbook.

### B.1 Pre-migration checklist (đảm bảo đã sẵn sàng)

- [ ] Repository abstraction đã có ở mọi module
- [ ] Domain logic không leak Mongoose ở `domain/` layer
- [ ] Snapshot pattern đã áp dụng đầy đủ — không phụ thuộc populate
- [ ] No cross-module Mongoose `ref` còn sót
- [ ] Outbox pattern ổn định
- [ ] Telemetry + integration test đầy đủ (regression detection)
- [ ] Postgres OLAP replica đã chạy ≥ 6 tháng (đã hiểu mapping schema)

### B.2 Migration strategy — Strangler Fig (dần dần, không big bang)

```
Month 0: 100% NestJS + Mongo
Month 1–2: Setup .NET service mới — chỉ 1 module (Reporting first — read-only, low risk)
Month 3: .NET Reporting cutover, NestJS reporting deprecated
Month 4–6: Tiếp module 2 (Inventory — write, batch)
Month 7–10: Module 3, 4 (Customer, Catalog)
Month 11–14: Module core (Order, Payment) — last
Month 15: NestJS deprecated hoàn toàn
```

→ **Không bao giờ rewrite all-at-once**. Mỗi module tách + cutover độc lập.

### B.3 Per-module migration steps

Cho mỗi module:

1. **Build .NET equivalent** — port domain logic + repository + use cases
2. **Mongo → Postgres** — migration script copy data, verify count + sample
3. **Dual-write phase** (1–2 tuần) — cả NestJS lẫn .NET đều write, .NET là canary
4. **Read shift** — 10% traffic read → .NET, đo metric
5. **Full read shift** — 100% read .NET
6. **Stop write NestJS** — chỉ .NET write
7. **Verify 1 tuần** — không regression
8. **Drop NestJS code** + Mongo collection

### B.4 Mongo → Postgres data transform

```sql
-- Postgres primary schema (relational, đầy đủ, không phải read replica)
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  venue_id UUID NOT NULL REFERENCES venues(id),
  order_number VARCHAR(40) NOT NULL,
  order_type VARCHAR(40) NOT NULL,
  business_context VARCHAR(40) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  table_id UUID REFERENCES tables(id),
  status VARCHAR(40) NOT NULL,
  subtotal BIGINT NOT NULL,
  discount BIGINT NOT NULL DEFAULT 0,
  service_charge BIGINT NOT NULL DEFAULT 0,
  tax BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  customer_snapshot JSONB,           -- giữ JSONB cho snapshot
  metadata JSONB,                    -- linh hoạt
  source VARCHAR(20),
  source_ref VARCHAR(100),
  client_id UUID,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  schema_version INT NOT NULL DEFAULT 1,

  UNIQUE (tenant_id, venue_id, order_number),
  UNIQUE (tenant_id, client_id)
);

CREATE TABLE order_lines (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  line_number INT NOT NULL,
  product_type VARCHAR(40) NOT NULL,
  product_id UUID NOT NULL,
  product_snapshot JSONB NOT NULL,
  variant_id UUID,
  variant_snapshot JSONB,
  modifiers JSONB DEFAULT '[]',
  quantity NUMERIC(10,3) NOT NULL,
  unit_price BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  line_subtotal BIGINT NOT NULL,
  discount BIGINT NOT NULL DEFAULT 0,
  line_total BIGINT NOT NULL,
  note TEXT,
  kitchen_status VARCHAR(40),
  kitchen_station VARCHAR(40),
  sent_to_kitchen_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_tenant_venue_status_created ON orders(tenant_id, venue_id, status, created_at DESC);
CREATE INDEX idx_orders_tenant_paid_at ON orders(tenant_id, paid_at DESC) WHERE paid_at IS NOT NULL;
CREATE INDEX idx_orders_tenant_customer_created ON orders(tenant_id, customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_order_lines_order ON order_lines(order_id);
CREATE INDEX idx_order_lines_tenant_product ON order_lines(tenant_id, product_id);
```

### B.5 Quy tắc transform Mongo → Postgres

| Mongo pattern | Postgres equivalent |
| --- | --- |
| `_id: ObjectId` + `id: UUID` | `id UUID PRIMARY KEY` (drop ObjectId, dùng UUID đã có) |
| Embedded array nhỏ (`variants`) | JSONB column hoặc table riêng — tuỳ access pattern |
| Embedded array lớn (`order.lines`) | Table riêng + FK |
| Money object `{amount, currency}` | 2 column: `total BIGINT, currency CHAR(3)` |
| `Date` ISO | `TIMESTAMPTZ` |
| Nested object (`pricing`, `address`) | JSONB hoặc flat columns — flat nếu query nhiều, JSONB nếu chỉ display |
| Soft delete `deletedAt` | `deleted_at TIMESTAMPTZ` + view `WHERE deleted_at IS NULL` |
| TTL index | Postgres không có TTL native — cron job DELETE old rows |
| Text index | `pg_trgm` extension hoặc Postgres FTS |
| Geo `2dsphere` | PostGIS `geography(POINT, 4326)` |

### B.6 Risk list cho migration

| Risk | Mitigation |
| --- | --- |
| Data loss during transform | Backup Mongo trước, parallel run, sample compare |
| Schema mismatch khi nghĩ là 1:1 | Test fixture với edge cases (null field, missing optional) |
| Performance regression | Load test .NET + Postgres trước cutover |
| Team chưa quen .NET | Hire .NET senior trước rewrite, training 1 tháng |
| Customer downtime | Strangler fig — không có downtime nếu làm đúng |
| Outbox event lệch giữa 2 stack | Sequence number + idempotent consumer |
| Cost tăng tạm thời | Plan budget 6 tháng dual-stack |

### B.7 Quyết định: có nên migrate?

Đặt 5 câu hỏi trước khi commit:

1. **Vấn đề cụ thể nào Mongo không giải quyết được?** Liệt kê. Nếu chung chung "scale" → chưa đủ.
2. **Cost rewrite (team-month) vs. cost giữ Mongo (infra)** trong 24 tháng tới?
3. **Team có .NET senior chưa?** Nếu phải hire 5 dev → 6 tháng delay
4. **Có khả năng điều phối parallel run 6–12 tháng không?**
5. **Đối thủ ship gì trong thời gian rewrite?** Rewrite = freeze feature → đối thủ vượt mặt

→ Nếu không có lý do **business cụ thể**, đừng rewrite. Optimize Mongo trước (sharding, read replica, caching, query tuning).

### B.8 Alternative: stay Mongo, optimize

Trước khi rewrite, thử:
- Sharding theo `tenantId`
- Multi read replica cho phân tải
- Add Postgres OLAP cho báo cáo (Phần A) — giải quyết 80% lý do người ta nghĩ "cần Postgres"
- Caching layer mạnh hơn (Redis cluster)
- Tách collection lớn ra database/cluster riêng
- Atlas tier upgrade

90% case "Mongo không scale" thật ra là "Mongo chưa được tune đúng".

---

## Phần C — Quyết định kiến trúc (record)

| Quyết định | Date | Người quyết | Lý do |
| --- | --- | --- | --- |
| Mongo làm primary, không sync Postgres ở MVP | 2026-05-01 | Founder | Chấp nhận trade-off để ship nhanh, dev quen, document-natural cho menu/order |
| Postgres OLAP replica thêm khi báo cáo p95 > 3s hoặc cần BI | TBD (~tháng 9) | TBD | Trigger metric-based |
| Rewrite .NET + Postgres: review hằng quý từ năm 2 | TBD | Tech Lead + Founder | Trigger: scale economics, hire situation, vấn đề cụ thể |

---

## Tổng kết

| Tình huống | Giải pháp |
| --- | --- |
| MVP, < 100 venue | Mongo only — đủ |
| Năm 1, < 1.000 venue | Mongo only + read replica + Atlas Charts cho dashboard |
| Năm 1.5+ — báo cáo chậm hoặc cần BI | **Thêm Postgres OLAP** (Phần A) |
| Năm 2+ — scale lớn, ACID requirement tăng | Sharding Mongo trước. Cân nhắc rewrite chỉ nếu có lý do business |
| Năm 3+ — quyết định strategic | Đánh giá rewrite (Phần B) — nhưng chỉ khi pass 5 câu hỏi |

→ **Mặc định**: stay Mongo, optimize. Add Postgres OLAP khi cần thật sự. Rewrite là last resort.

---
*Changelog: v0.2 — 2026-05-02 — bản đầu cho stack Mongo + plan tương lai.*
