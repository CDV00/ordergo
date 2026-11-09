# Phân tích thị trường

> **Lưu ý**: các số liệu dưới đây là ước tính tổng hợp từ nhiều nguồn công khai (Tổng cục Thống kê, báo cáo Vietdata, Decision Lab, Q&Me, Statista). Trước khi gọi vốn cần verify với nguồn chính thức và bổ sung primary research.

## 1. Quy mô thị trường (TAM/SAM/SOM)

### Vertical 1 — F&B (ưu tiên năm 1)

| Tầng | Quy mô | Cơ sở ước tính |
| --- | --- | --- |
| **TAM** (toàn ngành F&B VN) | ~350.000 cơ sở | Tổng cục Thống kê 2023: ~317.000 cơ sở dịch vụ ăn uống đăng ký + ước lượng cơ sở chưa đăng ký |
| **SAM** (cơ sở có khả năng dùng phần mềm) | ~150.000 cơ sở | Cơ sở doanh thu > 30tr/tháng, có ít nhất 1 nhân viên ngoài chủ |
| **SOM** 3 năm | ~7.500 cơ sở (5% SAM) | Cohort thực tế đạt được trong 3 năm với chiến lược hiện tại |

ARPU ước tính: 500.000đ/tháng/cơ sở → SOM năm 3 = ~45 tỷ ARR.

### Vertical 2 — Khách sạn/Homestay (năm 2+)

| Tầng | Quy mô | Cơ sở ước tính |
| --- | --- | --- |
| **TAM** | ~38.000 cơ sở lưu trú VN | Tổng cục Du lịch 2023 |
| **SAM** | ~20.000 cơ sở | Khách sạn 1-3 sao + homestay có ≥ 5 phòng |
| **SOM** năm 5 | ~1.000 cơ sở (5% SAM) | ARPU 2tr → ~24 tỷ ARR |

### Vertical tương lai
- Spa & Salon: TAM ~25.000 cơ sở
- Phòng gym & yoga: TAM ~3.500 cơ sở
- Trung tâm dạy học (ngoại ngữ, kỹ năng): TAM ~15.000 cơ sở

## 2. Xu hướng thị trường

### Xu hướng thuận lợi
1. **Số hoá ngành dịch vụ tăng mạnh sau COVID** — chủ quán đã quen với QR menu, app order, ví điện tử.
2. **Nghị định 123/2020 + Thông tư 78/2021 bắt buộc hoá đơn điện tử** — tạo nhu cầu phần mềm có module hoá đơn.
3. **Cơ quan thuế đẩy mạnh máy tính tiền kết nối** (Nghị định 70/2025 bắt buộc HKD/DN có doanh thu lớn từ 1.000 món/lần) — đẩy chủ quán phải có phần mềm.
4. **Smartphone penetration > 90% dân số** — mobile-first không còn là rào cản.
5. **Mức sống đô thị tăng → nhu cầu chuỗi nhà hàng nhỏ tăng → cần phần mềm đa chi nhánh**.
6. **Du lịch nội địa phục hồi mạnh, du lịch quốc tế quay lại** — nhu cầu PMS khách sạn/homestay tăng.

### Xu hướng bất lợi / cần cảnh giác
1. **Lạm phát chi phí mặt bằng & nhân sự** → chủ quán nhạy cảm giá hơn.
2. **Đối thủ lớn sẵn vốn** (KiotViet đã raise nhiều vòng, MISA niêm yết).
3. **Tỉ lệ đóng quán cao** (30% trong 1 năm đầu) → churn nguy hiểm nếu chỉ targets quán mới.
4. **Yêu cầu tích hợp HĐĐT/E-Tax thay đổi liên tục** — cost compliance.

## 3. Tâm lý khách hàng VN (insights)

Tổng hợp từ phỏng vấn 12 chủ quán (ghi nhận trong design partner research):

- **"Tôi không cần feature nhiều, tôi cần dùng được lúc đông khách"** — performance/uptime quan trọng hơn feature.
- **"Phần mềm cũ đắt vì thay máy mới phải mua lại"** — perpetual license đau, SaaS giảm pain.
- **"Nhân viên 18 tuổi, không biết Excel"** — UX phải dễ tới mức không cần training.
- **"Chủ tôi sợ data đám mây"** — cần truyền thông về bảo mật + offline mode.
- **"Tôi muốn xem doanh thu lúc 2h sáng"** — mobile dashboard là must.
- **"Mỗi tháng có 1 thứ phải thêm: thuế, ưu đãi mới, ví mới"** — phần mềm phải update nhanh.
- **"Tôi mở thêm homestay, lại phải mua phần mềm khác"** — đây chính là cơ hội của OrderGo.

## 4. Phân khúc thị trường

### Phân khúc theo quy mô (chọn ưu tiên SMB)

| Phân khúc | Số chi nhánh | ARPU/tháng | % chọn ưu tiên | Ghi chú |
| --- | --- | --- | --- | --- |
| **Micro** (chủ quán đơn lẻ) | 1 | 200–400k | ⭐⭐⭐ Năm 1 | Volume cao, churn cao, marketing chi phí thấp (referral) |
| **SMB** (chuỗi 2–10 chi nhánh) | 2–10 | 1–5tr | ⭐⭐⭐⭐⭐ Năm 1–2 | Sweet spot — value cao, churn thấp, có ngân sách |
| **Enterprise** (chuỗi > 10) | 10+ | 10tr+ | ⭐⭐ Năm 3 | Sales cycle dài, customize nhiều, không phù hợp giai đoạn đầu |

### Phân khúc theo ngành (vertical)

Năm 1: F&B 100%
Năm 2: F&B 70% + Hotel 30%
Năm 3: F&B 50% + Hotel 30% + Spa/Gym/Edu 20%

### Phân khúc theo địa lý

| Khu vực | Mức độ ưu tiên | Lý do |
| --- | --- | --- |
| TP.HCM | ⭐⭐⭐⭐⭐ | Mật độ quán cao nhất, willingness to pay cao, mạng lưới partner dày |
| Hà Nội | ⭐⭐⭐⭐ | Volume thứ 2, văn hoá uống cà phê mạnh |
| Đà Nẵng | ⭐⭐⭐⭐ | Du lịch — vertical Hotel sớm có |
| Đà Lạt, Phú Quốc, Hội An, Nha Trang | ⭐⭐⭐ | Cross-vertical (F&B + Homestay) |
| Cần Thơ, Hải Phòng, Vinh, Buôn Ma Thuột | ⭐⭐ | Mở rộng năm 2 |
| Tỉnh nhỏ | ⭐ | Mở channel partner, không tự bán |

## 5. Cơ hội cụ thể OrderGo nhắm tới

1. **Cross-vertical play** — chưa ai trong VN làm tốt. Chủ chuỗi 5 cà phê + 2 homestay phải dùng 2 phần mềm khác nhau.
2. **Mobile-first cho phục vụ/bếp** — KiotViet/Sapo vẫn POS desktop là chính, app mobile chỉ là phụ.
3. **API-first, marketplace** — tạo chỗ cho 3rd-party (giao hàng, kế toán, marketing) tích hợp.
4. **Pricing minh bạch + free tier** — đa số đối thủ giấu giá, ép gọi sales.
5. **Tốc độ ship feature** — startup nhỏ ship hằng tuần, đối thủ lớn ship hằng quý.

## 6. Câu hỏi mở cần nghiên cứu thêm

- [ ] Verify TAM bằng số liệu cụ thể từ Tổng cục Thống kê (mua báo cáo)
- [ ] Khảo sát 50 chủ quán về willingness-to-pay
- [ ] Phân tích chi phí thu hút khách hàng (CAC) của KiotViet/iPOS qua công khai báo cáo (nếu có)
- [ ] Pricing test: 299k vs 499k vs 799k cho gói Starter — mức nào convert tốt nhất
- [ ] Tỉ lệ quán đóng cửa → tính churn baseline

---
*Changelog: v0.1 — 2026-05-01 — bản phác thảo đầu tiên, cần primary research bổ sung.*
