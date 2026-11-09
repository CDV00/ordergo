# Multi-tenant & Multi-vertical

## Tóm tắt

Đây là **document quan trọng nhất về kiến trúc data** vì nó quyết định:
- Khả năng scale lên nhiều khách hàng (multi-tenant)
- Khả năng mở vertical mới (multi-vertical)
- Giới hạn về compliance, performance, isolation

Sai ở đây = phải refactor cả codebase sau này.

---

## 1. Mô hình tenant

### Hierarchy

```
Tenant (= Doanh nghiệp / Khách hàng OrderGo)
   │
   ├── Venue 1 (= Cơ sở vật lý — F&B / Hotel / Spa)
   │     │
   │     ├── Tables / Rooms / ...
   │     ├── Menus / Room Types / ...
   │     └── Orders, Bookings...
   │
   ├── Venue 2
   │     └── ...
   │
   └── Venue N
```

- **Tenant** là cấp sở hữu data cao nhất. 1 chủ chuỗi 5 quán cà phê + 2 homestay = **1 tenant**.
- **Venue** là 1 địa điểm vật lý. Mỗi venue có `business_type` (Restaurant/Cafe/Hotel/Homestay/Spa/Gym/Edu/...).
- **User** là cấp toàn cục (1 user có thể được cấp quyền vào nhiều tenant — vd: kế toán dịch vụ chăm 5 doanh nghiệp).

### Quyền (Membership × Role)

```
User ──Membership──▶ Tenant
                     │
                     └─ scope: Tenant (all venues) | Venue (specific)
                     └─ role: Owner | Manager | Cashier | Server | Kitchen | Receptionist | Accountant | Custom
```

---

## 2. Tenant Isolation Model

3 mô hình phổ biến:

| Mô hình | Mô tả | Ưu | Nhược | Khi nào chọn |
| --- | --- | --- | --- | --- |
| **Pooled (single DB, shared schema)** | Tất cả tenant share 1 DB, phân biệt bởi cột `tenant_id` | Cost thấp, ops đơn giản | Risk cross-tenant leak nếu code sai, "noisy neighbor" | SMB SaaS, < 10k tenant |
| **Bridge (single DB, schema/table per tenant)** | Mỗi tenant 1 schema riêng | Isolation tốt hơn pooled | Migration khó, scale schema giới hạn | Mid-market |
| **Silo (DB per tenant)** | Mỗi tenant 1 DB riêng | Isolation tối đa, compliance dễ | Cost cao, ops phức tạp | Enterprise, regulated |

### Quyết định OrderGo: **Pooled cho phần lớn + Silo tuỳ chọn cho Enterprise**

- **Default (Free, Starter, Pro, Business)**: Pooled — 1 DB chính cho mọi tenant, filter `WHERE tenant_id = ?` ở mọi query
- **Enterprise (chuỗi 20+ chi nhánh, yêu cầu data trong VN, audit chặt)**: Silo — 1 DB riêng, có thể on-premise

### Implementation Pooled — đảm bảo isolation

1. **Mọi entity nghiệp vụ có cột `tenant_id`** (ngoại trừ `User`, `Tenant` toàn cục)
2. **Query filter ở app layer**, không dựa RLS DB
   - `TenantContextService` (AsyncLocalStorage) giữ tenant/venue của request → `BaseTenantRepository` tự thêm `tenantId` + `deletedAt: null` vào mọi query
   - Repository mới **phải** kế thừa `BaseTenantRepository`; query raw model phải tự thêm `tenantId`
3. **`JwtAuthGuard` verify JWT**, rồi đối chiếu tenant/venue yêu cầu (header `X-Tenant-Id`/`X-Venue-Id` hoặc JWT) với **membership trong DB** — không thuộc về user → 403. Permissions lấy từ membership nên thu hồi quyền có hiệu lực ngay
4. **Code review + lint rule**: query không filter `tenant_id` → reject
5. **Audit log** cho mọi truy cập cross-tenant (nếu có user multi-tenant)
6. **Test isolation**: e2e với 2 tenant (`ordergo-api/test/app.e2e-spec.ts`) — tenant A không đọc/ghi được data tenant B kể cả khi đổi header

### Lưu ý: middleware hiện tại đang **hardcode tenant_id** (`11111...1`) — phải replace bằng JWT extraction trước MVP.

---

## 3. Multi-vertical strategy

### Vấn đề cần giải

1. Order entity dùng cho cả "đơn cà phê" và "đơn phòng" và "đơn dịch vụ spa" — không thể tách 3 bảng
2. UI hiển thị module theo vertical — không thể hardcode "Tab Bàn"
3. Báo cáo cross-vertical (chủ Anh Khải có 3 cà phê + 2 homestay) — phải gộp được

### Cách giải

#### 3.1 Order entity polymorphic

`Order` có cột `business_context` (enum) và `order_type`:

| business_context | order_type ví dụ | reference_id liên kết |
| --- | --- | --- |
| F&B | DineIn / Takeaway / Delivery | `table_id`, `customer_id` |
| Hotel | RoomService / Booking | `booking_id`, `room_id`, `guest_id` |
| Spa | Service | `appointment_id`, `customer_id` |
| Gym | Membership | `membership_id`, `customer_id` |

`OrderLine` có `product_type` enum (`MenuItem`, `RoomNight`, `ServicePackage`, ...) và `product_id` Guid (reference cross-module).

→ Cùng schema, ngữ nghĩa khác. Báo cáo có thể group theo `business_context` để tách F&B vs Hotel revenue.

#### 3.2 Module bật/tắt theo venue

- `Venue.business_type` quyết định module nào active cho venue đó
- Tenant có nhiều venue khác business_type → tenant đó "multi-vertical"
- UI dùng `business_type` của venue đang chọn để hiển thị nav: F&B venue thấy Menu/Bàn/KDS; Hotel venue thấy Phòng/Booking/Lễ tân

#### 3.3 Shared module hoạt động cross-vertical

- `Customer`, `Loyalty`, `Payment`, `Reporting`, `Notification` không biết business_type
- Khách check-in homestay → loyalty cộng điểm → khách đến cà phê cùng tenant → áp tier
- Đây chính là **moment "không thể copy"** cho chủ Anh Khải B3

#### 3.4 Vertical-specific module ở namespace riêng

- F&B specific: `Modules.Catalog.FB`, `Modules.KDS`, `Modules.Recipe`
- Hotel specific: `Modules.Catalog.Hotel`, `Modules.Booking`, `Modules.Channel`, `Modules.Housekeeping`
- Một venue chỉ "thấy" module phù hợp với business_type của nó

---

## 4. Data partitioning strategy (cho scale)

### MVP (< 100 tenant)
- 1 DB pooled, không partition

### Năm 1 (< 1.000 tenant)
- Vẫn 1 DB
- Index `(tenant_id, ...)` hợp lý
- Read replica cho báo cáo

### Năm 2 (1.000–10.000 tenant)
- Partition table lớn (Order, OrderLine, Payment, Notification) theo `tenant_id` hash hoặc range
- Tách read model (Reporting) ra DB riêng (CQRS)

### Năm 3+ (> 10.000 tenant)
- Sharding theo `tenant_id`
- Mỗi shard 1 DB
- Tenant Enterprise có thể có DB riêng (Silo)

---

## 5. Compliance & Data Residency

### NĐ 13/2023 (PDPL VN)
- Lưu data cá nhân khách hàng cuối tại VN (preferred)
- Có cơ chế opt-in / right-to-erase
- Audit log ai truy cập data nào, khi nào

### NĐ 53/2022 (Luật ANM)
- Một số ngành (tài chính, viễn thông) bắt buộc lưu data tại VN
- F&B/Hospitality SMB **không bắt buộc**, nhưng nên có option cho khách Enterprise

### Khu vực hosting đề xuất
- **Default**: AWS Singapore hoặc DigitalOcean Singapore (latency < 50ms tới VN)
- **Enterprise tier**: AWS VN (sắp có) hoặc VNG Cloud / Viettel IDC trong nước

### Privacy by design
- Encryption at-rest cho cột nhạy cảm: `phone`, `email`, `birthday`, `cccd_number` (CMND), `passport_number`
- Hashing 1 chiều cho password (Argon2id)
- Không bao giờ log data cá nhân khách hàng cuối ra log file/observability

---

## 6. Cross-tenant scenarios (cần thiết kế cẩn thận)

### 6.1 Kế toán dịch vụ truy cập nhiều tenant
- 1 user (anh Tuấn U4) có 10 membership, 10 tenant khác nhau
- UI: dropdown chọn tenant ở header, chỉ thấy data tenant đang chọn
- API: JWT có claim tenant đang active

### 6.2 OrderGo support team truy cập tenant khách
- Vai trò "PlatformSupport" có thể impersonate user của tenant để hỗ trợ
- Audit log full, khách hàng thấy được "OrderGo support đã truy cập lúc X"
- Phải có khách approve trước (qua email/in-app)

### 6.3 Marketplace partner truy cập nhiều tenant
- 3rd-party app (vd: app kế toán) được khách approve OAuth → có thể đọc data tenant đó
- Limit scope theo OAuth scope (`order.read`, `customer.read`)
- Rate limit theo OAuth client

---

## 7. Implementation checklist (cho dev khi build module mới)

- [ ] Mọi bảng có `tenant_id` (trừ User, Tenant)
- [ ] Mọi bảng có `(tenant_id, ...)` index hợp lý
- [ ] Repository method có inject `ITenantContext` và filter `WHERE tenant_id = ?`
- [ ] Có integration test "tenant A không đọc được data tenant B"
- [ ] Bảng có data nhạy cảm (PII) → encrypt at-rest những cột cần
- [ ] Module nhạy cảm (Payment, Invoice) → audit log mọi action
- [ ] Khi delete tenant → cascade soft delete (giữ data 90 ngày cho compliance)
- [ ] Migration có index `tenant_id` từ đầu — bottleneck #1 khi scale

---

## 8. Anti-patterns cần tránh

- ❌ Cột `restaurant_id` (đóng cứng vertical) — phải là `tenant_id` + `venue_id`
- ❌ Hardcode `business_type = 'restaurant'` ở UI shared
- ❌ Dùng `IDENTITY` int auto-increment cho ID — leak count + khó shard
- ❌ Query mà thiếu filter `tenant_id` (kể cả admin query) — phải explicit
- ❌ Cache key không có `tenant_id` — gây cross-tenant leak qua cache
- ❌ Email/notification gửi cross-tenant
- ❌ Subdomain riêng cho từng tenant ở MVP — dùng `app.ordergo.vn` chung, route theo JWT (subdomain custom v3 cho Enterprise)

---

## 9. Câu hỏi mở

- [ ] Có cho phép user "xem nhiều tenant cùng lúc" trong 1 view (multi-tenant dashboard)? Khả năng cao **không** ở MVP — switch tenant ở header
- [ ] Tenant migrate giữa region (VN ↔ SG) thế nào? — chưa cần MVP
- [ ] Tenant fork (chia tách công ty) thế nào? — chưa cần MVP, manual ops
- [ ] Tenant merge (M&A khách hàng) thế nào? — chưa cần MVP

---
*Changelog: v0.1 — 2026-05-01.*
