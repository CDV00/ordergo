# Milestones

> Milestone = mốc có **demo được + đo được**. Khác với "task xong". Mỗi milestone là cơ hội communicate với stakeholder và đầu tư.

## Milestone matrix

| ID | Milestone | Tuần | Done = | Stakeholder demo |
| --- | --- | --- | --- | --- |
| **M0** | Kickoff | 0 | Team đủ, doc nền tảng done, stack chốt | Founder, advisors |
| **M1** | First login | 4 | User đăng ký, login, tạo tenant + venue | Internal |
| **M2** | First menu setup | 6 | 1 tenant nhập đầy đủ menu qua web | 5 design partner |
| **M3** | First order E2E | 8 | Phục vụ → KDS → Done — không lỗi | 5 partner — pilot test |
| **M4** | First payment + bill | 10 | Thu Cash + VietQR + in bill ra giấy | 5 partner |
| **M5** | **Beta đóng GA** | 12 | 5 venue dùng thật 1 ca | Public LinkedIn post |
| **M6** | First HĐĐT thật | 14 | Gửi cơ quan thuế thành công | Khách + cố vấn pháp lý |
| **M7** | Multi-chi nhánh | 18 | 1 chuỗi 3 venue dùng dashboard tổng | Chuỗi partner |
| **M8** | **Beta mở** | 24 | Self-signup, 30 venue active | Press release |
| **M9** | First paid customer | 26 | Có khách trả tiền (sau trial) | Founder/Sales |
| **M10** | API public v1 | 36 | 1 partner integrate qua API | Developer day demo |
| **M11** | **100 venues** | 40 | WAV ≥ 100 | Investor update |
| **M12** | **300 venues + MRR 50tr** | 52 | KPI year 1 | Series A pitch |
| **M13** | Hospitality alpha | 60 | 1 homestay dùng thử | Partner demo |
| **M14** | Hospitality GA | 72 | Module Hotel public | Conf Hospitality VN |
| **M15** | Cross-vertical first customer | 78 | Anh Khải (B3) dùng F&B + Hotel chung | Case study |
| **M16** | **1.500 WAV** | 96 | KPI year 2 | Series A close |

---

## Milestone definitions chi tiết

### M0 — Kickoff
**Done khi**:
- [ ] Tài liệu `docs/` review xong
- [ ] Stack final chốt (Postgres confirmed, RN confirmed)
- [ ] 2 BE + 1 FE + 1 mobile + 1 designer ký offer
- [ ] Repository setup: backend, web, mobile có CI/CD
- [ ] Staging environment up

### M1 — First login
**Done khi**:
- [ ] User register qua SĐT + OTP thành công
- [ ] Login → JWT trả về
- [ ] Tạo tenant + venue qua wizard
- [ ] Mời 1 nhân viên qua link, nhân viên login được
- [ ] Tested: 2 tenant không cross-data

### M2 — First menu setup
**Done khi**:
- [ ] Owner CRUD nhóm món, món, biến thể, topping
- [ ] Upload ảnh món
- [ ] Toggle "hết món"
- [ ] Import 50 món từ Excel template
- [ ] Pass test: setup từ 0 đến menu hoàn chỉnh < 30 phút (timer)

### M3 — First order E2E
**Done khi**:
- [ ] Phục vụ tạo order trên web (mobile sẽ ở M5)
- [ ] Order gửi xuống KDS, hiển thị < 1s
- [ ] Bếp đánh "sẵn sàng" → phục vụ noti
- [ ] Phục vụ đánh "đã giao"
- [ ] Order list hiển thị history
- [ ] Cancel + sửa order với manager approve

### M4 — First payment + bill
**Done khi**:
- [ ] Thu Cash workflow xong
- [ ] VietQR sinh đúng, scan thử bằng app banking thành công
- [ ] Momo Business sandbox thành công
- [ ] In bill 80mm Bluetooth printer
- [ ] Bill có đầy đủ thông tin (template chuẩn)
- [ ] Audit log payment

### M5 — Beta đóng GA — **MILESTONE QUAN TRỌNG**
**Done khi**:
- [ ] 5 venue partner ký NDA, deploy thật
- [ ] Mỗi venue chạy ≥ 1 ca làm việc không fallback giấy
- [ ] No critical bug 7 ngày
- [ ] Time-to-first-order < 30 phút (median)
- [ ] Team có quy trình daily feedback từ partner
- [ ] Founder không phải đến quán fix bug trực tiếp

**Demo**:
- Public post: "OrderGo bắt đầu beta đóng — 5 quán đầu tiên đang dùng"
- Video case study 1 quán

### M6 — First HĐĐT thật
**Done khi**:
- [ ] Tích hợp VNPT-Invoice production
- [ ] Sinh + ký + gửi cơ quan thuế thành công
- [ ] Tra cứu được trên portal VNPT
- [ ] Có code lookup, có thể gửi email khách
- [ ] Báo cáo HĐĐT theo ngày/tháng

### M7 — Multi-chi nhánh
**Done khi**:
- [ ] 1 tenant có 3 venue, share menu (hoặc khác)
- [ ] Web Admin: switch venue dropdown
- [ ] Dashboard tổng so sánh 3 venue
- [ ] Mobile chủ thấy 3 venue trong app

### M8 — Beta mở — **MILESTONE QUAN TRỌNG**
**Done khi**:
- [ ] Self-signup không cần founder
- [ ] Onboarding tutorial + video
- [ ] Pricing page công khai
- [ ] 30 venue active (15 partner + 15 mới qua organic)
- [ ] Sean Ellis test ≥ 40%
- [ ] Status page công khai (uptime)

**Demo**:
- Press release / TechInAsia VN
- Mở đăng ký rộng rãi

### M9 — First paid customer
**Done khi**:
- [ ] 1 khách upgrade từ Free → Starter sau trial
- [ ] Billing flow hoạt động (manual ban đầu, sau auto)
- [ ] Receipt, invoice cho khách
- [ ] Refund process

### M10 — API public v1
**Done khi**:
- [ ] Khách tạo API key trong Settings
- [ ] OpenAPI doc public ở `developer.ordergo.vn`
- [ ] 1 partner (kế toán/giao hàng) integrate thành công
- [ ] Webhook fanout test pass

### M11 — 100 venues — **MILESTONE QUAN TRỌNG**
**Done khi**:
- [ ] WAV ≥ 100 (không phải tổng đăng ký)
- [ ] Churn tháng < 8%
- [ ] CAC < 1.5tr/khách
- [ ] Có 5 case study + 3 video chủ quán
- [ ] Báo cáo gửi advisors/investors

### M12 — 300 venues + MRR 50tr — **YEAR 1 SUCCESS**
**Done khi**:
- [ ] WAV ≥ 300
- [ ] MRR ≥ 50tr
- [ ] NPS ≥ 50
- [ ] LTV/CAC ≥ 5x
- [ ] Sẵn sàng pitch Series A

### M13 — Hospitality alpha
**Done khi**:
- [ ] Module Catalog.Hotel xong (Room, RoomType, RatePlan)
- [ ] Module Booking cơ bản (walk-in, deposit, check-in/out)
- [ ] 1 homestay deploy alpha test
- [ ] Workflow lễ tân E2E

### M14 — Hospitality GA
**Done khi**:
- [ ] Channel Manager: Booking.com sync
- [ ] Housekeeping module
- [ ] Báo cáo Occupancy/ADR/RevPAR
- [ ] 10 venue Hotel beta

### M15 — Cross-vertical first customer
**Done khi**:
- [ ] Khách B3 (đa vertical) dùng F&B + Hotel cùng tenant
- [ ] Loyalty cross-vertical hoạt động
- [ ] Báo cáo hợp nhất

**Demo**:
- Case study video — đây là điểm "moat" thật
- Public conference: VN Hospitality Summit

### M16 — 1.500 WAV — **YEAR 2 SUCCESS**
**Done khi**:
- [ ] WAV ≥ 1.500
- [ ] MRR ≥ 400tr
- [ ] 30% khách multi-venue
- [ ] 10% khách multi-vertical
- [ ] Series A close

---

## Cách dùng milestone

1. **Mỗi sprint planning** → check milestone tiếp theo, ưu tiên work liên quan
2. **Mỗi sprint review** → demo cho stakeholder cập nhật progress
3. **Khi miss milestone** → root cause analysis, không adjust target ngầm
4. **Khi đạt milestone "QUAN TRỌNG"** → công khai (nội bộ + bên ngoài), tạo momentum

## Anti-pattern

- ❌ Milestone "complete X feature" — phải là "X user làm được Y với metric Z"
- ❌ Milestone không demo được — không phải milestone, là task
- ❌ Đẩy milestone sang sau khi miss → đếm số lần miss, sau 2 lần là vấn đề kế hoạch

---
*Changelog: v0.1 — 2026-05-01.*
