# Roadmap 12 tháng

> Bắt đầu mốc T0 = ngày kickoff team đầy đủ. Ngày cụ thể sẽ điền sau khi hire xong.

## Bốn quý — Bốn tựa

| Quý | Tên | Output | Mục tiêu cốt lõi |
| --- | --- | --- | --- |
| **Q1** | Foundation | Hạ tầng + MVP backend + 5 design partner | Có thể cho 1 quán dùng thử |
| **Q2** | Beta đóng | Mobile POS + KDS + Real-time + 10 venue thật | PMF tín hiệu rõ |
| **Q3** | Beta mở | Multi-chi nhánh + HĐĐT đầy đủ + 100 venue | MRR đầu tiên |
| **Q4** | Scale | Loyalty + API + Marketing + 300 venue | Validate unit economics |

---

## Q1 — Foundation (tháng 0–3)

### Sprint 0 (tuần 1–2) — Setup
- [ ] Hire dev + designer + PM (đã có founder)
- [ ] Decide stack final (Postgres, .NET 8, RN/Flutter mobile)
- [ ] Sửa `Program.cs` bug + migrate SQL Server → Postgres
- [ ] Bỏ codebase NestJS `ordergo-api`
- [ ] Setup CI/CD GitHub Actions
- [ ] Setup staging environment (DigitalOcean Droplet)
- [ ] Setup observability (Sentry + Grafana free tier)
- [ ] Tạo design system base (Figma + Tailwind tokens)
- [ ] Tạo 30 wireframe cho MVP screens
- [ ] Phỏng vấn 30 chủc quán (jobs-to-be-done)

### Sprint 1–2 (tuần 3–6) — Identity, Tenant, Catalog
- [ ] Identity module: register/login/JWT/refresh
- [ ] Tenant + Venue + Membership + RBAC core
- [ ] Catalog.FB module: Menu, MenuItem, Variant, Topping
- [ ] Web Admin: Setup wizard, login, menu CRUD
- [ ] **Demo**: tạo tài khoản, setup quán, nhập menu — cho 5 partner xem

### Sprint 3 (tuần 7–8) — Order + KDS
- [ ] Order module: create, update, cancel, send-to-kitchen
- [ ] Realtime SignalR
- [ ] KDS web app
- [ ] Web Admin: Tables, Order list

### Sprint 4 (tuần 9–10) — Payment + Print + HĐĐT mock
- [ ] Payment: Cash + VietQR + Momo
- [ ] In bill template + Bluetooth printer adapter
- [ ] HĐĐT mock (UI, chưa tích hợp thật)
- [ ] Reporting: dashboard hôm nay

### Sprint 5–6 (tuần 11–12) — Mobile POS + Beta đóng
- [ ] Mobile POS app (RN): order screen, table, KDS, dashboard
- [ ] Offline queue
- [ ] 5 design partner deploy thật
- [ ] Bug fix marathon
- [ ] **Milestone Q1**: Beta đóng GA cho 5 venue

### Q1 KPI
- 5 venue dùng thật, không fallback giấy
- Time-to-first-order < 1 giờ
- 3 case study video
- Pricing test 1 (299k vs 499k)

---

## Q2 — Beta đóng + iterate (tháng 3–6)

### Tháng 4 — Polish + thêm 5 partner

- [ ] HĐĐT thật với VNPT (E2E test với cơ quan thuế)
- [ ] Shift module (mở/đóng ca)
- [ ] Inventory cơ bản (nhập kho, cảnh báo dưới ngưỡng)
- [ ] Customer module cơ bản (hồ sơ + lịch sử đơn)
- [ ] Mobile dashboard chủ
- [ ] Onboarding wizard tự service (giảm cần Founder onboard)
- [ ] Tăng partner lên 10

### Tháng 5 — Multi-chi nhánh

- [ ] Multi-venue UI: switch venue, dashboard tổng
- [ ] Clone settings từ venue mẫu
- [ ] So sánh chi nhánh
- [ ] Migration tool import từ Excel/CSV

### Tháng 6 — Beta đóng → mở

- [ ] Pricing page công khai
- [ ] Self-service signup (không cần founder)
- [ ] Đăng ký thử nghiệm 14 ngày miễn phí
- [ ] Tự động email nurture flow
- [ ] **Milestone Q2**: 30 venue active, NPS ≥ 40

---

## Q3 — Beta mở + monetize (tháng 6–9)

### Tháng 7 — Mở public + content engine

- [ ] Mở đăng ký Free + Starter + Pro
- [ ] Sales site (ordergo.vn) đầy đủ
- [ ] Blog 2 bài/tuần (SEO)
- [ ] YouTube channel — 1 video/tuần
- [ ] TikTok page — 3 video/tuần
- [ ] Referral program

### Tháng 8 — Loyalty + Voucher

- [ ] Loyalty cơ bản: tích điểm, tier
- [ ] Voucher / promo code
- [ ] Sinh nhật auto voucher
- [ ] Customer segmentation cơ bản

### Tháng 9 — API + Webhook

- [ ] Public API key
- [ ] REST API: Order, Customer, Menu read
- [ ] Webhook subscription
- [ ] Developer docs (`developer.ordergo.vn`)
- [ ] **Milestone Q3**: 100 venue active, MRR 30tr

---

## Q4 — Scale + chuẩn bị Hospitality (tháng 9–12)

### Tháng 10 — Marketing module + paid ads

- [ ] Marketing broadcast (email/SMS/Zalo)
- [ ] Campaign builder
- [ ] Bắt đầu paid ads test (FB, TikTok, Google)
- [ ] Sales playbook + 1 inside sales

### Tháng 11 — Inventory nâng cao + Recipe

- [ ] BoM (định mức nguyên liệu)
- [ ] Trừ kho tự động khi bán
- [ ] Báo cáo lợi nhuận theo món
- [ ] Multi-location stock transfer

### Tháng 12 — Polish + chuẩn bị Hospitality

- [ ] Performance optimization (đạt p95 < 300ms)
- [ ] Security audit + pen test 1
- [ ] Compliance NĐ 13 audit
- [ ] **Hospitality module spike** — 4 tuần research + prototype Booking, Room
- [ ] **Milestone Q4**: 300 venue active, MRR 50tr, NPS ≥ 50

---

## Năm 2 (tháng 12–24) — Hospitality launch

### Tháng 13–15 — Hospitality MVP
- Module Catalog.Hotel (RoomType, Room, RatePlan)
- Module Booking (walk-in, online, deposit)
- Check-in/out flow
- Channel Manager: Booking.com integration
- 5 design partner Hospitality

### Tháng 16–18 — Hospitality scale
- Channel Manager: Agoda + Traveloka
- Housekeeping module
- Báo cáo Occupancy/RevPAR
- 100 venue Hotel

### Tháng 19–24 — Cross-vertical play
- Loyalty cross-vertical
- Báo cáo hợp nhất multi-vertical
- Marketplace API portal v1
- Series A fundraising
- Đại lý channel ở 5 thành phố

### Năm 2 KPI target
- 1.500 WAV (1.000 F&B + 500 Hotel)
- MRR 400tr
- NPS ≥ 55
- 30+ active partner & integrations

---

## Năm 3 (tháng 24–36) — Đông Nam Á + Multi-vertical

- Spa & Salon module
- Gym module
- Localize Indonesia hoặc Thailand
- Marketplace App Store
- 5.000 WAV
- ARR 5 triệu USD

---

## Visualization roadmap

```
Q1 ──Foundation──▶ Q2 ──Beta đóng──▶ Q3 ──Beta mở──▶ Q4 ──Scale──▶ Y2 ──Hospitality──▶ Y3 ──SEA──▶
│                  │                 │               │              │                   │
5 venue          30 venue         100 venue       300 venue      1.500 WAV          5.000 WAV
0 MRR            0 MRR            30tr MRR        50tr MRR       400tr MRR          1.5tr USD/tháng
```

---

## Nguyên tắc planning

1. **Cam kết theo quý, tin theo sprint**: kế hoạch quý là direction, sprint là cam kết
2. **80/20 capacity**: 80% sprint plan + 20% buffer cho bug, support, cơ hội
3. **Không mở vertical mới khi vertical hiện tại < 300 WAV ổn định 3 tháng**
4. **Sản phẩm giá trị thật > số lượng feature** — kill feature không di chuyển metric

---

## Câu hỏi định kỳ

Đầu mỗi quý, hỏi:
- [ ] WAV/MRR có đạt target quý trước không? Nếu không, tại sao?
- [ ] Có feature nào ship mà không di chuyển metric? Kill nó.
- [ ] Có vertical/module nào team đang spend > 20% effort mà không có demand thật?
- [ ] Khách hàng đang phản hồi nỗi đau gì lặp đi lặp lại? (Top 3)
- [ ] Đối thủ ship gì mới? (top 3)
- [ ] Burn rate so với raise plan?

---
*Changelog: v0.1 — 2026-05-01.*
