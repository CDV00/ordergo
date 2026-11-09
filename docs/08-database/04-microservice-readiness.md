# 04 — Microservice Readiness

> **Phiên bản**: v0.2 (2026-05-02)
> Mục tiêu: thiết kế DB ngay từ MVP để khi cần tách microservice (hoặc rewrite stack — vd: NestJS → .NET), **không phải refactor lại schema**, chỉ phải tách deploy.

## Mục tiêu cụ thể

Đến năm 2 hoặc khi metric trigger đạt, **bất kỳ module nào cũng phải tách được thành service độc lập trong < 2 sprint** mà không cần migrate dữ liệu lớn hoặc thay schema.

## Trigger để tách module thành service

Tách module khi đồng thời:
- Module chiếm ≥ 30% traffic tổng
- Team owner ≥ 3 dev (cần deploy cadence riêng)
- Pattern scaling khác phần còn lại (vd: Reporting CPU-heavy, Payment latency-critical)
- Outbox + event consumer đã ổn định ≥ 3 tháng
- Chi phí tách < lợi ích đo được

Trước đó: ở chung monolith, vertical-scale đủ rồi.

---

## Pattern 1 — Module-owned Collections

### Quy tắc
**Một collection chỉ được write bởi 1 module.** Đọc thì có thể nhiều module đọc, nhưng write chỉ 1.

| Collection | Owner module | Reader modules |
| --- | --- | --- |
| `users`, `memberships`, `refresh_tokens` | Identity | Tất cả (auth check) |
| `tenants`, `venues` | Tenant | Tất cả (context) |
| `menu_items`, `menu_categories`, `recipes` | Catalog.FB | Order, Inventory, Reporting |
| `tables` | Table | Order |
| `orders`, `order_events` | Order | Payment, Inventory, Reporting, Loyalty, Notification |
| `payments`, `payment_sessions` | Payment | Reporting, E-Invoice |
| `e_invoices` | E-Invoice | Reporting |
| `customers`, `loyalty_*`, `vouchers` | Customer/Loyalty | Order, Marketing |
| `stock_items`, `stock_movements` | Inventory | Reporting |
| `bookings`, `rooms`, `room_*` | Hospitality | Order (room-service order) |
| `audit_logs` | (mọi module write — append-only) | Compliance |
| `webhook_*`, `api_keys` | Integration | (none) |

### Hệ quả
- Khi tách `Inventory` thành service riêng → mang `stock_items`, `stock_movements`, `purchase_orders`, `suppliers` đi cùng. Không phải module khác sẽ "stuck" vì không truy cập được — chúng vốn không được write.
- Đọc cross-module: qua **API call** hoặc **denormalized snapshot** (xem Pattern 3).

### Enforce ở code
```ts
// Sai — Order module write vào menu_items
class OrderService {
  async createOrder() {
    await menuItemModel.updateOne(...)  // ❌ FORBIDDEN
  }
}

// Đúng — Order chỉ đọc menu_items snapshot
class OrderService {
  async createOrder() {
    const menuItem = await catalogClient.getMenuItem(...)  // qua module API
    // hoặc đọc trực tiếp DB nhưng read-only
    order.lines.push({ productSnapshot: { name: menuItem.name, ... } })
  }
}
```

→ Code review checklist: PR phải qualify "module nào write collection nào".

---

## Pattern 2 — No Cross-module Foreign References ở DB level

### Quy tắc
- **Không** dùng Mongoose `ref` xuyên module
- **Không** dùng `$lookup` aggregation xuyên module trong production code
- Cross-module reference: **chỉ store UUID** (string)

### Ví dụ

❌ **Sai**:
```ts
const orderSchema = new Schema({
  menuItemId: { type: ObjectId, ref: 'MenuItem' },  // 'MenuItem' từ Catalog module
})

// Khi cần dùng:
const order = await Order.findById(id).populate('menuItemId')
```

→ Khi tách Catalog thành service, populate vỡ. Order phải refactor.

✅ **Đúng**:
```ts
const orderSchema = new Schema({
  menuItemId: { type: String },  // UUID, no ref
  productSnapshot: {              // 📸 snapshot khi tạo order
    name: String,
    price: { amount: Number, currency: String },
  }
})

// Lúc tạo order:
const menuItem = await catalogService.getMenuItem(menuItemId)  // service call
order.menuItemId = menuItem.id
order.productSnapshot = {
  name: menuItem.name,
  price: menuItem.basePrice,
}
```

→ Khi tách Catalog: chỉ thay `catalogService` từ in-process call thành HTTP/gRPC. Schema không đổi.

### Lợi ích
- Snapshot bảo vệ order khỏi data drift (giá menu đổi sau)
- Không phụ thuộc populate runtime
- Migration sang microservice dễ (snapshot đã có sẵn, không cần fetch lại)

---

## Pattern 3 — Snapshot Denormalization

### Khi nào snapshot
- Cross-module reference được **đọc thường xuyên** với đơn vị display (tên, giá, hình)
- Field có thể đổi nhưng order/booking cần giữ giá trị tại thời điểm tạo

### Khi nào KHÔNG snapshot (chỉ store ID)
- Giá trị thay đổi liên tục, không cần "frozen-in-time" (vd: `customerId` → đọc tên hiện tại, không lưu snapshot)
- Field nặng (description dài) chỉ hiển thị ở 1 chỗ

### Ví dụ snapshot fields

| Snapshot ở document | Field snapshot | Nguồn |
| --- | --- | --- |
| `orders.lines[]` | `productSnapshot.name`, `.imageUrl`, `.sku` | menu_items |
| `orders.customerSnapshot` | `name`, `phone` | customers |
| `bookings.customerSnapshot` | `name`, `phone`, `email`, `idType`, `idNumber` | customers |
| `payments.orderNumber` | order number | orders |
| `purchase_orders.items[].stockItemSnapshot` | name, sku, unit | stock_items |

### Sync snapshot khi nguồn đổi?
**Không, có chủ ý.** Snapshot là để giữ "frozen-in-time". Nếu đổi → tạo entity mới (vd: Order new) thay vì sync.

### Ngoại lệ — denormalized aggregate (cần sync)
- `customers.stats.totalSpent`, `orderCount` — cập nhật qua event subscriber
- `menu_items.stats.soldCount30d` — cập nhật qua event hằng ngày
- `tenants/venues.stats.tableCount` — cập nhật qua event create/delete

→ Đây là **read model**, không phải snapshot. Có thể rebuild từ events.

---

## Pattern 4 — Outbox Pattern (cross-module events)

### Vấn đề
Cần đảm bảo: khi update Order, event `OrderPaid` **chắc chắn** được Inventory consume (để trừ kho), Loyalty consume (cộng điểm), Reporting consume (update read model). Mạng có thể fail giữa chừng.

### Giải pháp
Lưu event vào collection `order_events` (hoặc generic `outbox`) **cùng transaction** với business write. Một worker đọc → publish lên broker.

```ts
// Trong Order module — đảm bảo atomic
const session = await connection.startSession();
session.startTransaction();
try {
  // 1. Update order
  await ordersCollection.updateOne(
    { _id: orderId },
    { $set: { status: "paid", paidAt: new Date() } },
    { session }
  );

  // 2. Insert outbox event (cùng transaction)
  await orderEventsCollection.insertOne({
    id: uuidV7(),
    tenantId,
    eventType: "order.paid",
    aggregateType: "Order",
    aggregateId: orderId,
    payload: { orderId, total, ... },
    occurredAt: new Date(),
    publishedAt: null,    // chưa publish
  }, { session });

  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
}
```

### Outbox publisher (worker)
```ts
// Chạy mỗi 1s — có thể nhiều instance, dùng change stream để xem nhau
async function publishLoop() {
  const events = await orderEventsCollection.find({
    publishedAt: null
  }).sort({ occurredAt: 1 }).limit(100).toArray();

  for (const event of events) {
    try {
      await broker.publish(event.eventType, event);
      await orderEventsCollection.updateOne(
        { _id: event._id },
        { $set: { publishedAt: new Date() } }
      );
    } catch (err) {
      await orderEventsCollection.updateOne(
        { _id: event._id },
        { $inc: { attempts: 1 }, $set: { lastError: err.message } }
      );
      // exponential backoff via lastError check
    }
  }
}
```

### Lựa chọn broker

| Stage | Broker | Lý do |
| --- | --- | --- |
| MVP | **In-process EventEmitter** + `outbox` collection | Đơn giản, đủ cho 1 instance |
| Năm 1 (multi-instance) | **Redis Streams** hoặc **Redis Pub/Sub + outbox** | Reuse Redis đã có |
| Năm 2 (microservice) | **NATS JetStream** hoặc **RabbitMQ** | Persistent, ack, redelivery |
| Năm 3 (event sourcing) | **Kafka** hoặc **Pulsar** | Replay, ordering, retention |

### Quy ước event
- Event type: `<aggregate>.<verb_past>` — `order.paid`, `payment.refunded`, `booking.checked_in`
- Payload schema versioning: `payload.schemaVersion`
- Backwards compatible: chỉ thêm field, không xoá. Major change = event type mới.
- TraceId propagation: `metadata.traceId` để cross-service tracing

---

## Pattern 5 — Repository Abstraction

### Mục tiêu
Code domain/application không gọi Mongoose trực tiếp. Khi cần swap engine (Mongo → Postgres, hoặc rewrite .NET), chỉ thay implementation.

### Cấu trúc layered

```
src/modules/order/
├── domain/                   # Pure TypeScript, no framework
│   ├── order.entity.ts        # business logic
│   ├── order-line.entity.ts
│   └── order.events.ts
├── application/               # Use cases, depend on interfaces
│   ├── ports/
│   │   ├── order.repository.ts       # interface
│   │   └── catalog-client.port.ts    # interface
│   ├── create-order.use-case.ts
│   └── pay-order.use-case.ts
├── infrastructure/            # Mongoose, NestJS, external APIs
│   ├── persistence/
│   │   ├── order.schema.ts            # Mongoose schema
│   │   └── order.mongo-repository.ts  # implements OrderRepository
│   ├── clients/
│   │   └── catalog-http.client.ts     # implements CatalogClientPort
│   └── order.module.ts
└── api/                       # NestJS controllers
    ├── order.controller.ts
    └── order.dtos.ts
```

### Ví dụ code

**Domain** — pure TypeScript:
```ts
// domain/order.entity.ts
export class Order {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private status: OrderStatus,
    private lines: OrderLine[],
  ) {}

  pay(amount: Money): OrderPaidEvent {
    if (this.status !== "served") throw new InvalidOrderStatusError();
    this.status = "paid";
    return new OrderPaidEvent(this.id, this.tenantId, amount);
  }
}
```

**Application port** — interface:
```ts
// application/ports/order.repository.ts
export interface OrderRepository {
  findById(tenantId: string, id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  findByTable(tenantId: string, tableId: string, status?: OrderStatus[]): Promise<Order[]>;
}
```

**Infrastructure** — Mongoose impl:
```ts
// infrastructure/persistence/order.mongo-repository.ts
@Injectable()
export class OrderMongoRepository implements OrderRepository {
  constructor(@InjectModel(OrderDoc.name) private readonly model: Model<OrderDoc>) {}

  async findById(tenantId: string, id: string): Promise<Order | null> {
    const doc = await this.model.findOne({ tenantId, id, deletedAt: null }).lean();
    return doc ? this.toDomain(doc) : null;
  }
  // ...
}
```

**Use case** — depend on interface:
```ts
// application/pay-order.use-case.ts
@Injectable()
export class PayOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(EVENT_BUS) private readonly bus: EventBus,
  ) {}

  async execute(cmd: PayOrderCommand) {
    const order = await this.orders.findById(cmd.tenantId, cmd.orderId);
    const event = order.pay(cmd.amount);
    await this.orders.save(order);
    await this.bus.publish(event);
  }
}
```

→ Khi rewrite sang .NET: schema giữ nguyên, port interface dịch sang `IOrderRepository` C#, swap impl. Domain logic copy sang C#. Migration là **port code**, không phải migrate data.

---

## Pattern 6 — Tenant Context Propagation

### Vấn đề
Mọi query phải filter `tenantId`. Không trust developer nhớ. Phải enforce.

### Implementation

**Layer 1 — Middleware extract tenantId từ JWT**:
```ts
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const jwt = decodeJwt(req.headers.authorization);
    const ctx: TenantContext = {
      tenantId: jwt.tenantId,
      userId: jwt.sub,
      venueId: jwt.venueId ?? null,
    };
    asyncLocalStorage.run(ctx, () => next());
  }
}
```

**Layer 2 — Repository auto-filter**:
```ts
// infrastructure/base.mongo-repository.ts
export abstract class BaseMongoRepository<TDoc, TDomain> {
  constructor(
    protected readonly model: Model<TDoc>,
    protected readonly tenantContext: TenantContextProvider,
  ) {}

  protected get tenantFilter() {
    const tenantId = this.tenantContext.current()?.tenantId;
    if (!tenantId) throw new MissingTenantContextError();
    return { tenantId };
  }

  // mọi query merge tenantFilter
  async findOne(filter: object): Promise<TDoc | null> {
    return this.model.findOne({ ...this.tenantFilter, ...filter, deletedAt: null }).lean();
  }
}
```

**Layer 3 — Lint rule custom** (eslint-plugin-tenant-isolation, build sau):
- Detect raw `model.find(...)` không có `tenantId` → CI fail.

**Layer 4 — Test integration**:
- Mọi module có test "tenant A không đọc được data tenant B".

### Khi tách microservice
Tenant context giữ qua HTTP header `X-Tenant-Id` (signed) hoặc forward JWT — tuỳ design auth. Pattern không đổi.

---

## Pattern 7 — Database per service (Năm 2+)

### Khi tách
Khi 1 module trở thành service riêng, có 2 lựa chọn DB:

#### Option A — Cùng cluster, schema-isolated
- Mỗi service có `database` riêng trong cùng MongoDB cluster
- Vd: `ordergo_order`, `ordergo_inventory`, `ordergo_payment`
- Service chỉ kết nối DB của mình
- Giảm lý do confusion về collection ownership
- Rẻ, ops đơn giản

#### Option B — Cluster riêng (true microservice)
- Mỗi service có cluster Mongo riêng
- Cao isolation, scale độc lập
- Cost cao hơn, phức tạp ops

→ **Khuyến nghị**: bắt đầu Option A khi tách service đầu tiên. Switch Option B khi 1 service cần > 1TB hoặc throughput riêng quá cao.

### Migration data từ shared DB → per-service DB

```
Shared cluster `ordergo`
├── orders            ┐
├── order_events      ├─ tách sang `ordergo_order`
└── ...

Bước:
1. Setup `ordergo_order` cluster
2. mongodump shared → mongorestore vào order cluster
3. Dual-write 1 tuần (verify consistency)
4. Switch read sang order cluster
5. Tắt write vào shared
6. Drop collections từ shared
```

---

## Pattern 8 — API Gateway giữa client và service

Khi đã có nhiều service:
- Client (web, mobile) gọi 1 URL `api.ordergo.vn`
- Gateway route theo path: `/orders/*` → Order service, `/payments/*` → Payment
- Gateway xử lý auth, rate limit, tenant context inject

Tools: Kong, Tyk, hoặc tự build NestJS gateway.

---

## Pattern 9 — Saga / Compensation cho cross-service workflow

### Vấn đề
Workflow xuyên service không có ACID. VD: create order + reserve inventory + charge payment + send notification.

### Giải pháp — Saga
Chia thành các step, mỗi step có **compensation** (undo):

```
Step 1: Create order            | compensate: cancel order
Step 2: Reserve inventory       | compensate: release inventory
Step 3: Charge payment          | compensate: refund payment
Step 4: Send notification       | compensate: send cancellation notif
```

### Pattern implement
- **Choreography**: mỗi service subscribe event, react. Đơn giản, phân tán.
- **Orchestration**: 1 service trung tâm điều phối. Rõ ràng, dễ trace.

→ MVP chưa cần. Khi tách 3+ service: dùng **Choreography** với event bus.

---

## Pattern 10 — Schema Evolution & Versioning

### Field addition (backwards-compatible)
- Thêm field optional → mọi version tương thích
- Code đọc cũ ignore field mới

### Field removal
- Step 1: stop write
- Step 2: deploy code không đọc field
- Step 3: migration drop field (cleanup)

### Field rename
- Step 1: write cả 2 tên đồng thời
- Step 2: backfill data từ tên cũ → tên mới
- Step 3: stop write tên cũ
- Step 4: stop read tên cũ
- Step 5: drop tên cũ

### Schema version field
```ts
{ schemaVersion: 2, ... }
```
- Code đọc dispatch theo `schemaVersion`
- Migration job upgrade documents version cũ
- Khi 100% v2 → bỏ logic đọc v1

→ **Không bao giờ "in-place rename + cross-fingers"**. Mỗi schema change qua sequence rõ.

---

## Pattern 11 — CQRS lite (Read Model riêng)

### Khi nào áp dụng
- Báo cáo phức tạp + chậm khi query trực tiếp transactional collection
- Cohort analysis, BI

### Implementation MVP
- Materialized view dạng collection (`daily_sales_summaries`, `customer_lifetime_values`)
- Update qua event subscriber
- Cron job rebuild định kỳ (đảm bảo consistency)

### Năm 2+ — Tách full CQRS
- Read model sang DB khác (Postgres OLAP, ClickHouse cho analytics)
- Stream event qua CDC

---

## Pattern 12 — Migration data path (cuối)

### Tách 1 module thành service — checklist

- [ ] Module đã có Repository abstraction
- [ ] Module đã không cross-write collection của module khác
- [ ] Cross-module communication đã đi qua event bus
- [ ] Snapshot pattern đã áp dụng cho cross-ref
- [ ] Outbox pattern đã ổn định
- [ ] Module đã có test integration đủ
- [ ] Schema collection thuộc module identified
- [ ] DB connection config tách được
- [ ] CI/CD đã pipeline-ready cho service riêng
- [ ] Service contract (HTTP API hoặc gRPC) định nghĩa rõ
- [ ] Telemetry + tracing cross-service ready

→ Nếu tất cả ✓ → tách service trong 2 sprint.

---

## Tổng kết — 12 patterns đã liệt kê

| # | Pattern | Mục đích |
| --- | --- | --- |
| 1 | Module-owned collections | 1 collection 1 owner write |
| 2 | No cross-module FK | Schema decoupling |
| 3 | Snapshot denormalization | Frozen-in-time + decouple |
| 4 | Outbox | Cross-module event reliable |
| 5 | Repository abstraction | Swap engine cost thấp |
| 6 | Tenant context propagation | Multi-tenant safe |
| 7 | DB per service | Khi scale lớn |
| 8 | API Gateway | Single entry cho client |
| 9 | Saga / Compensation | Cross-service workflow |
| 10 | Schema versioning | Evolution không downtime |
| 11 | CQRS lite | Read model độc lập |
| 12 | Migration checklist | Tách service smooth |

Từ ngày 1 áp dụng: **#1, #2, #3, #4, #5, #6, #10**.
Khi cần tách: **#7, #8, #9, #11, #12**.

---
*Changelog: v0.2 — 2026-05-02 — bản đầu cho stack Mongo + NestJS modular monolith.*
