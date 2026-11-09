# Domain Model

> Mô tả các entity cốt lõi và quan hệ. Đây là **logical model** (concept) — không phải DB schema chi tiết. Schema cụ thể ở `04-architecture/` và migration files.

## Nguyên tắc thiết kế

1. **Tenant-first**: mọi entity nghiệp vụ có `tenant_id` (trừ `Tenant` và `User` toàn cục).
2. **Soft delete**: dùng `deleted_at` thay vì xoá vật lý cho mọi entity nghiệp vụ.
3. **Audit columns**: `created_at`, `updated_at`, `created_by`, `updated_by` ở mọi bảng.
4. **Money**: dùng `decimal(18,4)` lưu số tiền + cột `currency` (ISO 4217). Default VND (không có decimal nhưng giữ `decimal` cho i18n).
5. **Snake_case** trong DB, **PascalCase** trong code C#.
6. **GUID/UUID** cho ID nghiệp vụ (không dùng IDENTITY incremental — tránh leak quy mô + dễ migrate cross-shard sau này).
7. **No FK across module boundaries** ở DB level — module Order không FK sang module Menu. Reference qua `menu_item_id` (Guid) + cache snapshot. Cross-module communication qua event bus.

---

## Entity-Relationship (high-level)

```
                ┌────────────┐
                │   Tenant   │
                └─────┬──────┘
                      │ 1..*
                      ▼
                ┌────────────┐         ┌──────────────┐
                │   Venue    │────────▶│ BusinessType │
                │ (location) │  enum   └──────────────┘
                └─────┬──────┘
                      │
        ┌─────────────┼─────────────┬─────────────┬───────────────┐
        ▼             ▼             ▼             ▼               ▼
   ┌────────┐   ┌─────────┐   ┌─────────┐   ┌───────────┐   ┌──────────┐
   │  Menu  │   │  Table  │   │  Order  │   │   Room    │   │ Customer │
   │ (F&B)  │   │  (F&B)  │   │ (any)   │   │ (Hotel)   │   │  (any)   │
   └────────┘   └─────────┘   └─────┬───┘   └─────┬─────┘   └──────────┘
                                    │             │
                                    │             │
                              ┌─────▼─────┐ ┌─────▼──────┐
                              │  Payment  │ │  Booking   │
                              └───────────┘ └────────────┘

User ◀── Membership ──▶ Tenant + Venue (RBAC)
```

---

## Bounded Contexts (DDD-light)

Mỗi bounded context = 1 module. Entity chỉ thuộc 1 context "owner". Context khác tham chiếu qua Guid + snapshot.

| Context | Owner entity | Reference |
| --- | --- | --- |
| **Identity** | User, Tenant, Membership, Role, Permission | — |
| **Catalog (F&B)** | Menu, MenuCategory, MenuItem, Variant, Topping, Recipe | `tenant_id`, `venue_id` |
| **Catalog (Hotel)** | Room, RoomType, RatePlan | `tenant_id`, `venue_id` |
| **Order** | Order, OrderLine, Payment | `tenant_id`, `venue_id`, `customer_id`, `menu_item_id` (snapshot price) |
| **Booking** | Booking, Folio, Stay | `tenant_id`, `venue_id`, `room_id`, `guest_id` |
| **Customer** | Customer, LoyaltyCard, Voucher | `tenant_id` |
| **Inventory** | StockItem, Supplier, StockMovement, PurchaseOrder | `tenant_id`, `venue_id`, `menu_item_id` (qua BoM) |
| **Reporting** | (read model — denormalized views/materialized) | — |
| **Notification** | NotificationTemplate, NotificationLog | `tenant_id`, `user_id` |

---

## Core entities — đặc tả

### Tenant
| Field | Type | Note |
| --- | --- | --- |
| id | Guid PK | |
| name | string | Tên doanh nghiệp |
| legal_name | string | Tên trên giấy phép |
| tax_code | string | Mã số thuế VN |
| owner_user_id | Guid FK User | Owner mặc định |
| plan | enum | Free / Starter / Pro / Business / Enterprise |
| trial_ends_at | datetime? | |
| status | enum | Active / Suspended / Cancelled |

### Venue
| Field | Type | Note |
| --- | --- | --- |
| id | Guid PK | |
| tenant_id | Guid FK Tenant | |
| name | string | "Cafe ABC chi nhánh Quận 1" |
| business_type | enum | Restaurant, Cafe, Hotel, Homestay, Spa, Gym, Edu... |
| address | string | |
| city, district, ward | string | Cho i18n + báo cáo địa lý |
| timezone | string | Asia/Ho_Chi_Minh mặc định |
| currency | string | VND mặc định |
| status | enum | Active / Inactive |
| settings_json | jsonb | Thiết lập tuỳ biến venue |

### User (toàn cục, không tenant_id)
| Field | Type |
| --- | --- |
| id | Guid PK |
| phone | string unique |
| email | string nullable |
| password_hash | string |
| display_name | string |
| avatar_url | string |
| status | enum |

### Membership
Quan hệ User × Tenant × Venue × Role.

| Field | Type |
| --- | --- |
| id | Guid PK |
| user_id | FK |
| tenant_id | FK |
| venue_id | FK nullable (null = tất cả venue trong tenant) |
| role_id | FK |
| invited_at | datetime |
| accepted_at | datetime? |
| status | enum |

### Role / Permission
- Roles: Owner, TenantAdmin, VenueManager, Cashier, Server, Kitchen, Receptionist, Accountant (read-only), Custom
- Permissions: chuỗi `domain.action` (`order.create`, `order.cancel`, `report.view`, `menu.edit`, ...)
- `RolePermission` bảng nối nhiều-nhiều

---

### Menu / MenuItem (F&B)
| Field (MenuItem) | Type |
| --- | --- |
| id | Guid PK |
| tenant_id, venue_id | FK |
| category_id | FK MenuCategory |
| name | string |
| description | string |
| price | decimal(18,4) |
| sku | string nullable |
| image_url | string |
| is_available | bool |
| display_order | int |

`Variant`, `Topping`, `Recipe` là entity con của MenuItem.

### Table
| Field | Type |
| --- | --- |
| id | Guid PK |
| tenant_id, venue_id | FK |
| section | string (vd: "Sảnh", "Sân", "Lầu") |
| name | string ("Bàn 5", "VIP 1") |
| capacity | int |
| status | enum (Available, Occupied, Reserved, Cleaning) |

---

### Order (entity chung — dùng cho cả F&B và Hotel)
> Order là **entity polymorphic theo `business_type`**. Cùng schema, ngữ nghĩa khác. Đây là cốt lõi của thiết kế multi-vertical.

| Field | Type | Note |
| --- | --- | --- |
| id | Guid PK | |
| tenant_id, venue_id | FK | |
| order_number | string | Có thể human-readable: "ORD-20260501-0001" |
| order_type | enum | DineIn, Takeaway, Delivery, Online, RoomService, Booking, Service |
| business_context | enum | F&B, Hotel, Spa, ... — quyết định module nào hiển thị nó |
| reference_id | Guid? | Khi order liên kết entity khác (booking_id cho room order) |
| customer_id | Guid? FK | |
| table_id | Guid? FK | F&B only |
| room_id | Guid? FK | Hotel only |
| status | enum | Draft, Sent, InProgress, Ready, Served, Paid, Cancelled |
| subtotal, tax, service_charge, discount, total | decimal | |
| created_by | Guid FK User | |
| paid_at | datetime? | |

### OrderLine
| Field | Type |
| --- | --- |
| id | Guid PK |
| order_id | FK |
| product_type | enum (MenuItem, RoomNight, ServicePackage, ...) |
| product_id | Guid (cross-module reference) |
| product_snapshot_json | jsonb (lưu tên + giá + biến thể tại thời điểm order — giá có thể đổi sau) |
| quantity | decimal |
| unit_price | decimal |
| modifiers_json | jsonb (toppings, ghi chú) |
| line_total | decimal |

### Payment
| Field | Type |
| --- | --- |
| id | Guid PK |
| order_id | FK |
| method | enum |
| amount | decimal |
| currency | string |
| received_by | FK User |
| received_at | datetime |
| external_ref | string nullable (transaction id từ Momo/VNPay) |
| status | enum (Pending, Succeeded, Refunded, Failed) |

---

### Customer
| Field | Type |
| --- | --- |
| id | Guid PK |
| tenant_id | FK |
| phone | string |
| name | string |
| email | string nullable |
| birthday | date nullable |
| gender | enum nullable |
| total_spent | decimal (denormalized) |
| order_count | int (denormalized) |
| last_visit_at | datetime |
| tags_json | jsonb |

### LoyaltyCard
| Field | Type |
| --- | --- |
| id | Guid PK |
| tenant_id | FK |
| customer_id | FK |
| tier | enum (Bronze, Silver, Gold, Platinum) |
| points | int |
| issued_at | datetime |

---

### Hospitality entities (v2)

#### Room
| Field | Type |
| --- | --- |
| id | Guid PK |
| tenant_id, venue_id | FK |
| room_type_id | FK |
| name / number | string ("301", "Deluxe-A") |
| floor | int |
| status | enum (Available, Occupied, Cleaning, OutOfOrder) |

#### RoomType
| Field | Type |
| --- | --- |
| id | Guid PK |
| tenant_id, venue_id | FK |
| name | string |
| capacity | int |
| amenities_json | jsonb |
| base_price | decimal |

#### Booking
| Field | Type |
| --- | --- |
| id | Guid PK |
| tenant_id, venue_id | FK |
| customer_id | FK |
| room_id | FK |
| check_in_date | date |
| check_out_date | date |
| nights | int (computed) |
| status | enum (Pending, Confirmed, CheckedIn, CheckedOut, Cancelled, NoShow) |
| total_amount | decimal |
| deposit_amount | decimal |
| source | enum (Direct, BookingCom, Agoda, Traveloka, ...) |
| external_ref | string |

#### Folio (bill phòng tổng — Order với business_context=Hotel)
- Có thể dùng chung `Order` table với `business_context=Hotel`, `reference_id=booking_id`
- Hoặc tách bảng `Folio` riêng — quyết định ở v2

---

## Tham chiếu cross-module

Quy tắc:
- **In-process** (cùng monolith): code module Order import từ `Modules.Menu.Domain` để biết MenuItem, **chỉ đọc**, không edit. Không bắt buộc — có thể chỉ giữ Guid.
- **Snapshot pattern**: khi order đặt MenuItem, copy `name`, `price`, `variant` vào `product_snapshot_json`. Nếu sau này MenuItem đổi giá / xoá, order vẫn đúng.
- **Event-driven cross-context**: `OrderCreated` → Inventory subscribe → trừ kho theo BoM. Không gọi trực tiếp.

---

## Quy ước database (technical)

- DB: SQL Server (đang config) hoặc PostgreSQL (recommend chuyển — chi phí thấp hơn, jsonb mạnh hơn). Quyết định ở `04-architecture/02-tech-stack.md`.
- Tên bảng: số nhiều, snake_case (`menu_items`, `order_lines`)
- PK: `id` Guid
- Composite index quan trọng: `(tenant_id, ...)` cho hầu hết bảng để query bị filter tenant trước
- RLS (Row-Level Security): không phụ thuộc, dùng filter ở app layer (qua `IRestaurantContext` đã có) — đơn giản hơn, dễ debug
- Soft delete: `deleted_at` timestamp; query mặc định filter `WHERE deleted_at IS NULL`
- Audit: cột `created_at`, `updated_at`, `created_by`, `updated_by` ở mọi bảng

---

## Ánh xạ sang code hiện tại

Backend `ordergo-api` (NestJS + MongoDB) đã hiện thực các entity: User, Membership, Tenant, Venue, MenuCategory, MenuItem (embed Variant/ToppingGroup), Table, TableSession, Order (embed OrderLine + snapshot), OrderEvent (outbox), Payment, Customer, LoyaltyCard/Transaction, OtpAttempt. Schema chi tiết: `08-database/02-mongodb-schema.md`. Code `ordergo-api-v2` (.NET) đã dừng (2026-11-09).

---
*Changelog: v0.1 — 2026-05-01.*
