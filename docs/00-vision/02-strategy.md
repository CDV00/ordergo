# Chiến lược đa vertical

## Nguyên tắc thiết kế chiến lược

1. **Win F&B trước, vertical khác sau.** Một sản phẩm tốt cho 1 vertical đáng giá hơn một sản phẩm trung bình cho 5 vertical. Mỗi vertical mới chỉ mở khi F&B đạt traction (≥ 300 venues active).
2. **Một code base — nhiều vertical.** Các vertical chia sẻ ~70% module chung (Identity, Order, Payment, Inventory, Reporting, Customer, Notification). 30% còn lại là module đặc thù (Table & Kitchen cho F&B; Room & Booking cho Khách sạn; Class & Schedule cho Spa/Gym/Edu).
3. **Modular monolith, không micro-services sớm.** Mỗi vertical = một plugin module trong cùng 1 host (.NET 8). Khi 1 vertical lớn lên đủ tải, mới tách ra thành service riêng.
4. **Mobile-first cho người vận hành, web-first cho chủ.** Phục vụ/bếp/lễ tân dùng mobile/tablet. Chủ và kế toán dùng web để xem báo cáo, cấu hình.
5. **VN-first, nhưng kiến trúc i18n từ đầu.** Để 2 năm sau ra Đông Nam Á không phải viết lại.

## Lộ trình mở rộng vertical

```
Năm 1                   Năm 2                   Năm 3+
├── F&B (Restaurant)    ├── Hotel/Homestay       ├── Spa & Salon
│   ├── POS              │   ├── PMS              │   ├── Booking
│   ├── KDS (kitchen)    │   ├── Channel Mgr      │   ├── Customer card
│   ├── Inventory        │   ├── Housekeeping     │   └── Loyalty
│   └── Reporting        │   └── Reporting        ├── Gym/Yoga
│                        │                        ├── Education center
│                        │                        └── Co-working
```

## Vì sao chọn F&B trước

- **Thị trường lớn nhất, đau nhất**: ~350.000 nhà hàng/quán cà phê đăng ký kinh doanh tại VN; tỉ lệ đóng cửa cao → cần phần mềm gấp.
- **Decision cycle ngắn**: chủ quán quyết mua trong 1–2 tuần, không như khách sạn/enterprise mất 3–6 tháng.
- **ARPU đủ trang trải**: 300k–1.5tr/tháng/cơ sở, trung bình 500k.
- **Có sẵn 60% code v2 đang scaffold cho F&B** (Module Menu, Order, Notify đã khởi tạo).
- **F&B là "gateway drug"**: chủ chuỗi cà phê thường mở thêm homestay, không gian co-working, salon → bán cross-vertical dễ.

## Vì sao Khách sạn là vertical thứ 2

- **Customer overlap cao**: ~30% chủ chuỗi F&B ở các thành phố du lịch (Đà Lạt, Đà Nẵng, Phú Quốc, Hội An) cũng có homestay/khách sạn nhỏ.
- **ARPU cao hơn F&B** (1–5tr/tháng/cơ sở), bù churn.
- **Module overlap lớn**: Identity, Customer, Payment, Reporting, Notification dùng chung 90%. Chỉ thêm Room/Booking/Housekeeping.
- **Đối thủ chuyên Khách sạn (ezCloud, Smile Hotel) ít đầu tư mobile/UI hiện đại** — cơ hội đánh bằng UX.

## Định vị (Positioning)

> **OrderGo là phần mềm SaaS quản lý vận hành đa ngành đầu tiên ở Việt Nam, được thiết kế cho chủ doanh nghiệp dịch vụ muốn vận hành nhiều cơ sở (và sau này nhiều ngành) trên một tài khoản duy nhất.**

So sánh:

| Đối thủ | Định vị của họ | Khác biệt của OrderGo |
| --- | --- | --- |
| KiotViet | POS đa ngành nhưng UI desktop, mobile yếu | Mobile-first, kiến trúc cloud-native |
| MISA Cukcuk | Mạnh kế toán, F&B-only | Mở rộng đa vertical, UX hiện đại |
| iPOS | F&B chuyên sâu, đắt | Module tương đương, giá thấp hơn 30%, mở multi-vertical |
| Sapo FnB | F&B + e-commerce | Không có vertical Khách sạn / Spa / Gym |
| ezCloud | Khách sạn chuyên sâu | Không có vertical F&B, chủ chuỗi đa ngành phải mua 2 phần mềm |
| Square/Toast | Mạnh, không có ở VN | Hoá đơn VN, ví VN, ngôn ngữ Việt, support VN |

## Lợi thế bền vững (Moat) cần xây

| Loại moat | Cách xây | Thời gian |
| --- | --- | --- |
| **Tích hợp địa phương** | Hoá đơn điện tử (VNPT, Viettel, MobiFone), ví Momo/VNPay/ZaloPay, ngân hàng VN, máy POS Sunmi/iMin | 6–12 tháng |
| **Network effect chủ chuỗi** | Khi chủ có 5 chi nhánh, chuyển đổi phần mềm khác = đào tạo lại 50 nhân viên → switching cost cao | 12–24 tháng |
| **Dữ liệu vận hành** | Benchmark "quán cà phê doanh thu 50tr/tháng đang chi % bao nhiêu cho mặt bằng/nhân viên/nguyên liệu so với cohort" → giá trị tăng theo số khách hàng | 24+ tháng |
| **Marketplace tích hợp** | App Store cho 3rd-party (giao hàng, kế toán, marketing) build trên OrderGo | 24+ tháng |
| **Multi-vertical SDK** | Mỗi vertical mới = 1 module plugin; team ngoài có thể build vertical riêng (vd: phòng khám nha khoa) → flywheel | 36+ tháng |

## Chiến lược tăng trưởng theo giai đoạn

### Giai đoạn 0 — Pre-MVP (tháng 0–3)
- Tài liệu nền tảng (đang làm)
- Chốt stack, domain model, MVP scope
- Tuyển 2 dev senior, 1 designer
- Tìm 5 quán "thân thiết" làm design partner

### Giai đoạn 1 — Beta đóng (tháng 3–6)
- Phát hành MVP cho 5–10 quán partner, miễn phí 6 tháng đổi feedback
- Iterate hằng tuần
- Mục tiêu: 10 venues, 0đ doanh thu, NPS ≥ 40

### Giai đoạn 2 — Beta mở (tháng 6–12)
- Mở đăng ký công khai, gói Starter miễn phí (giới hạn 1 chi nhánh, 3 nhân viên)
- Bán gói Pro, Business
- Mục tiêu: 300 WAV, MRR 50tr, NPS ≥ 50

### Giai đoạn 3 — Mở rộng (năm 2)
- Ra module Khách sạn
- Mở channel sales (đại lý, môi giới phần cứng POS)
- Mục tiêu: 1.500 WAV, MRR 400tr, raise Series A

### Giai đoạn 4 — Đông Nam Á (năm 3+)
- Localize Indonesia/Thái Lan/Philippines
- Mở thêm vertical Spa, Gym
- Mục tiêu: 10.000 WAV, ARR 5 triệu USD

## Tiêu chí quyết định mở vertical mới

Chỉ mở vertical mới khi tất cả ✓:

- [ ] Vertical hiện tại có ≥ 300 WAV ổn định 3 tháng liên tiếp
- [ ] Đã có ≥ 30 design partner viết LOI cho vertical mới
- [ ] Có dev/PM riêng cho vertical đó (không "ăn cắp" team vertical cũ)
- [ ] Module overlap với core ≥ 50% (nếu < 50%, build thì lệch sản phẩm — cân nhắc spin-off thay vì gộp)

---
*Changelog: v0.1 — 2026-05-01 — bản phác thảo đầu tiên.*
