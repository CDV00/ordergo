# Hướng dẫn sử dụng OrderGo

> Dành cho **chủ quán, quản lý, thu ngân, phục vụ, bếp** — không cần biết kỹ thuật.
> Mỗi người chỉ thấy những màn hình đúng với vai trò của mình.

## Mục lục

1. [Bắt đầu](#1-bắt-đầu)
2. [Chủ quán: thiết lập quán lần đầu](#2-chủ-quán-thiết-lập-quán-lần-đầu)
3. [Thu ngân & phục vụ: bán hàng trên POS](#3-thu-ngân--phục-vụ-bán-hàng-trên-pos)
4. [Bếp: màn hình bếp (KDS)](#4-bếp-màn-hình-bếp-kds)
5. [Khách tự gọi món bằng QR](#5-khách-tự-gọi-món-bằng-qr)
6. [Thanh toán, giảm giá, in hoá đơn](#6-thanh-toán-giảm-giá-in-hoá-đơn)
7. [Ca làm: mở ca – đóng ca](#7-ca-làm-mở-ca--đóng-ca)
8. [Quản lý: đơn hàng, bàn, khách hàng, nhân viên](#8-quản-lý-đơn-hàng-bàn-khách-hàng-nhân-viên)
9. [Báo cáo](#9-báo-cáo)
10. [Nhiều chi nhánh](#10-nhiều-chi-nhánh)
11. [Khi mất mạng](#11-khi-mất-mạng)
12. [Câu hỏi thường gặp & xử lý sự cố](#12-câu-hỏi-thường-gặp--xử-lý-sự-cố)

---

## 1. Bắt đầu

### Thiết bị nên dùng
| Vị trí | Thiết bị | Màn hình mở |
| --- | --- | --- |
| Quầy thu ngân | Tablet 10" hoặc laptop + máy in nhiệt 80mm | **POS — Gọi món** |
| Bếp / quầy pha chế | Tablet đặt cố định | **Màn bếp** |
| Phục vụ | Điện thoại | **POS — Gọi món** |
| Chủ quán | Điện thoại / laptop | **Tổng quan**, **Báo cáo** |

Dùng trình duyệt **Chrome** (Android, Windows, Mac) hoặc **Safari** (iPhone/iPad).

### Cài như ứng dụng (khuyên dùng trên tablet)
- **Android / Chrome:** mở OrderGo → menu ⋮ → **Thêm vào màn hình chính** (hoặc **Cài đặt ứng dụng**).
- **iPhone / iPad:** mở bằng Safari → nút **Chia sẻ** → **Thêm vào MH chính**.

Sau khi cài, OrderGo mở toàn màn hình như một app, không còn thanh địa chỉ.

### Đăng nhập
- Đăng nhập bằng **số điện thoại** và **mật khẩu**.
- Nhân viên mới được chủ quán mời sẽ nhận **mật khẩu tạm** → đăng nhập rồi đổi ngay: bấm **tên mình** (góc dưới thanh bên) → **Đổi mật khẩu**.
- Sai mật khẩu 5 lần liên tiếp, tài khoản bị **tạm khoá 15 phút** để chống dò mật khẩu — đợi rồi thử lại, hoặc nhờ chủ quán kiểm tra.

### Vai trò và quyền

| Vai trò | Làm được |
| --- | --- |
| **Chủ quán** | Mọi thứ: cài đặt, chi nhánh, nhân viên, báo cáo, xem đầy đủ thông tin khách |
| **Quản lý** | Menu, bàn, đơn, huỷ món đã gửi bếp, hoàn tiền, nhân viên cấp dưới, ca, báo cáo |
| **Thu ngân** | Gọi món, gửi bếp, thu tiền, giảm giá, mở/đóng ca, xem khách hàng (đã che thông tin) |
| **Phục vụ** | Gọi món, gửi bếp, đổi trạng thái bàn |
| **Bếp** | Màn bếp: nhận món, báo đang làm / xong / đã giao |

---

## 2. Chủ quán: thiết lập quán lần đầu

Làm theo thứ tự dưới đây (khoảng 20–30 phút):

### 2.1 Đăng ký và tạo quán
1. Mở trang đăng nhập → tab **Đăng ký** → nhập SĐT, tên, mật khẩu (tối thiểu 8 ký tự).
2. **Thiết lập**: tên doanh nghiệp, tên cơ sở đầu tiên, mã cơ sở (vd `Q3`), loại hình (Cà phê / Nhà hàng…), địa chỉ.

### 2.2 Cài đặt quán — menu **Cài đặt**
- **Thông tin quán**: logo, tên, địa chỉ, số điện thoại — in trên hoá đơn.
- **Hoá đơn & thuế**: VAT (giá menu **đã gồm VAT**), phí phục vụ % (để 0 nếu không thu), lời chào cuối hoá đơn.
- **Thanh toán VietQR**: chọn ngân hàng, số tài khoản, tên chủ tài khoản (viết hoa, không dấu — đúng như trên app ngân hàng). Có tài khoản này thì POS và trang gọi món của khách mới hiện mã QR chuyển khoản **có sẵn số tiền**.

### 2.3 Menu — **Menu & Món**
1. Tạo **nhóm món** (Cà phê, Trà, Bánh…).
2. Thêm **món**: tên, giá, ảnh (JPG/PNG/WEBP ≤ 2MB — nên chụp ảnh thật của món).
3. Mở món để thêm:
   - **Size / biến thể** (Size M, Size L +6.000đ…) — chọn 1 cái mặc định.
   - **Nhóm tuỳ chọn** (Mức đường, Mức đá, Topping…) với số chọn tối thiểu/tối đa và giá cộng thêm.
4. Hết nguyên liệu: mở món → **Đánh dấu hết món** (ghi lý do). Món hết hiện mờ trên POS và trang của khách, không ai gọi được.

### 2.4 Bàn — **Bàn ăn**
1. **Thêm bàn**: khu vực (Tầng trệt, Sân vườn…), tên bàn, số chỗ.
2. **In QR**: trang **Bàn ăn → In QR** → in và dán lên từng bàn.
   > In QR khi đang mở OrderGo bằng **địa chỉ thật của quán** (không phải `localhost`), vì mã QR chứa địa chỉ đang mở.

### 2.5 Nhân viên — **Nhân viên**
1. **Mời nhân viên**: SĐT, họ tên, vai trò, cơ sở làm việc.
2. Nếu SĐT chưa có tài khoản, màn hình hiện **mật khẩu tạm một lần duy nhất** → đưa trực tiếp cho nhân viên (không gửi qua nhóm chat công khai).
3. Đổi vai trò: chọn lại ở cột vai trò. **Khoá** khi nhân viên nghỉ việc — có hiệu lực ngay lập tức.

---

## 3. Thu ngân & phục vụ: bán hàng trên POS

### 3.1 Chọn bàn
Mở **POS — Gọi món** → sơ đồ bàn theo khu:

| Màu | Ý nghĩa |
| --- | --- |
| Xanh lá | Trống |
| Xanh dương | Có khách — hiện tổng tiền và số phút đã ngồi |
| Vàng | Đã đặt trước |
| Cam | Cần dọn (vừa thanh toán xong) |
| Mờ | Tạm ngưng |

Khách mang về: bấm **Mang về**.

### 3.2 Gọi món
1. Chạm vào món. Món có size/tuỳ chọn sẽ hiện hộp chọn (size, đường, đá, topping, ghi chú như "ít ngọt").
2. Kiểm tra giỏ ở bên phải (trên điện thoại: nút **N món mới** ở dưới).
3. Bấm **Gửi bếp** → bếp nhận ngay, kèm tiếng báo.

### 3.3 Khách gọi thêm
Chọn lại **đúng bàn đó**: phần **Đã gọi** hiện các món đã gửi và trạng thái từng món (Chờ làm / Đang làm / Xong / Đã phục vụ). Thêm món mới → **Gửi thêm**. Món được nối vào **cùng một đơn**, nên cuối buổi chỉ cần thu một lần.

### 3.4 Bỏ / huỷ món
- Món **chưa gửi bếp**: bấm ✕ để bỏ.
- Món **đã gửi bếp**: bấm ✕ → chọn lý do → cần tài khoản **Quản lý/Chủ quán**. Món bị gạch trên màn bếp và không tính tiền.
- Món **đã phục vụ** không huỷ được — dùng **giảm giá** nếu cần bù cho khách.

### 3.5 Chuyển bàn, huỷ đơn
Vào **Đơn hàng** → mở đơn → **Chuyển bàn** (bàn cũ tự trống) hoặc **Huỷ đơn** (ghi lý do).

### Thông báo bạn sẽ thấy
- *"Bàn S2 vừa gọi món qua QR"* — khách tự gọi, bấm **Xem** để mở đơn.
- *"Bàn T3: món đã xong, mời mang ra"* — bếp báo xong.

---

## 4. Bếp: màn hình bếp (KDS)

1. Đăng nhập tài khoản **Bếp** → tự vào **Màn bếp**.
2. Bấm **Bật âm báo** một lần sau mỗi lần mở trình duyệt (trình duyệt yêu cầu chạm màn hình trước khi cho phát tiếng).
3. Ba cột: **Mới → Đang làm → Sẵn sàng**. Bấm nút dưới mỗi món để chuyển cột; ở cột Sẵn sàng bấm **Đã giao** khi phục vụ mang ra.
4. Đồng hồ trên từng món cho biết thời gian chờ: **vàng** sau 10 phút, **đỏ** sau 15 phút.
5. Góc trên hiện **● Trực tiếp** khi đang nhận món tức thì. Nếu hiện *"Đang kết nối lại…"*, màn hình vẫn tự làm mới mỗi vài giây — kiểm tra Wi-Fi.

Ghi chú của khách (⚠ ít ngọt, không đá…) hiện nổi bật dưới tên món.

---

## 5. Khách tự gọi món bằng QR

Dành cho khách — có thể in phần này lên bảng hướng dẫn tại bàn:

1. Mở camera điện thoại, quét **mã QR trên bàn**.
2. Chọn món, size, tuỳ chọn → **Giỏ hàng** → **Đặt món**.
3. Theo dõi món đang làm / đã xong trong **Đơn của tôi**; màn hình tự cập nhật.
4. Thanh toán:
   - **Tự thanh toán**: hiện mã VietQR có sẵn số tiền → quét bằng app ngân hàng.
   - Hoặc gọi nhân viên thanh toán tại quầy.

Khách không cần cài app hay tạo tài khoản. Muốn tích điểm, khách xác thực số điện thoại bằng mã OTP.

---

## 6. Thanh toán, giảm giá, in hoá đơn

### 6.1 Thu tiền
POS → chọn bàn → **Thanh toán**:

| Phương thức | Cách làm |
| --- | --- |
| **Tiền mặt** | Nhập/chọn số tiền khách đưa (nút nhanh 50k, 100k, 200k, 500k) → màn hình hiện **tiền thối** |
| **Chuyển khoản QR** | Đưa khách quét mã VietQR (có sẵn số tiền + nội dung). **Chỉ bấm xác nhận khi đã thấy tiền vào tài khoản.** |
| **Thẻ** | Quẹt trên máy POS ngân hàng, xác nhận khi giao dịch thành công |

Khách trả một phần tiền mặt và một phần chuyển khoản: thu lần lượt, màn hình luôn hiện **số còn lại**.

### 6.2 Giảm giá
Trong hộp thanh toán → **Thêm giảm giá** → chọn % (5, 10, 15, 20) hoặc nhập số tiền, ghi lý do → **Áp dụng**. Bấm **Bỏ giảm giá** để huỷ.

### 6.3 In hoá đơn
- Sau khi thu đủ: **In hoá đơn**.
- Trước khi thu (khách xin xem): **Tạm tính** — in phiếu tạm tính kèm mã VietQR.
- Máy in: cài máy in nhiệt 80mm làm **máy in mặc định**, khổ giấy 80mm, lề 0. Lần đầu in, chọn đúng máy in trong hộp thoại in của trình duyệt.

### 6.4 Hoàn tiền
**Thanh toán** → mở giao dịch → **Hoàn tiền** (quản lý/chủ quán), nhập số tiền và lý do.

---

## 7. Ca làm: mở ca – đóng ca

1. **Đầu ca**: trên POS bấm **Mở ca** → đếm tiền trong két → nhập **tiền đầu ca**.
2. Mọi khoản thu trong ca tự gắn vào ca đang mở.
3. **Cuối ca**: **Đóng ca** → đếm tiền thực tế trong két → nhập **tiền đếm được**.
   - Hệ thống tính **tiền mặt phải có** = tiền đầu ca + tiền mặt thu − tiền mặt hoàn.
   - Lệch tiền → **bắt buộc ghi chú** lý do.
4. Xem lại các ca: menu **Ca làm**.

> Quên mở ca vẫn thu tiền được, nhưng khoản thu đó không thuộc ca nào — POS hiện nút **Mở ca** màu vàng để nhắc.

---

## 8. Quản lý: đơn hàng, bàn, khách hàng, nhân viên

- **Đơn hàng**: danh sách đơn hôm nay; mở đơn để xem chi tiết từng món, lịch sử thu tiền, chuyển bàn, huỷ đơn, in lại hoá đơn.
- **Bàn ăn**: mở bàn để xem các đơn đang mở, đổi trạng thái (Trống / Đã đặt / Cần dọn / Tạm ngưng). "Có khách" do hệ thống tự đặt khi bàn có đơn.
- **Khách hàng**: tìm theo SĐT hoặc tên; xem số lần ghé, tổng chi, hạng thẻ, điểm.
  - SĐT và tên **được che** (vd `090****567`). Chủ quán bấm **Hiện thông tin** để xem đầy đủ trong 30 giây — mỗi lần xem được ghi lại.
  - Khách yêu cầu xoá dữ liệu: chủ quán bấm **Xoá dữ liệu cá nhân** (giữ lại số liệu bán hàng, xoá tên/SĐT/email/ngày sinh).
- **Nhân viên**: xem mục [2.5](#25-nhân-viên--nhân-viên).

---

## 9. Báo cáo

- **Tổng quan** (trang chủ): doanh thu và số đơn hôm nay, **so với cùng giờ hôm qua**, doanh thu theo giờ, món bán chạy.
- **Báo cáo**: chọn **Hôm nay / 7 ngày / 30 ngày / Tháng này / Tuỳ chọn** (tối đa 92 ngày):
  - doanh thu thuần, số đơn, giá trị trung bình/đơn, tổng giảm giá
  - doanh thu theo ngày, theo giờ, theo phương thức thanh toán
  - top món, doanh thu theo nhân viên
  - mỗi biểu đồ có nút xem **dạng bảng**
- **Xuất CSV** (chủ quán): mở được bằng Excel; dòng cuối ghi người xuất và thời gian. Tối đa 20 lần/giờ.

---

## 10. Nhiều chi nhánh

Dành cho chủ quán (và người được giao quản lý toàn chuỗi).

- **Thêm chi nhánh:** menu **Chi nhánh** → **Thêm chi nhánh** → nhập tên, mã (vd `Q1`), địa chỉ. Mỗi thẻ chi nhánh hiện số nhân viên, doanh thu và số đơn hôm nay.
- **Sao chép menu:** trên thẻ chi nhánh mới → **Sao chép menu từ cơ sở…** → chọn cơ sở nguồn. Món, size, topping, ảnh được chép sang; món chép về luôn ở trạng thái **còn bán** (hết món tính riêng từng cơ sở). Nếu chi nhánh đã có menu, hệ thống hỏi lại trước khi **thay thế** menu cũ.
- **Món dùng chung toàn chuỗi:** món không gán cơ sở sẽ hiện ở mọi chi nhánh, không cần chép.
- **Đổi cơ sở đang làm việc:** bấm tên cơ sở ở thanh bên (điện thoại: tab **Khác**). POS, bàn, đơn, bếp, ca, thanh toán chỉ hiện dữ liệu của cơ sở đang chọn. Giỏ hàng POS đang soạn được giữ riêng cho từng cơ sở.
- **Nhân viên:** khi mời, chọn cơ sở làm việc; nhân viên gắn một cơ sở chỉ thấy cơ sở đó. Quản lý gắn một cơ sở chỉ sửa được cơ sở của mình, không tạo được chi nhánh mới. Chủ quán lọc danh sách nhân viên theo cơ sở.
- **Báo cáo toàn chuỗi:** **Báo cáo** → chọn **Tất cả cơ sở** → tổng toàn chuỗi kèm biểu đồ và bảng **Theo chi nhánh**; **Xuất CSV** cũng xuất theo lựa chọn này. Trang tổng quan có thẻ **Chi nhánh hôm nay** khi quán có từ 2 cơ sở.
- Khách quét QR chỉ thấy menu của chi nhánh có bàn đó.

> Các chi nhánh cần cùng múi giờ thì mới xem được báo cáo gộp.

---

## 11. Khi mất mạng

- Thanh trên cùng báo **"Mất kết nối"**.
- POS vẫn mở được menu và sơ đồ bàn đã tải trước đó; **Gửi bếp** khi mất mạng sẽ **xếp hàng chờ** và **tự gửi khi có mạng lại** (không bị gửi trùng).
- Đơn chờ hiện trong giỏ với nhãn **"Chờ gửi (offline)"** — **đừng nhập lại**.
- **Thanh toán cần có mạng.** Mất mạng lâu: ghi tay, thu tiền sau khi có mạng.
- Đơn chờ báo **Lỗi** (vd món đã hết): mở danh sách đơn chờ → **Thử lại** hoặc **Bỏ**.

> Bếp chỉ nhận đơn khi đơn đã gửi lên được máy chủ. Mất mạng kéo dài thì báo bếp bằng lời.

---

## 12. Câu hỏi thường gặp & xử lý sự cố

| Tình huống | Cách xử lý |
| --- | --- |
| Không thấy một menu (Báo cáo, Cài đặt…) | Tài khoản không có quyền — hỏi chủ quán. Đổi vai trò có hiệu lực ở thao tác kế tiếp, đăng xuất/đăng nhập lại nếu cần. |
| *"Bạn thao tác quá nhanh"* | Đợi khoảng 1 phút rồi thử lại. |
| *"Tài khoản tạm khoá"* khi đăng nhập | Sai mật khẩu nhiều lần — đợi 15 phút. Quên mật khẩu: nhờ chủ quán. |
| Bếp không kêu khi có món | Bấm **Bật âm báo** trên màn bếp; kiểm tra âm lượng tablet. |
| Thanh toán QR báo *"Chưa cấu hình tài khoản nhận tiền"* | Chủ quán vào **Cài đặt → Thanh toán VietQR**. |
| Khách quét QR báo lỗi phiên | Khách quét lại mã QR trên bàn. |
| In ra hoá đơn bị nhỏ / lệch | Chọn khổ 80mm, lề 0, tỉ lệ 100% trong hộp thoại in. |
| Bàn vẫn "Có khách" dù khách đã về | Đơn chưa thu tiền hoặc chưa huỷ — mở bàn kiểm tra đơn còn mở. |
| Bàn ở trạng thái "Cần dọn" | Dọn xong → mở bàn → **Trống**. |
| Gửi bếp báo không có quyền | Tài khoản Bếp không gọi món được — dùng tài khoản Thu ngân/Phục vụ. |

Cần hỗ trợ thêm: liên hệ người quản trị hệ thống của quán.
