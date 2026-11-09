# Product Requirements Document (PRD)

**Phiên bản**: v0.1 (2026-05-01)
**Phạm vi**: định nghĩa sản phẩm OrderGo cấp tổng thể (vision, scope, objectives, KPI). Các PRD chi tiết cho từng module/epic sẽ là file riêng.

---

## 1. Mục tiêu sản phẩm

OrderGo là **nền tảng SaaS quản lý vận hành** cho cơ sở dịch vụ tại VN, tập trung F&B năm 1, mở rộng Hospitality năm 2. PRD này định nghĩa "cái gì cần có để gọi là OrderGo" — không phải "cái gì sẽ có một ngày nào đó".

### Mục tiêu kinh doanh (đo trong 12 tháng kể từ MVP)
- 300 WAV
- MRR 50tr
- NPS ≥ 50
- Net Revenue Retention ≥ 95%

### Mục tiêu sản phẩm
- Time-to-first-order < 30 phút (median)
- Đáp ứng 99.5% giờ kinh doanh (06h–24h)
- Latency p95 các thao tác POS < 500ms
- Hỗ trợ 100% nhu cầu của 80% khách F&B SMB (1–10 chi nhánh)

---

## 2. Phạm vi sản phẩm — bird's-eye

OrderGo gồm **3 surface chính** chia sẻ cùng backend:

```
┌─────────────────────────────────────────────────────────┐
│  Backend modular monolith (.NET 8) + SQL Server         │
│  Modules: Identity, Order, Menu, Payment, Inventory,    │
│  Reporting, Customer, Notification, Hospitality, ...    │
└─────────────────────────────────────────────────────────┘
                  ▲             ▲             ▲
                  │             │             │
        ┌─────────┴───┐ ┌──────┴──────┐ ┌────┴───────┐
        │ Web Admin   │ │ Mobile/POS  │ │ Open API   │
        │ (Next.js)   │ │ (RN/Flutter)│ │ + Webhooks │
        │ Chủ + Kế    │ │ Phục vụ +   │ │ 3rd-party  │
        │ toán + PM   │ │ Bếp + Lễ tân│ │ tích hợp   │
        └─────────────┘ └─────────────┘ └────────────┘
```

### Surface 1 — Web Admin (Next.js 15)
**Đối tượng**: B1, B2, B3, U4 (kế toán)
**Use case**: thiết lập, dashboard, báo cáo, cấu hình.

### Surface 2 — Mobile/POS App (React Native hoặc Flutter — chọn ở 04-architecture)
**Đối tượng**: U1 (phục vụ), U2 (bếp KDS), U3 (lễ tân)
**Use case**: vận hành thực địa, mobile-first.

### Surface 3 — Open API + Webhooks
**Đối tượng**: Đối tác (giao hàng, kế toán, marketing), Enterprise tự xây UI
**Use case**: tích hợp, automation.

---

## 3. Module catalog (cấp PRD)

> Chi tiết từng module ở `docs/03-domain/03-module-catalog.md`. Đây là tổng quan.

### Modules core (dùng chung mọi vertical)
| Module | Mô tả | MVP | v2 |
| --- | --- | --- | --- |
| **Identity & Tenant** | Đa tenant, RBAC, multi-branch, SSO | ✅ | ✅ |
| **Customer** | Hồ sơ khách hàng, loyalty, voucher | 🟡 cơ bản | ✅ đầy đủ |
| **Order** | Đơn hàng (F&B, Hotel, Spa...) — entity chung | ✅ | ✅ |
| **Payment** | Thu tiền: tiền mặt, thẻ, ví, chuyển khoản | ✅ | ✅ |
| **Inventory** | Tồn kho, nguyên liệu, BoM, hao hụt | 🟡 cơ bản | ✅ |
| **Reporting** | Doanh thu, P&L, hao hụt, so sánh | 🟡 cơ bản | ✅ |
| **Notification** | Push, SMS, Email, Zalo OA | 🟡 push only | ✅ |
| **Settings** | Cấu hình thuế, tiền tệ, in bill, máy in | ✅ | ✅ |

### Modules vertical F&B (MVP — năm 1)
| Module | Mô tả | MVP | v2 |
| --- | --- | --- | --- |
| **Menu (F&B)** | Món, nhóm, biến thể, topping, giờ phục vụ | ✅ | ✅ |
| **Table** | Bố cục bàn, ghép bàn, chuyển bàn | ✅ | ✅ |
| **Kitchen Display (KDS)** | Màn hình bếp realtime | ✅ | ✅ |
| **Shift** | Ca làm, đóng ca, kiểm tiền | ✅ | ✅ |
| **Recipe & BoM** | Công thức món, định mức nguyên liệu | ❌ | ✅ |

### Modules vertical Hospitality (năm 2)
| Module | Mô tả | MVP | v2 |
| --- | --- | --- | --- |
| **Room** | Loại phòng, sơ đồ tầng, trạng thái | ❌ | ✅ |
| **Booking** | Đặt phòng, walk-in, deposit | ❌ | ✅ |
| **Channel Manager** | Booking.com, Agoda, Traveloka sync | ❌ | ✅ |
| **Housekeeping** | Trạng thái dọn phòng, mini-bar | ❌ | ✅ |

### Modules add-on (cross-vertical)
| Module | Mô tả | MVP | v2 |
| --- | --- | --- | --- |
| **E-Invoice** | HĐĐT VN qua VNPT/Viettel | 🟡 mock + 1 đối tác | ✅ |
| **Loyalty** | Tích điểm, voucher, tier | ❌ | ✅ |
| **Marketing** | Email/SMS/Zalo broadcast | ❌ | ✅ |
| **Accounting Pro** | Báo cáo TT200/133, sổ cái | ❌ | ✅ |

---

## 4. Yêu cầu chức năng (Functional) — cấp tổng thể

### FR-1 Multi-tenant + Multi-vertical
- Mỗi tenant = 1 doanh nghiệp; có nhiều cơ sở (Venue/Branch); mỗi cơ sở có business_type (F&B, Hotel, Spa, ...)
- 1 user có thể truy cập nhiều cơ sở với role khác nhau
- Module hiển thị/hoạt động theo `business_type` của cơ sở đang chọn
- Báo cáo cấp doanh nghiệp (cross-venue, cross-vertical) phải có sẵn

### FR-2 Order management (cốt lõi)
- Tạo, sửa, hủy đơn
- Áp dụng giảm giá (% / số tiền), voucher, member rate
- Chia đơn (split bill) theo món hoặc theo người
- Gộp bàn / chuyển bàn / chuyển nhân viên
- Lịch sử đơn không xoá được (audit)

### FR-3 Payment
- Hỗ trợ: tiền mặt, chuyển khoản, ví Momo/VNPay/ZaloPay, thẻ POS (qua đối tác)
- Thu một phần (partial payment), thu nhiều lần
- Hoá đơn điện tử (e-invoice) sinh tự động khi thu xong
- Dấu vết audit: ai thu, khi nào, từ thiết bị nào

### FR-4 Realtime
- Đơn từ phục vụ → bếp < 1s
- Đơn xong → phục vụ < 1s
- Thay đổi trạng thái bàn realtime trên mọi thiết bị

### FR-5 Offline-first cho POS
- App phục vụ phải order được khi mất mạng tối đa 30 phút
- Sync tự động khi có lại
- Chống xung đột (cùng 1 bàn 2 thiết bị order)

### FR-6 Báo cáo
- Doanh thu theo ngày/tuần/tháng, chi nhánh, nhân viên, món
- Top món bán chạy, ít chạy, lợi nhuận theo món (có Inventory)
- So sánh kỳ trước
- Export Excel, PDF, gửi email theo lịch
- API/webhook đẩy data sang phần mềm kế toán bên ngoài

### FR-7 Hoá đơn điện tử (VN)
- Tích hợp ≥ 1 nhà cung cấp (VNPT-Invoice / Viettel-Sinvoice / MISA-MeInvoice)
- Tự sinh từ đơn đã thu, gửi cơ quan thuế
- Tra cứu, gửi lại email, in PDF

### FR-8 Cấu hình thiết bị
- Máy in nhiệt (Bluetooth, USB, LAN)
- Két tiền
- Màn hình KDS
- Máy quét mã vạch
- Cân điện tử (cho quán có bán theo gram — F&B nâng cao)

---

## 5. Yêu cầu phi chức năng (Non-functional)

> Chi tiết ở `docs/04-architecture/05-nfr.md`. Tóm tắt:

| Hạng mục | Mục tiêu MVP | Năm 2 |
| --- | --- | --- |
| Uptime | 99.5% giờ kinh doanh | 99.9% |
| Latency p95 POS action | < 500ms | < 300ms |
| Latency p95 báo cáo | < 3s | < 1s |
| Hỗ trợ concurrent users/cơ sở | 50 | 200 |
| Khả năng chịu đột biến giờ peak | 5x base load | 10x |
| RPO (data loss) | ≤ 5 phút | ≤ 1 phút |
| RTO (thời gian khôi phục) | ≤ 1 giờ | ≤ 15 phút |
| Backup | Daily, retention 30 ngày | Hourly + daily, retention 90 ngày |

---

## 6. Tích hợp bên ngoài (Integration)

### MVP must
- Ví: Momo, VNPay (cổng thanh toán QR)
- HĐĐT: ≥ 1 nhà cung cấp
- Email: SendGrid hoặc tương đương
- SMS: ESMS hoặc tương đương
- Push: FCM
- Object storage: S3-compatible (DigitalOcean Spaces / Cloudflare R2 / AWS S3)

### Năm 2
- Zalo OA, ZaloPay
- Booking.com, Agoda, Traveloka (channel manager)
- Grab, ShopeeFood, GoFood (đơn online)
- Phần mềm kế toán: MISA, Fast (qua API/file export)
- Ngân hàng: Vietcombank, MB, Techcombank (auto reconcile)

---

## 7. Bảo mật & Tuân thủ

- **PCI-DSS**: không lưu thẻ tín dụng raw — chỉ token từ cổng thanh toán
- **NĐ 13/2023 (PDPL)**: bảo vệ dữ liệu cá nhân — privacy policy, opt-in, right to erase
- **NĐ 53/2022 + Luật ANM**: lưu data trong VN cho nhóm khách bị regulated
- **HĐĐT** (NĐ 123, TT 78, NĐ 70/2025): tuân thủ format & API thuế
- **Audit log** không thể xoá cho mọi action liên quan tài chính
- **2FA** cho role Admin/Owner
- **Encryption**: TLS 1.3 in-transit, AES-256 at-rest cho data nhạy cảm

---

## 8. Out of scope (rõ ràng những thứ KHÔNG làm)

- Tự xây cổng thanh toán → tích hợp đối tác
- Tự build kế toán đôi (double-entry) đầy đủ → export sang MISA/Fast
- Hệ thống ERP cho nhà máy sản xuất
- App đặt món cho khách cuối (consumer app) — sẽ có ở v2 dạng PWA QR-menu, không phải app store
- App giao hàng riêng — tích hợp Grab/ShopeeFood
- Phần cứng — chỉ tích hợp
- Trang web bán hàng e-commerce

---

## 9. Giả định (Assumptions)

1. Khách hàng có internet ổn định ≥ 70% thời gian (offline mode chỉ là backup, không phải mode chính)
2. Chủ quán dùng smartphone Android/iOS đời gần (≤ 5 năm)
3. Phục vụ/bếp có 1 thiết bị tablet/phone dùng chung
4. Khách hàng OK với SaaS đám mây (sau khi giải thích bảo mật)
5. Quy định HĐĐT VN không thay đổi đột biến trong 12 tháng tới

---

## 10. KPI sản phẩm (đo hằng tuần)

### Activation
- % tài khoản tạo → có bill đầu tiên trong 24h
- Median time-to-first-order

### Engagement
- WAV / MAV (Weekly/Monthly Active Venues)
- Số đơn/venue/ngày
- Số session POS/venue/ngày

### Retention
- Day-1, Day-7, Day-30 retention
- Monthly churn
- Net Revenue Retention

### Quality
- p95 latency POS action
- Crash rate mobile app
- % đơn bị mất khi rớt mạng (mục tiêu 0%)

### Customer satisfaction
- NPS hằng quý
- CSAT sau ticket support
- % ticket giải quyết < 1h

---
*Changelog: v0.1 — 2026-05-01 — bản đầu, sẽ split thành các PRD epic riêng khi vào sprint.*
