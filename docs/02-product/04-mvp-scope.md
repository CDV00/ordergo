# MVP Scope

**Phiên bản**: v0.1
**Ngày target**: phát hành Beta đóng sau **12 tuần** kể từ kickoff
**Đối tượng MVP**: 5 quán cà phê / quán ăn 1 chi nhánh ở SG (design partner)

---

## Triết lý MVP

> "MVP là phiên bản nhỏ nhất mà 1 quán cà phê có thể **dùng thay thế hoàn toàn** phần mềm hiện tại của họ trong 1 ca làm việc, không cần fallback ra giấy."

Không phải "phần mềm có 5 nút". MVP phải **đủ để chạy thật**, không phải đủ để demo.

### Quy tắc cắt scope
- Cắt feature, không cắt chất lượng
- Cắt vertical (chỉ F&B 1 chi nhánh), không cắt kiến trúc multi-tenant (đã có từ đầu để không phải refactor)
- Cắt cấu hình nâng cao, không cắt happy path
- Cắt báo cáo phức tạp, không cắt báo cáo cốt lõi (doanh thu hôm nay)

---

## Phạm vi MUST-HAVE (in scope)

### 1. Identity & Tenant
- Đăng ký tài khoản bằng SĐT + OTP
- Tạo tenant + 1 venue (kiểu F&B)
- Mời nhân viên qua link/SĐT
- 4 role: Owner, Manager, Cashier (thu ngân), Server (phục vụ), Kitchen (bếp)
- Login web + login mobile app

### 2. Menu (F&B)
- CRUD nhóm món, món, biến thể (size, đường, đá)
- Topping
- Set giá theo giờ (vd: happy hour) — **OUT, chuyển v2**
- Hình ảnh món
- Đánh dấu hết món (toggle on/off)
- Import từ Excel (template chuẩn)

### 3. Table
- Cấu hình bàn theo khu (sảnh, sân, lầu)
- Trạng thái bàn: trống / đang dùng / đã đặt / cần dọn
- Ghép bàn, chuyển bàn
- Bố cục đơn giản (list, không drag-drop sơ đồ trong MVP — v2)

### 4. Order
- Tạo đơn cho 1 bàn / takeaway
- Thêm món, sửa số lượng, thêm ghi chú
- Gửi xuống bếp (KDS)
- Bếp xác nhận xong → noti phục vụ
- Hủy đơn (có lý do, audit)
- Sửa đơn sau gửi bếp (manager approve)

### 5. KDS (Kitchen Display)
- Web app riêng cho tablet bếp
- Hiển thị order theo cột: Mới / Đang làm / Sẵn sàng
- Auto-refresh < 1s
- Ưu tiên theo thời gian + ghi chú
- Tap để chuyển trạng thái

### 6. Payment
- Tiền mặt (default)
- Chuyển khoản (hiển thị QR ngân hàng tự sinh — VietQR)
- Ví Momo (qua MoMo Business API)
- Ví VNPay (qua VNPay API)
- Chia bill theo món (split)
- Áp giảm giá %, số tiền cố định, voucher mã

### 7. Print bill
- Tích hợp máy in nhiệt 80mm (Bluetooth)
- Template bill: tên quán, địa chỉ, mã thuế (nếu có), bàn, thời gian, từng món, tổng, mã QR cho HĐĐT (nếu có)
- In duplicate (cho khách + lưu)

### 8. Reporting (cơ bản)
- Dashboard mobile chủ: doanh thu hôm nay, hôm qua, tuần này
- Top 5 món bán chạy
- Số đơn theo giờ (peak hour)
- Lương ca (số đơn × tip mỗi nhân viên)
- Export Excel doanh thu theo ngày

### 9. Shift (Ca làm)
- Mở ca: nhập tiền mặt đầu ca
- Đóng ca: app tổng hợp doanh thu, kiểm tiền mặt thực tế
- Audit lệch ca

### 10. Notification
- Push noti (FCM): đơn mới cho phục vụ, món xong cho phục vụ
- In-app noti
- Email khi đăng ký, reset password (SES/SendGrid mock OK)

### 11. Settings cơ bản
- Tên quán, địa chỉ, logo
- Mã thuế (cho HĐĐT v2)
- Cấu hình máy in
- Đổi mật khẩu, 2FA

### 12. Hoá đơn điện tử (mức "đủ pass thuế")
- Tích hợp **1 nhà cung cấp** (chọn VNPT-Invoice — phổ biến nhất)
- Sinh HĐĐT khi thu xong
- Lưu mã tra cứu
- **Không** làm template tuỳ chỉnh ở MVP

### 13. Web Admin (Next.js đã có)
- Đăng nhập
- Setup wizard
- Quản lý menu, bàn, nhân viên, ca
- Báo cáo cơ bản
- Settings

### 14. Mobile POS (build mới)
- App native cho phục vụ + bếp + thu ngân
- Stack: chốt ở `04-architecture/02-tech-stack.md` (đề xuất React Native hoặc Flutter)
- Offline-first: queue khi mất mạng

---

## Phạm vi NICE-TO-HAVE (cố nếu kịp, không thì v2)

- Thẻ thành viên, tích điểm (Loyalty cơ bản)
- Inventory cơ bản (nhập kho, xuất kho theo món, không có BoM)
- Báo cáo lợi nhuận theo món (cần Inventory)
- Multi-chi nhánh (kiến trúc đã sẵn, UI/UX cần polish)
- Quản lý voucher đầy đủ
- App khách hàng cuối: PWA QR-menu, gọi món không cần phục vụ

## Phạm vi OUT OF SCOPE cho MVP (v2+)

- ❌ Module Khách sạn (PMS, Booking)
- ❌ Channel manager (Booking.com, Agoda)
- ❌ Module Spa, Gym, Edu
- ❌ Inventory với BoM, hao hụt nguyên liệu
- ❌ Báo cáo P&L đầy đủ chuẩn TT200/TT133
- ❌ Marketing (email/SMS/Zalo broadcast)
- ❌ Loyalty với tier, voucher conditions
- ❌ Channel sales đối tác POS hardware
- ❌ Kết nối Grab/ShopeeFood/GoFood
- ❌ Multi-currency (chỉ VND)
- ❌ Multi-language UI (chỉ Tiếng Việt)
- ❌ Sơ đồ bàn drag-drop
- ❌ Public API + marketplace
- ❌ Module Tax đa dạng (VAT 0%, 5%, 8%, 10% — MVP chỉ 8% và 10%)
- ❌ Phân quyền chi tiết theo từng action (RBAC nâng cao)
- ❌ Audit log UI (có log ở DB, chưa có UI)
- ❌ SSO Enterprise

---

## Tiêu chí "MVP-Ready" (Definition of Done cho MVP)

MVP coi như sẵn sàng khi đồng thời:

- [ ] 5 design partner đã dùng full 1 ca làm việc không lỗi nghiêm trọng
- [ ] Median time-to-first-order < 30 phút (test với 5 quán mới)
- [ ] Latency p95 POS action < 500ms (đo từ đăng ký 5 venues thật)
- [ ] Crash-free rate mobile app ≥ 99.5%
- [ ] Có backup tự động + recovery test thành công
- [ ] HĐĐT sinh thật từ VNPT, gửi cơ quan thuế thành công
- [ ] Có tài liệu user (video onboarding 5 phút + FAQ 20 câu)
- [ ] Pricing page công khai
- [ ] Privacy policy + Terms of service có
- [ ] Đã pass smoke test giờ peak (50 đơn/giờ × 5 venues = 250 đơn/giờ)

---

## Estimate effort

> **Lưu ý**: estimate giả định team 2 BE senior + 1 FE senior + 1 mobile + 1 designer + 1 PM/founder làm full-time.

| Sprint | Tuần | Nội dung | Output |
| --- | --- | --- | --- |
| S1 | 1–2 | Setup hạ tầng, schema, Identity, Tenant | Đăng ký + login chạy được |
| S2 | 3–4 | Menu, Table, Settings cơ bản | Setup được 1 quán đầy đủ |
| S3 | 5–6 | Order, KDS, Realtime | Phục vụ → bếp e2e chạy |
| S4 | 7–8 | Payment + In bill + HĐĐT (mock + 1 đối tác) | Bill ra giấy + HĐĐT |
| S5 | 9–10 | Reporting + Shift + Mobile dashboard | Chủ thấy doanh thu mobile |
| S6 | 11–12 | Polish, offline mode, beta đóng với 5 partner | Beta launch |

---

## Risk & contingency

- Nếu HĐĐT integration chậm hơn 2 tuần → ship MVP **không có HĐĐT real**, chỉ mock + cảnh báo "đang tích hợp" — design partner OK vì họ không yêu cầu xuất HĐĐT mỗi đơn (đa số dùng trên 1tr mới xuất)
- Nếu mobile POS chậm hơn 2 tuần → ship Web POS responsive đầu tiên (cùng codebase Next.js), mobile native v2
- Nếu offline mode khó hơn dự kiến → ship online-only đầu, offline ở v2 sau khi đã PMF cơ bản

---

## Câu hỏi cần chốt trước kickoff

- [ ] Stack mobile: React Native hay Flutter? → quyết định ở `04-architecture/02-tech-stack.md`
- [x] Backend: **chốt NestJS + MongoDB** (`ordergo-api`), dừng `ordergo-api-v2` (.NET) — 2026-11-09
- [x] DB: **MongoDB** (theo backend NestJS) — xem `08-database/`
- [ ] Hosting: tự host VPS hay cloud (AWS/GCP/DO)? → khuyến nghị DigitalOcean (cost) hoặc AWS (mature)
- [ ] HĐĐT đối tác: VNPT, Viettel hay MISA? → recommend VNPT (volume lớn, doc dễ)

---
*Changelog: v0.1 — 2026-05-01 — bản đầu, cần chốt sau buổi kickoff team.*
