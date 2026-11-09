# Kịch bản demo OrderGo (10 phút)

> Dành cho buổi demo với chủ quán cà phê / nhà hàng nhỏ. Mục tiêu: khách thấy **một ca bán hàng khép kín** chạy mượt trên tablet và điện thoại, cộng 3 điểm "wow": **khách tự gọi món qua QR**, **bếp nhận ngay lập tức**, **VietQR + in bill**.

## Chuẩn bị (15 phút trước buổi demo)

| Việc | Cách làm |
| --- | --- |
| Reset dữ liệu demo | Trên server: `./deploy/seed-demo.sh` · Local: `cd ordergo-api && yarn seed:demo` |
| Tài khoản VietQR | Đặt `DEMO_BANK_BIN`, `DEMO_BANK_NAME`, `DEMO_BANK_ACCOUNT`, `DEMO_BANK_ACCOUNT_NAME` (tài khoản **của quán/người demo**) trước khi seed, hoặc nhập ở **Cài đặt → Thanh toán VietQR** |
| Ảnh món | Chụp ảnh ~10 món bán chạy (ảnh thật của quán, không lấy ảnh trên mạng vì bản quyền) → **Menu & Món → mở món → Tải ảnh món**. Menu QR có ảnh tạo ấn tượng mạnh hơn hẳn |
| Thiết bị 1 — tablet thu ngân | Mở trình duyệt → đăng nhập **0900000003** (thu ngân) → "Thêm vào màn hình chính" (PWA) → mở **POS** |
| Thiết bị 2 — tablet/laptop bếp | Đăng nhập **0900000005** (bếp) → **Màn bếp** → bấm **"Bật âm báo"** (bắt buộc 1 lần để trình duyệt cho phát tiếng) |
| Thiết bị 3 — điện thoại "khách" | Chuẩn bị QR bàn **T4**: in từ **Bàn ăn → In QR** hoặc mở `/tables/qr` trên laptop để quét |
| Laptop người demo | Đăng nhập **0900000001** (chủ quán) để mở Tổng quan / Báo cáo |
| Máy in nhiệt 80mm (tuỳ chọn) | Cài làm máy in mặc định của tablet thu ngân; khổ giấy 80mm, lề 0 |

Mật khẩu chung các tài khoản demo: `ordergo123` (hoặc giá trị `DEMO_PASSWORD` đã đặt trên server — **nên đặt** khi demo trên mạng công khai).

| SĐT | Vai trò | Dùng để |
| --- | --- | --- |
| 0900000001 | Chủ quán | Tổng quan, Báo cáo, Nhân viên, Cài đặt, xem khách hàng đầy đủ |
| 0900000002 | Quản lý | Huỷ món đã gửi bếp, quản lý nhân viên cấp dưới |
| 0900000003 | Thu ngân | POS, thu tiền, mở/đóng ca |
| 0900000004 | Phục vụ | POS gọi món (không thấy doanh thu) |
| 0900000005 | Bếp | Màn bếp |

## Kịch bản

### 1. Mở đầu — "quán đang chạy" (1 phút)
- Laptop chủ quán: **Tổng quan** — doanh thu hôm nay, so với cùng giờ hôm qua, giờ cao điểm, top món.
- Nhấn mạnh: dữ liệu theo giờ Việt Nam, xem được trên điện thoại.

### 2. Mở ca (30 giây)
- Tablet thu ngân: nút **"Mở ca"** trên POS → chọn **500.000đ** → Mở ca. "Cuối ngày hệ thống tự tính tiền mặt phải có trong két."

### 3. Gọi món tại bàn (2 phút)
- POS → chọn bàn **T4** → thêm **Bạc xỉu** (chọn Size L, 50% đường), **Bánh mì que pate** → **Gửi bếp**.
- Tablet bếp **kêu "ting"** và hiện món ở cột **Mới** ngay lập tức (không phải tải lại).
- Bếp bấm **Bắt đầu làm** → **Sẵn sàng**: tablet thu ngân hiện thông báo *"Bàn T4: món đã xong"*.
- Khách gọi thêm: POS → T4 vẫn thấy **Đã gọi** → thêm **Khoai tây chiên** → **Gửi thêm** (nối vào cùng đơn, không tạo đơn mới).

### 4. Khách tự gọi qua QR — điểm "wow" (2 phút)
- Đưa điện thoại "khách" quét QR bàn **T4** → menu có ảnh, biến thể, topping → gọi **Trà đào cam sả** → Đặt món.
- Tablet thu ngân hiện *"Bàn T4 vừa gọi món qua QR"*, bếp nhận món ngay.
- Bếp bấm **Bắt đầu làm** → điện thoại khách tự cập nhật tiến trình món.

### 5. Thanh toán + in bill (2 phút)
- POS → T4 → **Thanh toán** → **Thêm giảm giá 10%** (lý do "Khách quen").
- Chọn **Chuyển khoản QR**: mã VietQR có sẵn số tiền + nội dung → khách quét bằng app ngân hàng.
  *(Hoặc chọn Tiền mặt → "200.000đ" → hiện tiền thối.)*
- **Xác nhận** → **In hoá đơn** (bill 80mm có giảm giá, tiền khách đưa/thối).
- Bàn T4 tự chuyển sang **Cần dọn** trên sơ đồ bàn.

### 6. Quản lý (1,5 phút)
- **Khách hàng**: danh sách thành viên, SĐT được che; chủ quán bấm **"Hiện thông tin"** (có ghi log) → thẻ tích điểm, lịch sử điểm.
- **Nhân viên**: mời nhân viên mới bằng SĐT → mật khẩu tạm hiện 1 lần; khoá tài khoản có hiệu lực ngay.
- **Báo cáo**: 7 ngày, doanh thu theo ngày/giờ, top món, theo nhân viên → **Xuất CSV** (mở được bằng Excel).

### 7. Đóng ca (1 phút)
- POS → **Đóng ca** → nhập tiền đếm được → hệ thống báo chênh lệch (bắt buộc ghi chú nếu lệch) → tổng kết theo phương thức.

## Câu hỏi hay gặp

| Câu hỏi | Trả lời ngắn |
| --- | --- |
| Mất mạng thì sao? | Bản demo cần mạng. Chế độ offline cho POS nằm trong lộ trình sau pilot. |
| Có hoá đơn điện tử không? | Có trong lộ trình (VNPT-Invoice). Hiện in bill thanh toán + VietQR. |
| Momo/VNPay? | VietQR dùng được với mọi app ngân hàng và ví hỗ trợ NAPAS. Tích hợp cổng Momo/VNPay xác nhận tự động nằm trong lộ trình. |
| Máy in Bluetooth? | Hiện in qua hộp thoại in của trình duyệt (máy in nhiệt USB/LAN/Bluetooth đã cài trên thiết bị). |
| Nhiều chi nhánh? | Kiến trúc đã hỗ trợ nhiều cơ sở; giao diện tổng hợp chuỗi nằm trong lộ trình. |
| Dữ liệu khách có an toàn? | SĐT/tên che mặc định, xem đầy đủ cần quyền chủ quán và được ghi nhật ký; có chức năng xoá dữ liệu cá nhân theo yêu cầu. |

## Sau buổi demo
- Chạy lại seed để xoá dữ liệu phát sinh trong buổi demo.
- Ghi nhận phản hồi vào backlog (`03-mvp-backlog.md`) — ưu tiên Phase 5 theo yêu cầu thật của khách.
