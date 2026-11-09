# Feature Catalog

> Liệt kê **đầy đủ** mọi feature OrderGo dự kiến cung cấp, gắn với module, vertical, version. Đây là **catalog**, không phải roadmap (roadmap ở `05-roadmap/`). Khi có yêu cầu mới, thêm vào đây trước, sau đó PM ưu tiên hoá vào sprint.

## Cách đọc

- **MVP** = phải có cho beta đóng (12 tuần)
- **v1** = năm 1 sau MVP (tháng 4–12)
- **v2** = năm 2 (mở Hospitality)
- **v3+** = năm 3+ (mở thêm vertical, marketplace, quốc tế)
- **🟢** đã có (trong code v2 hoặc v1) | **🟡** đang làm | **🔵** plan | **⚪** ý tưởng

---

## A. Identity, Tenant, RBAC

| ID | Feature | Module | Persona | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| A1 | Đăng ký bằng SĐT + OTP | Identity | B1, B2 | MVP | 🔵 |
| A2 | Đăng ký bằng email | Identity | B3 | v1 | 🔵 |
| A3 | Login với SSO (Google) | Identity | B2, B3 | v1 | 🔵 |
| A4 | SSO doanh nghiệp (SAML/OIDC) | Identity | Enterprise | v3 | ⚪ |
| A5 | 2FA (TOTP) | Identity | tất cả | v1 | 🔵 |
| A6 | Tạo tenant + venue đầu | Tenant | B1 | MVP | 🔵 |
| A7 | Multi-venue dưới 1 tenant | Tenant | B2, B3 | MVP* (kiến trúc) / v1 (UI) | 🟡 |
| A8 | Multi-vertical (F&B + Hotel + ...) trong 1 tenant | Tenant | B3 | v2 | 🔵 |
| A9 | Mời nhân viên qua link | Identity | tất cả | MVP | 🔵 |
| A10 | RBAC role chuẩn (5 role MVP) | RBAC | tất cả | MVP | 🔵 |
| A11 | RBAC custom role | RBAC | B2, B3 | v1 | 🔵 |
| A12 | RBAC theo từng action (granular) | RBAC | Enterprise | v2 | 🔵 |
| A13 | Audit log (DB) | Security | Compliance | MVP | 🔵 |
| A14 | Audit log UI tra cứu | Security | B2, B3, kế toán | v1 | 🔵 |
| A15 | Đặt lại mật khẩu | Identity | tất cả | MVP | 🔵 |

---

## B. Menu (F&B)

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| B1 | CRUD nhóm món, món | MVP | 🔵 |
| B2 | Biến thể (size, đường, đá...) | MVP | 🔵 |
| B3 | Topping | MVP | 🔵 |
| B4 | Hình ảnh món | MVP | 🔵 |
| B5 | Toggle "hết món" tức thì | MVP | 🔵 |
| B6 | Import menu từ Excel | MVP | 🔵 |
| B7 | Import menu từ ảnh (OCR) | v1 | ⚪ |
| B8 | Set giá theo giờ (happy hour) | v1 | 🔵 |
| B9 | Set giá theo cơ sở (giá khác chi nhánh khác) | v1 | 🔵 |
| B10 | Combo / set menu | v1 | 🔵 |
| B11 | Voucher mã (discount code) | v1 | 🔵 |
| B12 | Lịch sử đổi giá (audit) | v2 | 🔵 |
| B13 | Recipe / Bill of Materials (định mức nguyên liệu) | v2 | 🔵 |
| B14 | Đề xuất giá tối ưu (AI) | v3 | ⚪ |

---

## C. Table & Order (F&B)

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| C1 | Cấu hình bàn theo khu | MVP | 🔵 |
| C2 | Trạng thái bàn (4 trạng thái) | MVP | 🔵 |
| C3 | Ghép bàn / chuyển bàn | MVP | 🔵 |
| C4 | Tạo đơn cho bàn / takeaway / delivery | MVP | 🔵 |
| C5 | Sửa đơn (manager approve) | MVP | 🔵 |
| C6 | Hủy đơn (lý do) | MVP | 🔵 |
| C7 | Split bill theo món / theo người | MVP | 🔵 |
| C8 | Gộp đơn nhiều bàn | v1 | 🔵 |
| C9 | Đơn online (qua QR menu khách tự gọi) | v1 | 🔵 |
| C10 | Sơ đồ bàn drag-drop | v1 | 🔵 |
| C11 | Đặt bàn trước (reservation) | v2 | 🔵 |
| C12 | Đơn pre-order (gọi trước, đến lấy) | v2 | 🔵 |
| C13 | Đơn từ Grab/ShopeeFood/GoFood (hợp nhất) | v2 | 🔵 |

---

## D. KDS — Kitchen Display

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| D1 | KDS web app cho tablet | MVP | 🔵 |
| D2 | Cột trạng thái: Mới / Đang làm / Sẵn sàng | MVP | 🔵 |
| D3 | Realtime < 1s | MVP | 🔵 |
| D4 | Âm thanh khi có đơn mới | MVP | 🔵 |
| D5 | Ưu tiên VIP / khách chờ lâu | v1 | 🔵 |
| D6 | Đo thời gian chế biến trung bình mỗi món | v1 | 🔵 |
| D7 | Phân chia trạm bếp (lạnh/nóng/nướng/pha chế) | v1 | 🔵 |
| D8 | KDS cho bếp trung tâm (chuỗi) | v2 | 🔵 |

---

## E. Payment

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| E1 | Thu tiền mặt | MVP | 🔵 |
| E2 | Chuyển khoản qua VietQR | MVP | 🔵 |
| E3 | Momo Business API | MVP | 🔵 |
| E4 | VNPay QR | MVP | 🔵 |
| E5 | ZaloPay | v1 | 🔵 |
| E6 | Thẻ POS (qua đối tác Smart POS Sunmi/iMin) | v1 | 🔵 |
| E7 | Partial payment / split payment | MVP | 🔵 |
| E8 | Hoàn tiền | v1 | 🔵 |
| E9 | Phí phụ (10% phục vụ, VAT) | MVP | 🔵 |
| E10 | Auto reconcile với ngân hàng | v2 | 🔵 |
| E11 | Trả góp (Kredivo, MoMo Trả Sau) | v2 | ⚪ |

---

## F. E-Invoice (HĐĐT)

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| F1 | Tích hợp VNPT-Invoice | MVP | 🔵 |
| F2 | Auto-generate khi thu xong | MVP | 🔵 |
| F3 | Tra cứu, gửi lại email | MVP | 🔵 |
| F4 | Tích hợp Viettel-Sinvoice (lựa chọn) | v1 | 🔵 |
| F5 | Tích hợp MISA-MeInvoice | v1 | 🔵 |
| F6 | Template tuỳ chỉnh | v1 | 🔵 |
| F7 | Hoá đơn điều chỉnh / huỷ | v1 | 🔵 |
| F8 | Báo cáo tổng hợp HĐĐT | v1 | 🔵 |

---

## G. Inventory

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| G1 | Nhập kho cơ bản | v1 | 🔵 |
| G2 | Tồn kho theo cơ sở | v1 | 🔵 |
| G3 | BoM — định mức nguyên liệu mỗi món | v2 | 🔵 |
| G4 | Trừ kho tự động khi bán | v2 | 🔵 |
| G5 | Cảnh báo dưới ngưỡng | v1 | 🔵 |
| G6 | Kiểm kê (stock count) | v2 | 🔵 |
| G7 | Hao hụt + lý do | v2 | 🔵 |
| G8 | Chuyển kho giữa chi nhánh | v2 | 🔵 |
| G9 | Bếp trung tâm — quản lý cấp phát | v2 | 🔵 |
| G10 | Đặt hàng nhà cung cấp tự động | v3 | ⚪ |

---

## H. Customer & Loyalty

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| H1 | Hồ sơ khách hàng (SĐT, tên, sinh nhật) | MVP | 🔵 |
| H2 | Lịch sử đơn của khách | MVP | 🔵 |
| H3 | Thẻ thành viên cơ bản (tích điểm 1đ = X điểm) | v1 | 🔵 |
| H4 | Tier (Đồng/Bạc/Vàng/Bạch Kim) | v1 | 🔵 |
| H5 | Voucher cá nhân hoá | v1 | 🔵 |
| H6 | Loyalty cross-vertical (uống cà phê + ở homestay cùng chuỗi) | v2 | 🔵 |
| H7 | Sinh nhật auto voucher | v1 | 🔵 |
| H8 | Customer segmentation (RFM) | v2 | 🔵 |
| H9 | Referral khách giới thiệu khách | v2 | 🔵 |

---

## I. Reporting & Analytics

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| I1 | Dashboard mobile chủ (today, yesterday, week) | MVP | 🔵 |
| I2 | Top 5 món bán chạy | MVP | 🔵 |
| I3 | Số đơn theo giờ peak | MVP | 🔵 |
| I4 | Doanh thu theo nhân viên | MVP | 🔵 |
| I5 | Export Excel doanh thu ngày | MVP | 🔵 |
| I6 | So sánh chi nhánh | v1 | 🔵 |
| I7 | So sánh kỳ trước (% thay đổi) | v1 | 🔵 |
| I8 | Lợi nhuận theo món (cần Inventory + BoM) | v2 | 🔵 |
| I9 | P&L hợp nhất theo entity | v2 | 🔵 |
| I10 | Báo cáo tự gửi email theo lịch | v1 | 🔵 |
| I11 | Custom report builder | v3 | ⚪ |
| I12 | Benchmark cohort (so với cohort cùng quy mô) | v3 | ⚪ |

---

## J. Shift & Cashier

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| J1 | Mở ca: nhập tiền mặt đầu | MVP | 🔵 |
| J2 | Đóng ca: tổng hợp + kiểm tiền | MVP | 🔵 |
| J3 | Audit lệch ca | MVP | 🔵 |
| J4 | Phân ca (lịch làm) | v1 | 🔵 |
| J5 | Chấm công | v2 | 🔵 |
| J6 | Tính lương theo ca + tip | v2 | 🔵 |

---

## K. Notification

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| K1 | Push noti (FCM) | MVP | 🔵 |
| K2 | In-app noti | MVP | 🔵 |
| K3 | Email transactional | MVP | 🔵 |
| K4 | SMS (qua ESMS) | v1 | 🔵 |
| K5 | Zalo OA | v1 | 🔵 |
| K6 | Marketing broadcast (segment + scheduled) | v2 | 🔵 |

---

## L. Settings & Hardware

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| L1 | Máy in nhiệt 80mm Bluetooth | MVP | 🔵 |
| L2 | Máy in nhiệt USB/LAN | v1 | 🔵 |
| L3 | Két tiền | v1 | 🔵 |
| L4 | Quét mã vạch | v1 | 🔵 |
| L5 | Cân điện tử | v2 | 🔵 |
| L6 | Customer display (màn hình phụ cho khách thấy) | v2 | 🔵 |
| L7 | Self-checkout kiosk | v3 | ⚪ |

---

## M. Hospitality (Vertical Khách sạn — v2)

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| M1 | Cấu hình loại phòng + giá | v2 | 🔵 |
| M2 | Sơ đồ tầng phòng | v2 | 🔵 |
| M3 | Đặt phòng walk-in | v2 | 🔵 |
| M4 | Đặt phòng có cọc | v2 | 🔵 |
| M5 | Check-in / check-out | v2 | 🔵 |
| M6 | Quét CMND/Passport (OCR) | v2 | 🔵 |
| M7 | Mini-bar charge | v2 | 🔵 |
| M8 | Cross-charge: F&B của nhà hàng cùng cơ sở vào bill phòng | v2 | 🔵 |
| M9 | Channel Manager: Booking.com sync | v2 | 🔵 |
| M10 | Channel Manager: Agoda sync | v2 | 🔵 |
| M11 | Channel Manager: Traveloka sync | v2 | 🔵 |
| M12 | Housekeeping status | v2 | 🔵 |
| M13 | Báo cáo occupancy, RevPAR, ADR | v2 | 🔵 |
| M14 | Multi-property (chuỗi khách sạn) | v3 | 🔵 |
| M15 | Revenue management AI | v3 | ⚪ |

---

## N. Open API & Marketplace

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| N1 | API Key cho tenant | v1 | 🔵 |
| N2 | REST API cốt lõi (Order, Customer, Menu) | v1 | 🔵 |
| N3 | Webhook | v1 | 🔵 |
| N4 | Rate limiting | v1 | 🔵 |
| N5 | Developer portal | v2 | 🔵 |
| N6 | OAuth cho 3rd-party | v2 | 🔵 |
| N7 | Marketplace UI (app store) | v3 | 🔵 |
| N8 | SDK for vertical builders | v3 | ⚪ |

---

## O. Mobile App (POS)

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| O1 | App phục vụ — order | MVP | 🔵 |
| O2 | App bếp (KDS) | MVP | 🔵 |
| O3 | App thu ngân — thu tiền + in bill | MVP | 🔵 |
| O4 | App chủ — dashboard | MVP | 🔵 |
| O5 | Offline-first queue | MVP | 🔵 |
| O6 | App lễ tân Khách sạn | v2 | 🔵 |
| O7 | App housekeeping | v2 | 🔵 |
| O8 | Multi-language UI | v2 | 🔵 |

---

## P. Compliance & Security

| ID | Feature | Phase | Status |
| --- | --- | --- | --- |
| P1 | TLS 1.3 | MVP | 🔵 |
| P2 | Encryption at-rest cho field nhạy cảm | MVP | 🔵 |
| P3 | Privacy policy, ToS | MVP | 🔵 |
| P4 | NĐ 13/2023 PDPL — opt-in, right to erase | v1 | 🔵 |
| P5 | Lưu data tại VN cho khách regulated | v1 | 🔵 |
| P6 | Pen test | v1 | 🔵 |
| P7 | SOC 2 readiness | v2 | ⚪ |
| P8 | ISO 27001 | v3 | ⚪ |

---

## Q. Vertical mới (v3+)

| Vertical | Module riêng | Module overlap với core |
| --- | --- | --- |
| **Spa & Salon** | Booking dịch vụ, kỹ thuật viên, packages | Identity, Customer, Order, Payment, Loyalty, Reporting |
| **Gym & Yoga** | Membership, lịch lớp, check-in QR | Identity, Customer, Payment, Reporting |
| **Trung tâm dạy học** | Học viên, lớp học, lịch học, bài tập | Identity, Customer, Payment, Reporting |
| **Co-working** | Booking phòng, hot desk | Identity, Customer, Order, Payment, Reporting |
| **Phòng khám/Nha khoa** | Bệnh án, lịch hẹn, kê đơn | Identity, Customer, Payment, Reporting (tuân thủ y tế cao) |

---
*Changelog: v0.1 — 2026-05-01 — phiên bản đầu, sẽ cập nhật khi có yêu cầu mới.*
