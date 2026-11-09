# User Journey

Mỗi journey mô tả flow xuyên suốt một persona làm một mục tiêu lớn. Đây là **input để thiết kế feature**, không phải spec UI cuối.

---

## Journey 1 — Chủ quán B1 từ "biết tới OrderGo" đến "ra bill đầu tiên"

| Bước | Hành động | Touchpoint | Pain hiện tại | Cải thiện OrderGo |
| --- | --- | --- | --- | --- |
| 1. Nhận biết | Thấy quảng cáo TikTok / bạn giới thiệu | TikTok ad, Zalo | Không tin "free thật" | Landing rõ free tier — không thẻ tín dụng |
| 2. Tìm hiểu | Vào ordergo.vn, xem feature | Web | Bị ép gọi sales | Self-service signup nút lớn |
| 3. Đăng ký | Tạo tài khoản bằng số ĐT | Web/App | Form dài, OTP chậm | OTP < 30s, 3 trường: SĐT, tên quán, mật khẩu |
| 4. Setup quán | Nhập thông tin quán, menu | Web wizard | Phải nhập 100 món | Import từ Excel/ảnh menu (OCR), template sẵn cho cà phê/trà sữa |
| 5. Thêm thiết bị | Cài app trên iPad/Android phục vụ | Mobile app | Cấu hình IP, máy in, KDS phức tạp | Quét QR từ web → tự pair, máy in qua Bluetooth |
| 6. Train nhân viên | Phục vụ thử order | App | Hướng dẫn dài, giấy tờ | Tutorial 90 giây in-app, video Tiktok-style |
| 7. **Bill đầu tiên** | Khách order, in bill, thu tiền | POS + Printer | — | **Mục tiêu: bước 1 → bước 7 trong 30 phút** |
| 8. Aha moment | Mở app điện thoại tối thấy doanh thu hôm nay | Mobile dashboard | — | Push notification "Hôm nay quán bán 3.2tr 🎉" |

### Metric kiểm tra
- Median time-to-first-order < 30 phút
- Drop-off ở bước 4 (nhập menu) < 20%
- Day-1 retention ≥ 70%
- Day-7 retention ≥ 50%

---

## Journey 2 — Chủ chuỗi B2 từ "đăng ký Pro" đến "có dashboard 4 chi nhánh"

| Bước | Hành động | Pain | Cải thiện OrderGo |
| --- | --- | --- | --- |
| 1. Demo + thử | Đăng ký, demo với sales | Demo 2 tuần mới schedule được | Self-demo + sandbox data sẵn |
| 2. Migration data | Import từ KiotViet/POS365 | Mất 2–3 ngày, sai dữ liệu | Tool import chuẩn, parallel run, dịch vụ migration miễn phí cho Business |
| 3. Setup chi nhánh 1 | Nhân bản setup từ data import | Phải nhập lại menu | Auto-detect và áp dụng |
| 4. Nhân bản sang chi nhánh 2,3,4 | Clone settings, đổi địa chỉ | Phải làm lại từ đầu | Template chi nhánh — clone trong 5 phút |
| 5. Phân quyền nhân viên | Cấp tài khoản phục vụ/bếp/quản lý từng CN | RBAC phức tạp | Role chuẩn sẵn (Phục vụ, Bếp, Lễ tân, Thu ngân, Quản lý CN, Chủ chuỗi) |
| 6. Parallel run | Dùng OrderGo + phần mềm cũ song song 1–2 tuần | Không có cách dùng song song | Read-only export sang phần mềm cũ qua API |
| 7. **Cutover** | Tắt phần mềm cũ | Sợ mất data | Backup tự động, có thể rollback |
| 8. Aha moment | Sáng thứ 2 mở app — dashboard 4 CN, biết CN nào tăng/giảm % so tuần trước | — | Comparative dashboard mặc định |

### Metric kiểm tra
- Migration end-to-end < 5 ngày
- Cutover thành công không phải hoàn lại tiền
- Day-30 retention 100% cho khách Business
- Mở chi nhánh thứ N (N>1) < 1 ngày

---

## Journey 3 — Anh Khải B3 (đa vertical) từ "F&B" thêm module "Hospitality"

| Bước | Hành động | Cải thiện OrderGo |
| --- | --- | --- |
| 1. Đang dùng OrderGo cho 3 quán | Anh Khải đã quen platform, có dữ liệu khách hàng | — |
| 2. Vào Settings → "Mở rộng" → thấy module "Hospitality" | Một click | "Bật dùng thử 14 ngày" |
| 3. Wizard setup khách sạn | Nhập số phòng, loại phòng, giá | Template 5 loại khách sạn (boutique, homestay, business...) |
| 4. Liên kết khách hàng | "Khách F&B của anh đã có 1.200 người. Muốn auto tạo loyalty card cross-vertical?" | One-click — đây là moment "wow" |
| 5. Setup channel manager | Kết nối Booking.com, Agoda | OAuth flow, không phải copy API key |
| 6. Kế toán nhìn báo cáo | Báo cáo P&L tách theo vertical, hợp nhất theo entity | Multi-vertical reporting native |
| 7. **Aha moment**: khách check-in homestay → app tự push voucher cà phê tại quán cùng chuỗi | Cross-vertical workflow | — |

### Đây là moment "irreplaceable" — không đối thủ nào trong VN làm được

---

## Journey 4 — U1 (phục vụ) trong giờ peak

```
[Khách bước vào]
    │
    ▼
[Phục vụ tap "Bàn 5"] (1 giây)
    │
    ▼
[Menu hiện ra theo category, search top]
    │
    ├─► [Tap "Cà phê đen đá" × 2] (2 giây)
    │
    ├─► [Tap "Bánh mì pate" × 1, ghi chú "không hành"] (3 giây)
    │
    ▼
[Tap "Gửi xuống bếp"] (1 giây)
    │
    ▼
[Pop-up "Đã gửi" 0.5s rồi auto-dismiss]
    │
    ▼
[Bếp KDS hiện món + bàn + giờ + ghi chú]
    │
    ▼
[Bếp tap "Sẵn sàng"]
    │
    ▼
[Phục vụ nhận noti rung tay]
    │
    ▼
[Mang ra bàn → Tap "Đã giao"]
```

**Tổng**: < 10 giây từ tap đầu đến gửi đơn. Mục tiêu speed test.

### Yêu cầu để đạt tốc độ này
- Render menu < 100ms (cache local)
- Gửi đơn = optimistic UI (hiển thị "đã gửi" trước khi server xác nhận)
- Bếp KDS realtime < 1s
- Hoạt động khi rớt mạng — queue local, sync khi có lại

---

## Journey 5 — Chủ B1 cuối ngày: đóng ca + xem báo cáo

```
[20h — quán đóng cửa]
    │
    ▼
[Quản lý/chủ tap "Đóng ca"]
    │
    ▼
[App tự tổng hợp:
 - Doanh thu tiền mặt: X
 - Doanh thu chuyển khoản: Y
 - Doanh thu ví Momo/VNPay: Z
 - Tổng đơn: N (so hôm qua: +12%)
 - Top 5 món bán chạy
 - Hao hụt nguyên liệu (nếu có Inventory)]
    │
    ▼
[Chủ confirm số tiền mặt thực tế]
    │
    ├─► [Khớp → Đóng ca thành công]
    └─► [Lệch → Note lý do, manager approve]
    │
    ▼
[App push noti tổng kết về điện thoại chủ — kể cả chủ ở nhà]
```

### Cải thiện so với hiện tại
- Chủ B1 hiện phải gọi điện hỏi nhân viên tổng kết
- Với OrderGo: noti tự về 5 phút sau khi đóng ca

---

## Cross-cutting principles từ các journey

1. **Chu kỳ "đăng ký → giá trị đầu tiên" phải < 30 phút** cho B1, < 5 ngày cho B2/B3
2. **Mọi thao tác vận hành (giờ peak)** ≤ 3 tap, ≤ 1 giây latency cảm nhận
3. **Mỗi feature phải có "aha moment"** — push noti, animation, số liệu cụ thể, không silent
4. **Phải hoạt động được khi rớt mạng** — không chấp nhận "lỗi mạng" trong giờ peak
5. **Cross-vertical workflow** là USP — phải hiển thị rõ trong UI khi user mở module thứ 2

---
*Changelog: v0.1 — 2026-05-01.*
