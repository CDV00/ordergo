# 02 — MongoDB Schema (per module)

> **Phiên bản**: v0.2 (2026-05-01)
> Schema chi tiết từng collection. Mỗi module sở hữu các collection ở phần tương ứng. Không tham chiếu chéo module ở DB level.

## Quy ước đọc

- **Field bắt buộc** đánh dấu `*`
- **Cross-module reference** đánh dấu 🔗 — chỉ là UUID, không có Mongoose ref
- **In-module reference** đánh dấu ↪ — có thể populate
- **Embedded subdocument** đánh dấu 📦
- **Snapshot pattern** đánh dấu 📸 — copy từ module khác lúc tạo, không sync
- Mọi document có 5 field "audit cơ bản" (xem mục 0)

---

## 0. Audit fields chuẩn (mọi document)

```ts
{
  _id: ObjectId,                    // *  Mongo native ID
  id: string,                       // *  UUID v7, public-safe ID, unique index
  tenantId: string,                 // *  UUID v7 — except User & Tenant itself
  schemaVersion: number,            // *  vd: 1
  createdAt: Date,                  // *  ISODate UTC
  updatedAt: Date,                  // *  ISODate UTC
  createdBy: string | null,         //    UUID user_id
  updatedBy: string | null,         //    UUID user_id
  deletedAt: Date | null,           //    soft delete
}
```

→ Trong các schema dưới, **không lặp lại** 5 field này. Mặc định có.

---

# Module: IDENTITY

## `users` (toàn cục — không có `tenantId`)

```ts
{
  // audit fields (no tenantId)
  id: string,                      // * UUID v7
  phone: string,                   // * unique, format E.164: "+84901234567"
  email: string | null,            //   unique sparse
  passwordHash: string,            // * Argon2id
  displayName: string,
  avatarUrl: string | null,
  status: "active" | "suspended" | "deleted",
  emailVerifiedAt: Date | null,
  phoneVerifiedAt: Date | null,
  twoFactorEnabled: boolean,
  twoFactorSecret: string | null,  //   encrypted
  lastLoginAt: Date | null,
  preferredLanguage: "vi" | "en",
}
```

**Indexes**: `{phone: 1} unique`, `{email: 1} unique sparse`, `{id: 1} unique`

## `memberships` (User × Tenant × Venue × Role)

```ts
{
  id, tenantId, ...auditFields,

  userId: string,                  // * 🔗 UUID user
  venueId: string | null,          //   null = scope toàn tenant
  roleCode: "owner" | "tenant_admin" | "venue_manager"
                | "cashier" | "server" | "kitchen"
                | "receptionist" | "housekeeping"
                | "accountant" | "custom_*",
  permissions: string[],           //   merged effective, vd ["order.create", "report.view"]
  invitedBy: string | null,        //   userId người mời
  invitedAt: Date,
  acceptedAt: Date | null,
  status: "pending" | "active" | "revoked",
}
```

**Indexes**: `{tenantId: 1, userId: 1, venueId: 1} unique`, `{userId: 1, status: 1}`

## `refresh_tokens` (auth)

```ts
{
  id, tenantId: null, ...auditFields,
  userId: string,                  // *
  tokenHash: string,               // * sha256, không lưu plain
  deviceInfo: { ua: string, ip: string, deviceId: string },
  expiresAt: Date,                 // * TTL index
  revokedAt: Date | null,
}
```

**Indexes**: `{userId: 1, revokedAt: 1}`, `{expiresAt: 1} TTL`

---

# Module: TENANT

## `tenants`

```ts
{
  id, schemaVersion, createdAt, updatedAt, deletedAt,

  name: string,                    // * "Cafe ABC"
  legalName: string | null,        //   tên trên giấy phép
  taxCode: string | null,          //   MST 10–13 chữ số
  ownerUserId: string,             // * 🔗 user
  plan: {                          // * 📦
    code: "free" | "starter" | "pro" | "business" | "enterprise",
    enabledModules: string[],      // ["catalog", "order", "payment", "loyalty", ...]
    seatLimit: number,
    venueLimit: number,
    trialEndsAt: Date | null,
  },
  status: "active" | "suspended" | "cancelled",
  billingInfo: {                   // 📦
    billingEmail: string,
    bankAccount: string | null,
    address: string | null,
  },
  preferences: {                   // 📦
    defaultCurrency: "VND",
    defaultTimezone: "Asia/Ho_Chi_Minh",
    fiscalYearStart: "01-01",
  },
}
```

**Indexes**: `{id: 1} unique`, `{ownerUserId: 1}`, `{status: 1}`, `{taxCode: 1} sparse`

## `venues`

```ts
{
  id, tenantId, ...auditFields,

  name: string,                    // *
  code: string,                    //   short code "Q1-CF1"
  businessType: "restaurant" | "cafe" | "bar"
              | "hotel" | "homestay"
              | "spa" | "gym" | "education" | "coworking",
  address: {                       // 📦
    line1: string,
    ward: string,
    district: string,
    city: string,
    province: string,
    country: "VN",
    geoPoint: { type: "Point", coordinates: [lng, lat] }, // 2dsphere
  },
  contact: {                       // 📦
    phone: string,
    email: string | null,
  },
  timezone: string,                // "Asia/Ho_Chi_Minh"
  currency: string,                // "VND"
  status: "active" | "inactive" | "archived",
  settings: {                      // 📦  cấu hình per venue
    serviceChargeRate: number,     //   0.1 = 10%
    vatRate: number,               //   0.08
    autoEinvoice: boolean,
    einvoiceProvider: "vnpt" | "viettel" | "misa" | null,
    printerConfig: {
      type: "bluetooth" | "lan" | "usb",
      address: string,
      paperWidth: 80 | 58,
    } | null,
    operatingHours: {
      [day: "mon"|"tue"|...]: { open: "08:00", close: "23:00" } | null,
    },
  },
  // số lượng resources, cập nhật bởi event
  stats: {                         // 📦  denormalized counters
    tableCount: number,
    roomCount: number,             // hotel
    staffCount: number,
  },
}
```

**Indexes**: `{tenantId: 1, code: 1} unique`, `{tenantId: 1, status: 1}`, `{address.geoPoint: "2dsphere"}`

---

# Module: CATALOG (F&B)

> **Tên module ở DB**: prefix `menu_*` để rõ là F&B catalog. Tránh conflict với `room_*` ở Hotel module.

## `menu_categories`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,                 // *  category thuộc 1 venue, hoặc tenant-level (venueId: null) cho menu chuỗi
  name: string,                    // * "Cà phê", "Trà sữa"
  description: string | null,
  imageUrl: string | null,
  displayOrder: number,
  isActive: boolean,
  parentCategoryId: string | null, //   nested category (optional)
}
```

**Indexes**: `{tenantId: 1, venueId: 1, displayOrder: 1}`, `{tenantId: 1, isActive: 1}`

## `menu_items`

> Embed variant + topping group nếu nhỏ. Nếu danh sách lớn, tách collection.

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,                 // * (hoặc null cho menu chuỗi)
  categoryId: string,              // * ↪ menu_categories
  name: string,                    // * "Cà phê đen đá"
  description: string | null,
  sku: string | null,
  basePrice: { amount: number, currency: "VND" }, // * Money object
  imageUrl: string | null,
  imageThumbUrl: string | null,
  displayOrder: number,

  // Embed variants nhỏ
  variants: [                      // 📦 max ~20
    {
      id: string,                  //   UUID v7
      name: string,                //   "Size L"
      priceModifier: { amount: number, currency: "VND" }, // +10000
      isDefault: boolean,
    }
  ],
  // Embed topping groups
  toppingGroups: [                 // 📦
    {
      id: string,
      name: string,                // "Topping"
      minSelect: number,
      maxSelect: number,
      options: [
        {
          id: string,
          name: string,            // "Trân châu"
          priceModifier: { amount, currency },
          isAvailable: boolean,
        }
      ]
    }
  ],

  isAvailable: boolean,            // toggle hết món
  unavailableReason: string | null,
  availabilityWindows: [           // 📦  giờ phục vụ (happy hour, breakfast)
    { from: "08:00", to: "11:00", weekdays: [1,2,3,4,5] }
  ] | null,

  // Inventory link (optional, nếu có module Inventory)
  recipeId: string | null,         // 🔗 → recipes (cross sub-context, có thể populate)

  // Tags để search/filter
  tags: string[],                  // ["cà phê", "đá", "không cồn"]

  // Stats denormalized
  stats: {                         // 📦
    soldCount30d: number,
    revenue30d: number,
  },
}
```

**Indexes**: `{tenantId: 1, venueId: 1, categoryId: 1, displayOrder: 1}`, `{tenantId: 1, sku: 1} sparse`, `{tenantId: 1, name: "text"}` (full-text search)

## `recipes` (định mức nguyên liệu — Inventory link)

```ts
{
  id, tenantId, ...auditFields,
  menuItemId: string,              // * 🔗
  variantId: string | null,        //   recipe khác nhau theo variant
  ingredients: [                   // * 📦
    {
      stockItemId: string,         // 🔗 stock_items
      stockItemName: string,       // 📸 snapshot tên
      quantity: number,            // 100
      unit: string,                // "g", "ml", "pcs"
    }
  ],
  yield: number,                   // 1 (làm 1 cốc) — cho central kitchen
}
```

**Indexes**: `{tenantId: 1, menuItemId: 1, variantId: 1}`

---

# Module: TABLE (F&B)

## `tables`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,                 // *
  section: string,                 // "Sảnh", "Sân thượng", "Lầu 2"
  name: string,                    // * "Bàn 5"
  capacity: number,                // 4
  position: { x: number, y: number } | null,  // sơ đồ drag-drop
  status: "available" | "occupied" | "reserved" | "cleaning" | "out_of_order",
  currentOrderId: string | null,   //   ↪ order đang phục vụ
  occupiedSince: Date | null,
}
```

**Indexes**: `{tenantId: 1, venueId: 1, section: 1, name: 1} unique`, `{tenantId: 1, venueId: 1, status: 1}`

---

# Module: ORDER (cốt lõi — cross-vertical)

## `orders`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,                 // *
  orderNumber: string,             // * "ORD-20260501-0001" — human-readable
  orderType: "dine_in" | "takeaway" | "delivery" | "online"
           | "room_service" | "booking_charge" | "service",
  businessContext: "fnb" | "hotel" | "spa" | "gym" | "edu", // * — quyết định module nào "own" order

  // Cross-module references (UUID + snapshot)
  customerId: string | null,       // 🔗 customers
  customerSnapshot: {              // 📸
    name: string,
    phone: string,
  } | null,

  tableId: string | null,          //   ↪ F&B
  tableName: string | null,        // 📸

  roomId: string | null,           //   ↪ Hotel
  roomName: string | null,         // 📸

  bookingId: string | null,        //   🔗 bookings (Hotel)

  // Lines — embedded vì luôn đọc cùng order
  lines: [                         // * 📦  max ~200 (tách collection nếu vượt)
    {
      id: string,                  //   UUID v7 line ID
      productType: "menu_item" | "room_night" | "service_package" | "fee" | "discount",
      productId: string,           // 🔗
      productSnapshot: {           // 📸 quan trọng — giá có thể đổi sau
        name: string,
        sku: string | null,
        imageUrl: string | null,
      },
      variantId: string | null,
      variantSnapshot: { name: string, priceModifier: Money } | null,
      modifiers: [                 //   topping selected
        {
          groupId: string,
          groupName: string,       // 📸
          optionId: string,
          optionName: string,      // 📸
          priceModifier: Money,
        }
      ],
      quantity: number,            // *
      unitPrice: Money,            // * snapshot tại thời điểm tạo
      lineSubtotal: Money,         // * unitPrice × quantity + modifiers
      discount: Money,
      lineTotal: Money,
      note: string | null,
      kitchenStatus: "queued" | "preparing" | "ready" | "served" | "cancelled",
      kitchenStation: string | null,  // "hot", "cold", "bar"
      sentToKitchenAt: Date | null,
      readyAt: Date | null,
      servedAt: Date | null,
    }
  ],

  // Tổng tiền
  pricing: {                       // * 📦
    subtotal: Money,
    discount: Money,
    serviceCharge: Money,
    tax: Money,
    rounding: Money,
    total: Money,
  },

  appliedDiscounts: [              // 📦
    {
      type: "voucher" | "manual" | "loyalty" | "campaign",
      code: string | null,
      name: string,
      amount: Money,
      reason: string | null,
      authorizedBy: string | null, // userId manager approve
    }
  ],

  // Trạng thái
  status: "draft" | "sent" | "in_progress" | "ready" | "served" | "paid" | "refunded" | "cancelled",
  cancelReason: string | null,

  // Timestamps lifecycle
  sentAt: Date | null,             //   gửi xuống bếp/operations
  paidAt: Date | null,
  cancelledAt: Date | null,

  // Source
  source: "pos" | "qr_menu" | "online" | "third_party" | "phone",
  sourceRef: string | null,        //   external id (Grab, ShopeeFood)

  // Idempotency (giữ 24h)
  clientId: string | null,         //   client-generated UUID, unique check
}
```

**Indexes**:
- `{tenantId: 1, venueId: 1, status: 1, createdAt: -1}` — list orders
- `{tenantId: 1, venueId: 1, orderNumber: 1} unique` — tra cứu
- `{tenantId: 1, customerId: 1, createdAt: -1}` — lịch sử khách
- `{tenantId: 1, tableId: 1, status: 1}` sparse — bàn đang phục vụ
- `{tenantId: 1, bookingId: 1}` sparse — order của booking
- `{tenantId: 1, clientId: 1}` sparse unique — idempotency
- `{tenantId: 1, paidAt: -1}` sparse — báo cáo doanh thu

> **Vì sao embed lines?** Order luôn được đọc cùng lines (POS, KDS, in bill). Tách collection → 2 query, slower. Nếu lines > 200 (rất hiếm), tách `order_lines`.

> **Vì sao snapshot menu item?** Giá menu đổi → order cũ giữ giá đúng tại thời điểm. Không phụ thuộc populate.

## `order_events` (outbox — sự kiện publish cross-module)

```ts
{
  _id: ObjectId,
  id: string,                      // UUID v7
  tenantId: string,
  eventType: "order.created" | "order.line_added" | "order.sent_to_kitchen"
           | "order.line_ready" | "order.served" | "order.paid" | "order.cancelled",
  aggregateType: "Order",
  aggregateId: string,             // orderId
  payload: any,                    //   event body
  metadata: { userId: string, traceId: string },
  occurredAt: Date,                // * khi event xảy ra
  publishedAt: Date | null,        //   khi outbox publisher đẩy
  attempts: number,                //   retry count
  lastError: string | null,
}
```

**Indexes**: `{publishedAt: 1, occurredAt: 1}` (cho publisher poll), `{tenantId: 1, aggregateId: 1}`, `{occurredAt: 1} TTL 30 ngày sau publish`

---

# Module: PAYMENT

## `payments`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,                 // *
  orderId: string,                 // * 🔗 order
  orderNumber: string,             // 📸

  method: "cash" | "vietqr" | "momo" | "vnpay" | "zalopay" | "card" | "bank_transfer",
  amount: Money,                   // *
  receivedAt: Date,                // *
  receivedBy: string,              // * userId
  shiftId: string | null,          //   ↪ shift (cash management)

  // External
  externalRef: string | null,      //   transaction id từ cổng (Momo, VNPay)
  externalRawResponse: any,        //   raw response để debug (encrypted nếu chứa PII)

  // Status
  status: "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded",
  failureReason: string | null,

  // Refund
  refundedAmount: Money,
  refunds: [                       // 📦
    {
      id: string,
      amount: Money,
      reason: string,
      refundedAt: Date,
      refundedBy: string,
      externalRef: string | null,
    }
  ],

  // E-invoice link
  einvoiceId: string | null,       // 🔗 e_invoices
}
```

**Indexes**: `{tenantId: 1, orderId: 1}`, `{tenantId: 1, venueId: 1, receivedAt: -1}`, `{tenantId: 1, externalRef: 1} sparse`, `{tenantId: 1, shiftId: 1} sparse`

## `payment_sessions` (cho QR async)

```ts
{
  id, tenantId, ...auditFields,
  orderId: string,                 // *
  method: "vietqr" | "momo" | "vnpay" | "zalopay",
  amount: Money,
  qrCode: string,                  //   payload QR
  expiresAt: Date,                 // *
  status: "pending" | "completed" | "expired" | "cancelled",
  paymentId: string | null,        //   sau khi succeeded
  webhookReceivedAt: Date | null,
  externalSessionId: string,
}
```

**Indexes**: `{tenantId: 1, orderId: 1, status: 1}`, `{externalSessionId: 1}`, `{expiresAt: 1} TTL`

---

# Module: E-INVOICE (HĐĐT)

## `e_invoices`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,                 // *
  orderId: string,                 // *
  orderNumber: string,             // 📸

  provider: "vnpt" | "viettel" | "misa",
  providerInvoiceNo: string,       //   số HĐĐT cấp bởi provider
  lookupCode: string,              //   mã tra cứu khách
  invoiceDate: Date,
  buyer: {                         // * 📦
    name: string,
    taxCode: string | null,
    address: string | null,
    email: string | null,
    phone: string | null,
  },
  seller: {                        // * 📦
    name: string,
    taxCode: string,
    address: string,
  },
  items: [                         // * 📦
    {
      name: string,
      quantity: number,
      unit: string,
      unitPrice: Money,
      vatRate: number,             //   0.08, 0.1, 0
      vatAmount: Money,
      lineTotal: Money,
    }
  ],
  totals: {                        // * 📦
    subtotal: Money,
    vatTotal: Money,
    total: Money,
    totalInWords: string,
  },
  status: "draft" | "submitted" | "approved" | "rejected" | "cancelled" | "adjusted",
  submittedAt: Date | null,
  approvedAt: Date | null,
  rawXml: string | null,           //   XML gửi cơ quan thuế
  pdfUrl: string | null,           //   S3 link
}
```

**Indexes**: `{tenantId: 1, orderId: 1}`, `{tenantId: 1, lookupCode: 1} unique`, `{tenantId: 1, providerInvoiceNo: 1, provider: 1} unique`, `{tenantId: 1, invoiceDate: -1}`

---

# Module: CUSTOMER

## `customers`

```ts
{
  id, tenantId, ...auditFields,
  phone: string,                   // *  primary identifier
  email: string | null,
  name: string,
  birthday: Date | null,
  gender: "male" | "female" | "other" | null,
  address: { ...VietnamAddress } | null,

  // Stats — denormalized, update via events
  stats: {                         // 📦
    totalSpent: { amount: number, currency: "VND" },
    orderCount: number,
    averageOrderValue: { amount, currency },
    firstOrderAt: Date | null,
    lastOrderAt: Date | null,
    lastVisitVenueId: string | null,
  },

  // Tags & segments
  tags: string[],                  //   ["vip", "regular", "birthday-month"]
  segmentIds: string[],            //   computed by Marketing module

  // Loyalty
  loyaltyCardId: string | null,    // ↪ loyalty_cards (cùng tenant context)

  // Source
  source: "pos" | "qr_menu" | "manual" | "import" | "online",

  // Privacy (PDPL)
  marketingConsent: boolean,
  marketingConsentAt: Date | null,
  dataErasureRequestedAt: Date | null,
}
```

**Indexes**: `{tenantId: 1, phone: 1} unique`, `{tenantId: 1, email: 1} sparse`, `{tenantId: 1, name: "text"}`, `{tenantId: 1, "stats.lastOrderAt": -1}`

## `loyalty_cards`

```ts
{
  id, tenantId, ...auditFields,
  customerId: string,              // *
  cardNumber: string,              //   "OG-2026-00001"
  tier: "bronze" | "silver" | "gold" | "platinum",
  points: number,                  //   current balance
  pointsLifetime: number,          //   tổng đã từng tích
  issuedAt: Date,
  expiresAt: Date | null,
}
```

**Indexes**: `{tenantId: 1, customerId: 1} unique`, `{tenantId: 1, cardNumber: 1} unique`

## `loyalty_transactions` (immutable ledger)

```ts
{
  id, tenantId, ...auditFields,    // không có updatedBy/deletedAt — append-only
  cardId: string,
  customerId: string,
  type: "earn" | "redeem" | "adjust" | "expire",
  points: number,                  //   +/-
  reason: string,                  //   "order ORD-..."
  referenceType: "order" | "manual" | "system",
  referenceId: string | null,
  balanceAfter: number,
}
```

**Indexes**: `{tenantId: 1, cardId: 1, createdAt: -1}`, `{tenantId: 1, referenceId: 1}`

## `vouchers`

```ts
{
  id, tenantId, ...auditFields,
  code: string,                    // * "SUMMER2026"
  type: "percentage" | "fixed_amount" | "free_item",
  value: number,                   //   10 (%) hoặc 50000 (VND)
  conditions: {                    // 📦
    minOrderAmount: Money | null,
    appliesTo: "order" | "category" | "item",
    targetIds: string[],           //   category/item id
    customerSegmentIds: string[],
    venueIds: string[] | null,     //   null = all venue
  },
  validity: {                      // 📦
    startsAt: Date,
    endsAt: Date,
    usageLimit: number | null,
    usagePerCustomer: number | null,
  },
  redemptionCount: number,         //   updated by event
  status: "active" | "paused" | "expired" | "exhausted",
  campaignId: string | null,       // ↪ campaigns
}
```

**Indexes**: `{tenantId: 1, code: 1} unique`, `{tenantId: 1, status: 1, "validity.endsAt": 1}`

---

# Module: INVENTORY

## `stock_items`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string | null,          //   null = chuỗi central, hoặc per venue
  name: string,                    // * "Hạt cà phê Robusta"
  sku: string,
  unit: string,                    // * "kg", "g", "ml", "pcs"
  category: string | null,         //   "nguyên liệu thô", "đóng gói", "vật tư"

  // Stock per venue (denormalized)
  stockLevel: number,              //   số lượng hiện tại
  reservedLevel: number,           //   đã được reserve cho order pending
  alertThreshold: number,          //   cảnh báo dưới ngưỡng

  // Pricing & supplier (latest, snapshot ở stock_movements giữ giá thật)
  averageCost: Money,
  lastPurchasePrice: Money,
  defaultSupplierId: string | null,

  // Location
  location: string | null,         //   "Kho A1"
}
```

**Indexes**: `{tenantId: 1, venueId: 1, sku: 1} unique`, `{tenantId: 1, venueId: 1, name: "text"}`

## `stock_movements` (immutable ledger)

```ts
{
  id, tenantId, ...auditFields,    // append-only
  venueId: string,
  stockItemId: string,
  type: "purchase" | "consumption" | "transfer_in" | "transfer_out"
      | "wastage" | "adjustment" | "return",
  quantity: number,                //   ± so với stock
  unitCost: Money | null,
  totalCost: Money | null,
  // References
  referenceType: "purchase_order" | "order" | "transfer" | "manual" | null,
  referenceId: string | null,
  // Stock level snapshot
  stockBefore: number,
  stockAfter: number,
  reason: string | null,
}
```

**Indexes**: `{tenantId: 1, stockItemId: 1, createdAt: -1}`, `{tenantId: 1, venueId: 1, createdAt: -1}`, `{referenceId: 1}`

## `suppliers`

```ts
{
  id, tenantId, ...auditFields,
  name: string,                    // *
  taxCode: string | null,
  contact: { phone: string, email: string | null, address: string | null },
  paymentTerms: string | null,     //   "Net 30"
  isActive: boolean,
}
```

## `purchase_orders`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,
  poNumber: string,                // "PO-20260501-001"
  supplierId: string,
  supplierSnapshot: { name, taxCode },  // 📸
  items: [                         // 📦
    {
      stockItemId: string,
      stockItemSnapshot: { name, sku, unit },  // 📸
      quantity: number,
      unitCost: Money,
      lineTotal: Money,
    }
  ],
  totals: { subtotal: Money, vat: Money, total: Money },
  status: "draft" | "ordered" | "partial_received" | "received" | "cancelled",
  orderedAt: Date | null,
  receivedAt: Date | null,
}
```

---

# Module: SHIFT

## `shifts`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,
  shiftNumber: string,             //   "SHIFT-20260501-MORNING"
  cashierId: string,               //   userId mở ca
  cashierName: string,             // 📸
  openedAt: Date,
  closedAt: Date | null,
  status: "open" | "closed" | "approved",

  cash: {
    openingAmount: Money,          //   tiền mặt đầu ca
    expectedClosingAmount: Money,  //   tính từ cash payments
    actualClosingAmount: Money | null,
    variance: Money,               //   actual - expected
    varianceReason: string | null,
  },

  summary: {                       //   denormalized snapshot khi đóng ca
    orderCount: number,
    revenueByMethod: {
      cash: Money, vietqr: Money, momo: Money, vnpay: Money, ...
    },
    totalRevenue: Money,
    discountTotal: Money,
    refundTotal: Money,
  } | null,

  approvedBy: string | null,       //   manager
  approvedAt: Date | null,
}
```

**Indexes**: `{tenantId: 1, venueId: 1, status: 1, openedAt: -1}`, `{tenantId: 1, cashierId: 1, openedAt: -1}`

---

# Module: HOSPITALITY (năm 2)

## `room_types`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,
  name: string,                    // * "Deluxe Double"
  code: string,                    //   "DD"
  capacity: { adults: number, children: number },
  amenities: string[],             //   ["wifi", "ac", "tv", "minibar"]
  basePrice: Money,                //   per night
  imageUrls: string[],
  description: string,
}
```

## `rooms`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,
  roomTypeId: string,              // ↪
  number: string,                  // * "301"
  floor: number | null,
  status: "available" | "occupied" | "cleaning" | "maintenance" | "out_of_order",
  housekeepingStatus: "clean" | "dirty" | "in_progress" | "inspected",
  currentBookingId: string | null, // ↪
  features: string[],
}
```

**Indexes**: `{tenantId: 1, venueId: 1, number: 1} unique`, `{tenantId: 1, venueId: 1, status: 1}`

## `rate_plans`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,
  name: string,                    //   "Cuối tuần", "Lễ"
  roomTypeIds: string[],
  pricing: [                       // 📦
    {
      dayOfWeek: number[] | null,  //   [6,0] = thứ 7, CN
      dateRange: { from: Date, to: Date } | null,
      price: Money,
    }
  ],
  source: "direct" | "ota_booking" | "ota_agoda" | "ota_traveloka",
  isActive: boolean,
}
```

## `bookings`

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,
  bookingNumber: string,           // "BK-20260501-001"
  customerId: string | null,
  customerSnapshot: { name, phone, email, idType, idNumber },  // 📸
  roomId: string | null,           //   nullable trước check-in
  roomTypeId: string,
  roomCount: number,
  guests: { adults: number, children: number },

  checkInDate: Date,               // * date only
  checkOutDate: Date,               // * date only
  nights: number,                  //   computed
  actualCheckInAt: Date | null,
  actualCheckOutAt: Date | null,

  ratePlanId: string,              // ↪
  pricing: {                       // 📦
    nightlyRates: [{ date: Date, amount: Money }],
    subtotal: Money,
    discount: Money,
    tax: Money,
    total: Money,
  },

  deposit: Money,
  paidAmount: Money,

  status: "pending" | "confirmed" | "checked_in" | "checked_out"
        | "cancelled" | "no_show",
  source: "direct" | "walk_in" | "ota_booking" | "ota_agoda" | "ota_traveloka" | "phone",
  externalRef: string | null,      //   OTA confirmation code

  notes: string | null,
  specialRequests: string[],
}
```

**Indexes**: `{tenantId: 1, venueId: 1, checkInDate: 1, status: 1}`, `{tenantId: 1, venueId: 1, bookingNumber: 1} unique`, `{tenantId: 1, customerId: 1, createdAt: -1}`, `{externalRef: 1} sparse`, `{tenantId: 1, roomId: 1, status: 1}`

## `room_inventory` (availability calendar)

```ts
{
  id, tenantId, ...auditFields,
  venueId: string,
  roomTypeId: string,              //   inventory theo roomType
  date: Date,                      // * date only — 1 doc per type per day
  totalRooms: number,
  bookedRooms: number,
  availableRooms: number,
  rateOverride: Money | null,      //   force giá khác base
  isStopSale: boolean,             //   block bán
}
```

**Indexes**: `{tenantId: 1, venueId: 1, roomTypeId: 1, date: 1} unique`

> Đây là collection được ghi nhiều khi tích hợp Channel Manager — partition theo tenantId + month nếu cần.

---

# Module: NOTIFICATION

## `notification_templates`

```ts
{
  id, tenantId, ...auditFields,
  code: string,                    // "order_paid", "booking_confirmed"
  channel: "push" | "email" | "sms" | "zalo_oa" | "in_app",
  language: "vi" | "en",
  subject: string | null,
  body: string,                    //   với placeholder {{order.number}}
  isActive: boolean,
}
```

## `notifications`

```ts
{
  id, tenantId, ...auditFields,
  recipientType: "user" | "customer" | "phone" | "email",
  recipientId: string | null,
  recipientAddress: string,        //   phone, email, deviceToken
  channel: "push" | "email" | "sms" | "zalo_oa" | "in_app",
  templateCode: string | null,
  subject: string | null,
  body: string,
  data: any,                       //   payload structured

  status: "queued" | "sending" | "sent" | "delivered" | "failed",
  attemptCount: number,
  sentAt: Date | null,
  failureReason: string | null,
  externalRef: string | null,      //   provider message id
}
```

**Indexes**: `{tenantId: 1, status: 1, createdAt: 1}` (cho worker pull queue), `{tenantId: 1, recipientId: 1, createdAt: -1}`, `{createdAt: 1} TTL 90 ngày`

---

# Module: AUDIT & SECURITY

## `audit_logs` (append-only, immutable)

```ts
{
  _id: ObjectId,
  id: string,
  tenantId: string,                // *
  userId: string | null,
  action: string,                  // * "order.cancel", "menu_item.price_change"
  entityType: string,              //   "Order", "MenuItem"
  entityId: string,
  before: any,                     //   snapshot trước
  after: any,                      //   snapshot sau
  metadata: {
    ipAddress: string,
    userAgent: string,
    requestId: string,
    reason: string | null,
  },
  timestamp: Date,                 // *
}
```

**Indexes**: `{tenantId: 1, timestamp: -1}`, `{tenantId: 1, entityType: 1, entityId: 1, timestamp: -1}`, `{tenantId: 1, userId: 1, timestamp: -1}`, `{timestamp: 1} TTL 7 năm cho action tài chính (hoặc lưu archive)`

---

# Module: INTEGRATION (API & Webhook)

## `api_keys`

```ts
{
  id, tenantId, ...auditFields,
  keyPrefix: string,               //   "ogk_live_" — public part
  keyHash: string,                 //   sha256 của full key, không lưu plain
  name: string,                    //   "Kế toán MISA integration"
  scopes: string[],                //   ["order.read", "customer.read"]
  rateLimitPerHour: number,
  expiresAt: Date | null,
  lastUsedAt: Date | null,
  status: "active" | "revoked",
}
```

**Indexes**: `{tenantId: 1, status: 1}`, `{keyPrefix: 1, keyHash: 1}`

## `webhook_endpoints`

```ts
{
  id, tenantId, ...auditFields,
  url: string,                     // *
  secret: string,                  // * encrypted
  events: string[],                // * ["order.paid", "booking.confirmed"]
  status: "active" | "paused" | "unhealthy",
  lastSuccessAt: Date | null,
  failureStreak: number,
  description: string | null,
}
```

## `webhook_deliveries`

```ts
{
  id, tenantId, ...auditFields,
  endpointId: string,
  eventType: string,
  payload: any,
  attempts: [
    {
      attemptedAt: Date,
      statusCode: number | null,
      responseBody: string | null,
      durationMs: number,
      error: string | null,
    }
  ],
  status: "pending" | "delivered" | "failed",
  nextAttemptAt: Date | null,
}
```

**Indexes**: `{tenantId: 1, endpointId: 1, createdAt: -1}`, `{status: 1, nextAttemptAt: 1}` (worker poll)

---

# Module: REPORTING (Read Models)

> Read-only collections, **không** là source of truth. Update qua event subscription.

## `daily_sales_summaries`

```ts
{
  _id: { tenantId, venueId, date },  // composite ID
  tenantId, venueId,
  date: Date,                        //   date only

  orders: { count: number, cancelledCount: number },
  revenue: {
    gross: Money,
    discount: Money,
    serviceCharge: Money,
    tax: Money,
    net: Money,
  },
  byPaymentMethod: { cash: Money, momo: Money, ... },
  byHour: [
    { hour: 0, orderCount: number, revenue: Money }, ...
  ],
  topItems: [
    { menuItemId: string, name: string, quantity: number, revenue: Money }
  ],
  staffPerformance: [
    { userId: string, name: string, orderCount: number, revenue: Money }
  ],

  computedAt: Date,
}
```

**Indexes**: `{tenantId: 1, venueId: 1, date: -1}`

## `customer_lifetime_values` (denormalized stat)

```ts
{
  _id: customerId,
  tenantId, customerId,
  totalSpent: Money,
  orderCount: number,
  averageOrderValue: Money,
  firstOrderAt: Date,
  lastOrderAt: Date,
  rfmScore: { recency: number, frequency: number, monetary: number },
  lastUpdatedAt: Date,
}
```

> Có thể duplicate `customers.stats` — đó là intentional. `customers` là source of truth, `customer_lifetime_values` là read model rebuild được.

---

# Schema migration history

Mỗi lần thay đổi schema → record vào `schema_migrations`:

```ts
{
  _id: string,                     //   "20260501_add_order_loyalty"
  appliedAt: Date,
  description: string,
  changedCollections: string[],
}
```

Tool: `migrate-mongo`.

---

## Tổng kết — Bảng đếm collection

| Module | Collection chính | Note |
| --- | --- | --- |
| Identity | users, memberships, refresh_tokens | users toàn cục |
| Tenant | tenants, venues | |
| Catalog FB | menu_categories, menu_items, recipes | embed variants/toppings |
| Table | tables | |
| Order | orders, order_events | embed lines |
| Payment | payments, payment_sessions | |
| E-Invoice | e_invoices | |
| Customer | customers, loyalty_cards, loyalty_transactions, vouchers | |
| Inventory | stock_items, stock_movements, suppliers, purchase_orders | |
| Shift | shifts | |
| Hospitality | room_types, rooms, rate_plans, bookings, room_inventory | |
| Notification | notification_templates, notifications | |
| Audit | audit_logs | append-only |
| Integration | api_keys, webhook_endpoints, webhook_deliveries | |
| Reporting | daily_sales_summaries, customer_lifetime_values | read model |

**Tổng**: ~30 collection cho năm 1 (F&B + cross-cutting). Hospitality năm 2 thêm 5 collection.

---
*Changelog: v0.2 — 2026-05-01 — bản đầu cho stack NestJS + Mongo.*
