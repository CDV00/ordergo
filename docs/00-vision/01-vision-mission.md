# Tầm nhìn & Sứ mệnh

## Tầm nhìn (5–10 năm)

**Trở thành nền tảng quản lý vận hành (Operations OS) phổ biến nhất cho các cơ sở dịch vụ tại Việt Nam và Đông Nam Á** — bắt đầu từ nhà hàng/quán cà phê, mở rộng sang khách sạn, chuỗi spa, phòng gym, trung tâm dạy học, và bất kỳ business nào có "khách đến — đặt dịch vụ — thanh toán" làm vòng lặp cốt lõi.

Câu một dòng: **"Một phần mềm — vận hành mọi không gian dịch vụ."**

## Sứ mệnh (3 năm)

Giúp **chủ doanh nghiệp dịch vụ vừa và nhỏ ở Việt Nam** điều hành cửa hàng từ điện thoại trong 5 phút mỗi ngày, với chi phí dưới 500.000đ/tháng/cơ sở, mà vẫn có đầy đủ:
- Đơn hàng & thanh toán theo thời gian thực
- Báo cáo tài chính & vận hành chuẩn kế toán
- Kết nối ví điện tử, máy in bill, máy POS, thiết bị bếp
- Khả năng mở rộng sang chi nhánh thứ 2, 5, 50 mà không phải đổi phần mềm

## Vấn đề chúng ta giải quyết

Thị trường VN có hàng trăm nghìn nhà hàng/quán cà phê và hàng chục nghìn khách sạn/homestay nhỏ. Đa số đang dùng:

1. **Sổ giấy / Excel** — không có dữ liệu real-time, mất bill, sai tiền
2. **Phần mềm cũ desktop** (KiotViet, MISA, iPOS phiên bản cài máy) — không đa chi nhánh, không mobile-first, ít cập nhật
3. **Phần mềm SaaS hiện tại** — giải quyết được F&B nhưng đóng cứng vào 1 vertical; chủ business mở thêm khách sạn/spa phải mua thêm phần mềm khác, dữ liệu khách hàng/kế toán bị chia cắt
4. **Phần mềm nước ngoài** (Square, Toast, Lightspeed) — mạnh nhưng không hỗ trợ thuế VN, hoá đơn điện tử VN, ví VN (Momo/ZaloPay/VNPay), ngôn ngữ Việt yếu

→ Khoảng trống: **một nền tảng modular, mobile-first, giá VN, hỗ trợ nhiều vertical dưới cùng 1 tài khoản**.

## Đối tượng phục vụ chính (lúc khởi đầu)

1. **Nhà hàng/quán cà phê 1–5 chi nhánh** ở các đô thị Việt Nam (HCM, HN, ĐN, Cần Thơ, Hải Phòng)
2. **Chủ chuỗi đa ngành** (vd: vừa có cà phê + có homestay) — đây là khách hàng "mơ ước" vì họ chứng minh giá trị multi-vertical của OrderGo

## Sứ mệnh không bao gồm (để tránh phân tán)

- Không làm CRM tổng quát cạnh tranh HubSpot/Salesforce
- Không làm ERP nặng cho nhà máy sản xuất
- Không làm e-commerce platform cạnh tranh Shopify/Haravan
- Không làm thanh toán (sẽ tích hợp Momo/VNPay/ZaloPay/cổng banking thay vì xây cổng riêng)
- Không làm phần cứng — chỉ tích hợp với phần cứng có sẵn

## Tuyên ngôn giá trị (Value Proposition)

| Đối tượng | Trước OrderGo | Sau OrderGo |
| --- | --- | --- |
| Chủ quán | Phải ngồi quán mới biết doanh thu, sổ sách rời rạc | Mở app điện thoại 5 phút sáng — biết doanh thu hôm qua, tồn kho, ca làm |
| Nhân viên phục vụ | Ghi giấy → đọc cho bếp → quên món | Tablet ghi món → bếp nhận tức thì → tự động tính bill |
| Bếp | Không biết món nào ưu tiên, làm sai thứ tự | Màn hình bếp xếp món theo thời gian + bàn |
| Kế toán | Cuối tháng cộng tay từ bill | Báo cáo doanh thu/chi phí/thuế xuất 1 click, sẵn template hoá đơn điện tử |
| Chủ chuỗi | Từng chi nhánh tự quản, không tổng hợp | Dashboard tập trung, so sánh chi nhánh, gộp khách hàng |
| Chủ đa vertical | Mua 2–3 phần mềm rời rạc | 1 tài khoản OrderGo, thêm module Khách sạn / Spa khi cần |

## Chỉ số thành công Bắc Đẩu (North-Star Metric)

**Số "cơ sở hoạt động" (active venues) đang xuất bill qua OrderGo trong 7 ngày gần nhất (WAV — Weekly Active Venues).**

Lý do: WAV phản ánh giá trị thật (khách hàng dùng hằng ngày), khó "đánh bóng" như doanh thu (có thể đến từ 1 deal lớn), và tăng tuyến tính với churn thấp.

Mục tiêu giai đoạn:
- **Tháng 6** sau MVP: 30 WAV
- **Năm 1**: 300 WAV
- **Năm 3**: 5.000 WAV (cross-vertical)

---
*Changelog: v0.1 — 2026-05-01 — bản phác thảo đầu tiên.*
