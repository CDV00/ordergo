# Glossary — Thuật ngữ OrderGo

Quy tắc:
- **English** trong code (tên class, bảng, cột, API).
- **Tiếng Việt** trong UI/marketing/doc business.
- File này là cầu nối — khi nhắc một khái niệm, dùng đúng từ ở đây.

## Khái niệm cốt lõi (Tenant model)

| EN | VI | Định nghĩa |
| --- | --- | --- |
| **Tenant** | Doanh nghiệp / Tổ chức | Đơn vị cao nhất sở hữu data. 1 tenant = 1 khách hàng OrderGo. Chủ chuỗi 5 chi nhánh = 1 tenant. |
| **Venue** | Cơ sở / Chi nhánh | 1 địa điểm vật lý thuộc tenant. Mỗi venue có 1 `business_type`. Tenant có ≥ 1 venue. |
| **BusinessType** | Loại hình kinh doanh | Enum: `Restaurant`, `Cafe`, `Hotel`, `Homestay`, `Spa`, `Gym`, ... — quyết định module hiển thị. |
| **User** | Người dùng | Tài khoản đăng nhập, có thể thuộc nhiều tenant với role khác nhau. |
| **Membership** | Vai trò thành viên | Quan hệ User × Tenant (× Venue) với role. |
| **Role** | Vai trò | `Owner`, `Manager`, `Cashier`, `Server`, `Kitchen`, `Receptionist`, ... |
| **Permission** | Quyền | Hành động cụ thể (vd: `order.cancel`, `report.view`). Role là tập permission. |

## Lĩnh vực F&B

| EN | VI | Định nghĩa |
| --- | --- | --- |
| **Menu** | Thực đơn | Tập món ăn của 1 venue. |
| **MenuCategory** | Nhóm món | Cà phê, Trà sữa, Đồ ăn nhanh, ... |
| **MenuItem** | Món | Một sản phẩm bán được, có giá. |
| **Variant** | Biến thể | Size (S/M/L), độ ngọt, đá. |
| **Topping / Modifier** | Topping / Tuỳ chỉnh | Thêm trân châu, thêm whipping cream. |
| **Combo / Set** | Combo | Tập nhiều món với giá ưu đãi. |
| **Recipe** | Công thức | Định mức nguyên liệu cho 1 món. |
| **BoM (Bill of Materials)** | Định mức | Danh sách nguyên liệu của recipe. |
| **Table** | Bàn | Vị trí khách ngồi. |
| **Section / Zone** | Khu vực | Sảnh, sân thượng, lầu 2... |
| **Order** | Đơn | Một giao dịch bán hàng. |
| **OrderLine** | Dòng đơn | 1 món trong đơn (có số lượng, ghi chú, biến thể). |
| **OrderStatus** | Trạng thái đơn | Draft, Sent, InProgress, Ready, Served, Paid, Cancelled. |
| **OrderType** | Kiểu đơn | DineIn, Takeaway, Delivery, Online. |
| **KDS** | Màn hình bếp | Kitchen Display System. |
| **Station** | Trạm bếp | Lạnh, Nóng, Pha chế, Nướng. |
| **Shift** | Ca làm | Khoảng thời gian 1 nhóm nhân viên làm việc. |
| **Cashier Session** | Phiên thu ngân | Mở ca → đóng ca với 1 user thu ngân. |

## Lĩnh vực Hospitality

| EN | VI | Định nghĩa |
| --- | --- | --- |
| **Room** | Phòng | Đơn vị vật lý cho khách thuê. |
| **RoomType** | Loại phòng | Standard, Deluxe, Suite,... |
| **RatePlan** | Bảng giá | Giá cuối tuần, giá lễ, giá theo OTA. |
| **Booking / Reservation** | Đặt phòng | Yêu cầu lưu trú với check-in/out date. |
| **Guest** | Khách | Người đặt phòng / lưu trú. |
| **Folio** | Bill phòng tổng | Tổng phí phòng + dịch vụ + F&B. |
| **Channel Manager** | Quản lý kênh | Sync inventory với Booking.com, Agoda. |
| **OTA** | Online Travel Agent | Booking.com, Agoda, Traveloka. |
| **Housekeeping** | Buồng phòng | Quy trình dọn phòng. |
| **RevPAR** | Doanh thu/phòng có sẵn | Revenue per Available Room. |
| **ADR** | Giá phòng trung bình | Average Daily Rate. |
| **Occupancy** | Tỷ lệ lấp đầy | % phòng có khách / tổng phòng. |

## Thanh toán & Tài chính

| EN | VI | Định nghĩa |
| --- | --- | --- |
| **Payment** | Khoản thanh toán | 1 lần thu tiền. 1 đơn có thể có nhiều payment. |
| **PaymentMethod** | Phương thức | Cash, BankTransfer, Momo, VNPay, ZaloPay, Card. |
| **E-Invoice / HĐĐT** | Hoá đơn điện tử | Hoá đơn hợp pháp theo NĐ 123. |
| **VietQR** | QR ngân hàng VN | QR đa ngân hàng theo chuẩn NAPAS. |
| **Settlement** | Đối soát | Khớp tiền OrderGo nhận với tiền vào tài khoản ngân hàng. |
| **VAT** | Thuế GTGT | 0%, 5%, 8%, 10% (VN). |
| **Service charge** | Phí phục vụ | Phụ thu (thường 5–10%). |
| **Refund** | Hoàn tiền | Trả lại khách. |
| **Deposit** | Tiền cọc | Khách đặt trước. |

## Khách hàng & Loyalty

| EN | VI | Định nghĩa |
| --- | --- | --- |
| **Customer** | Khách hàng | Người mua hàng (khác Guest = khách lưu trú). |
| **CustomerProfile** | Hồ sơ khách | SĐT, tên, sinh nhật, ghi chú. |
| **LoyaltyCard** | Thẻ thành viên | Liên kết khách với tenant, có điểm. |
| **LoyaltyTier** | Hạng thẻ | Đồng, Bạc, Vàng, Bạch Kim. |
| **Voucher** | Voucher / Mã giảm giá | Mã hoặc rule discount cá nhân hoá. |
| **Campaign** | Chiến dịch | Tập voucher + segment + thời hạn. |

## Vận hành & Kho

| EN | VI | Định nghĩa |
| --- | --- | --- |
| **Inventory** | Kho | Tồn nguyên liệu/sản phẩm. |
| **StockMovement** | Biến động kho | In/Out/Transfer/Adjustment. |
| **Supplier** | Nhà cung cấp | Đơn vị cung cấp nguyên liệu. |
| **PurchaseOrder** | Đơn mua | Đơn đặt hàng nhà cung cấp. |
| **Wastage** | Hao hụt | Hỏng, đổ, mất. |
| **CentralKitchen** | Bếp trung tâm | Bếp cấp phát cho nhiều chi nhánh. |

## Kỹ thuật / Kiến trúc

| EN | VI | Định nghĩa |
| --- | --- | --- |
| **Module** | Module | Đơn vị logic trong codebase, bound theo domain (Order, Menu, Hotel...). |
| **Modular Monolith** | Monolith dạng module | 1 process, nhiều module có ranh giới rõ. |
| **Event Bus** | Trục sự kiện | Cơ chế module nói chuyện qua sự kiện (`OrderCreated`, `RoomCheckedIn`). |
| **Domain Event** | Sự kiện nghiệp vụ | Đã xảy ra rồi, immutable. |
| **Aggregate** | Aggregate | Cụm entity được commit cùng lúc (DDD). |
| **API** | Giao diện lập trình | REST/GraphQL endpoint. |
| **Webhook** | Webhook | Server gọi URL khách khi có sự kiện. |
| **Tenant Isolation** | Cô lập tenant | Đảm bảo data tenant A không lộ sang tenant B. |
| **Soft Delete** | Xoá mềm | Set `deleted_at`, không xoá dòng vật lý. |
| **Idempotency Key** | Khoá idempotent | Để API call lặp không tạo 2 record. |

## Quy ước viết tắt

| Tắt | Đầy đủ |
| --- | --- |
| **POS** | Point of Sale |
| **KDS** | Kitchen Display System |
| **PMS** | Property Management System |
| **CRM** | Customer Relationship Management |
| **HĐĐT** | Hoá đơn điện tử |
| **VAT** | Value Added Tax (thuế GTGT) |
| **MRR** | Monthly Recurring Revenue |
| **ARR** | Annual Recurring Revenue |
| **WAV** | Weekly Active Venues |
| **CAC** | Customer Acquisition Cost |
| **LTV** | Lifetime Value |
| **NPS** | Net Promoter Score |
| **CSAT** | Customer Satisfaction |
| **NRR** | Net Revenue Retention |
| **DoD** | Definition of Done |
| **PRD** | Product Requirements Document |
| **GTM** | Go-to-Market |
| **NFR** | Non-functional Requirements |

---
*Changelog: v0.1 — 2026-05-01.*
