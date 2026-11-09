# Mô hình kinh doanh & Pricing

## Mô hình kinh doanh

OrderGo là **SaaS B2B subscription** với 4 nguồn doanh thu, theo thứ tự ưu tiên:

| Nguồn | % doanh thu năm 1 | % doanh thu năm 3 | Ghi chú |
| --- | --- | --- | --- |
| **1. Subscription cơ bản** | 95% | 65% | Gói tháng/năm theo bậc tính năng |
| **2. Subscription add-on** (vertical, module) | 0% | 15% | Module Khách sạn, Marketing, Kế toán nâng cao... |
| **3. Transaction-based** (thanh toán, hoá đơn) | 5% | 15% | % phí thanh toán qua cổng tích hợp, phí hoá đơn điện tử |
| **4. Marketplace & API** | 0% | 5% | App store cho 3rd-party, API enterprise |

**Không** có doanh thu từ:
- Bán phần cứng (sẽ giới thiệu đối tác để hưởng commission, không tự nhập kho)
- Quảng cáo trong app (phá UX, mất trust)
- Bán dữ liệu khách hàng (không bao giờ)

## Pricing — gói chính

> **Triết lý**: minh bạch, tự đăng ký được, free tier có giới hạn rõ ràng nhưng đủ dùng cho quán nhỏ. Nâng cấp khi cần thêm năng lực, không phải ép buộc.

### Tier F&B

| Gói | Giá/tháng/chi nhánh | Đối tượng | Giới hạn |
| --- | --- | --- | --- |
| **Free** | 0đ | Quán mới mở, thử nghiệm | 1 chi nhánh, 3 user, 100 đơn/ngày, branding "Powered by OrderGo" trên hoá đơn |
| **Starter** | 299.000đ | Quán đơn lẻ ổn định | 1 chi nhánh, 5 user, không giới hạn đơn, bỏ branding |
| **Pro** | 599.000đ | Chuỗi 2–5 chi nhánh | Đa chi nhánh, 20 user/CN, KDS, báo cáo nâng cao, API cơ bản |
| **Business** | 1.299.000đ | Chuỗi 5–20 chi nhánh | Tất cả Pro + đa vertical, RBAC nâng cao, SSO, audit log, API đầy đủ |
| **Enterprise** | Liên hệ | Chuỗi 20+ | Custom SLA, on-premise option, dedicated support, training onsite |

Trả theo **năm giảm 15%**, theo **2 năm giảm 25%**.

### Tier Hospitality (năm 2)

| Gói | Giá/tháng/cơ sở | Đối tượng | Giới hạn |
| --- | --- | --- | --- |
| **Homestay** | 499.000đ | Homestay 5–15 phòng | Booking, lễ tân, housekeeping cơ bản |
| **Hotel Pro** | 1.499.000đ | Khách sạn 16–50 phòng | + Channel Manager (Booking/Agoda), POS nhà hàng tích hợp |
| **Hotel Business** | 2.999.000đ | Khách sạn 50+ phòng | + Multi-property, revenue management cơ bản |

### Add-on / Module phụ

| Add-on | Giá/tháng | Mô tả |
| --- | --- | --- |
| Hoá đơn điện tử (qua đối tác VNPT/Viettel) | 0đ + phí mỗi hoá đơn | Pass-through, ~250đ/hoá đơn |
| Module Loyalty | 199.000đ | Tích điểm, voucher, push noti khách |
| Module Marketing | 299.000đ | Email/SMS/Zalo OA broadcast |
| Module Kế toán nâng cao | 399.000đ | Báo cáo theo chuẩn TT200, sổ cái, công nợ |
| Module Bếp trung tâm | 499.000đ | Cho chuỗi có bếp central |
| API Enterprise (tăng quota) | 499.000đ | 100k → 10M calls/tháng |

## Đơn vị kinh tế (Unit Economics) — mục tiêu năm 2

Giả định gói Pro (599k/tháng):

| Chỉ số | Mục tiêu | Cách đạt |
| --- | --- | --- |
| **ARPU** | 600.000đ/tháng | Mix Starter (40%) / Pro (40%) / Business (20%) |
| **Gross margin** | 75–80% | SaaS thuần, chi phí hosting + thanh toán + support ~20% |
| **CAC** (chi phí thu hút khách) | < 1.500.000đ | Mix: SEO + content (40%), referral (30%), paid (20%), sales (10%) |
| **CAC payback** | < 6 tháng | (1.5tr / 600k × 75% margin) ≈ 3.3 tháng — buffer cho churn |
| **Churn tháng** | < 4% | Onboarding tốt + support nhanh + giá trị tích luỹ |
| **LTV** | > 12tr | ARPU × margin × (1/churn) = 600k × 0.75 × 25 = 11.25tr — cần hạ churn xuống 3% để đạt 15tr |
| **LTV/CAC** | > 7x | Mục tiêu 8x |

## Sales channels

### Năm 1 — Direct & community-driven
1. **Direct sales** — founder-led, bán cho 50–100 khách đầu
2. **Content & SEO** — blog, video, case study từ design partner
3. **Cộng đồng chủ quán** — Facebook group, Zalo group, KOL ngành F&B
4. **Referral program** — chủ quán giới thiệu nhận 1 tháng miễn phí

### Năm 2 — Partner-led
1. **Đại lý phần cứng POS** (Sunmi, iMin reseller) — bán bundle phần mềm + máy
2. **Kế toán dịch vụ** — kế toán giới thiệu cho chủ doanh nghiệp
3. **Đại lý kênh** ở các thành phố tỉnh (Cần Thơ, Vinh, Buôn Ma Thuột)
4. **Tích hợp đối tác** — kết nối với app giao hàng, hoá đơn, ngân hàng → 2 chiều giới thiệu

### Năm 3+ — Inside sales + Enterprise sales
1. **Inside sales team** xử lý inbound từ marketing
2. **Enterprise sales** cho chuỗi 20+ chi nhánh, sales cycle 1–3 tháng
3. **Marketplace partners** — agency triển khai cho khách hàng lớn

## So sánh pricing với đối thủ

Gói Pro 599.000đ/tháng tương đương:
- KiotViet F&B Pro: ~550k/tháng
- MISA Cukcuk Pro: ~500k/tháng
- iPOS: ~800k–1.2tr/tháng
- Sapo FnB: ~599k/tháng
- POS365 Pro: ~300k/tháng

→ OrderGo Pro **ngang giá** với đối thủ chính, nhưng **bao gồm nhiều hơn** (đa chi nhánh không phụ thu, KDS không phụ thu). Wedge thật sự là gói **Free** (đối thủ không có) và **Business multi-vertical** (đối thủ không có).

## Roadmap pricing

- **v1 (MVP, tháng 0–6)**: chỉ Free + Starter + Pro để đơn giản. Business/Enterprise mở khi có khách demand.
- **v2 (tháng 6–12)**: thêm Business, mở add-ons Loyalty + HĐĐT.
- **v3 (tháng 12+)**: tier Hospitality, marketplace.

## Test pricing cần chạy

- [ ] A/B 299k vs 399k cho Starter — chuyển đổi và LTV khác nhau bao nhiêu
- [ ] Free tier có giới hạn 100 đơn/ngày vs 30 đơn/ngày — cái nào đủ "đau" để upgrade
- [ ] Trả năm giảm 15% vs 20% — uptake khác bao nhiêu
- [ ] Có bao nhiêu khách upgrade vì add-on (Loyalty, Marketing) so với upgrade vì tính năng cơ bản

---
*Changelog: v0.1 — 2026-05-01 — bản phác thảo đầu tiên, pricing cần test thị trường.*
