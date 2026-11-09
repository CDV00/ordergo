# OrderGo — kiểm thử giao diện end-to-end (Playwright)

Gói độc lập ở gốc workspace, chạy **API thật + web thật + MongoDB thật** rồi bấm qua giao diện như người dùng.

## Các kịch bản

| File | Kịch bản |
|---|---|
| `tests/auth.setup.ts` | Đăng nhập qua form cho chủ quán, thu ngân, phục vụ, bếp → lưu `storageState` vào `.auth/` (chỉ 4 lần đăng nhập mỗi lượt chạy vì API giới hạn đăng nhập/phút) |
| `tests/ca-ban-hang.spec.ts` | **Một ca bán hàng**: POS chọn bàn → thêm món thường + món có tuỳ chọn → Gửi bếp → KDS (tài khoản bếp, trang thứ 2) nhận món qua realtime → Bắt đầu làm → Sẵn sàng → Đã giao → Thanh toán tiền mặt, mệnh giá nhanh → "Trả lại khách" → bàn "Cần dọn" |
| `tests/goi-them.spec.ts` | **Gọi thêm món** vào đơn đang mở của T1 → "Gửi thêm" → cùng 1 đơn, thêm 1 dòng, không tạo đơn mới |
| `tests/khach-quet-qr.spec.ts` | **Khách quét QR** bàn T5 (không đăng nhập) → gọi món → nhân viên nhận toast "vừa gọi món qua QR", KDS thấy món |
| `tests/phan-quyen.spec.ts` | **Phân quyền**: phục vụ không thấy Báo cáo/Nhân viên/Cài đặt, bị đưa từ `/` sang `/pos`; bếp vào thẳng `/kds` |
| `tests/in-hoa-don.spec.ts` | **In hoá đơn**: đơn đã thu → `/print/receipt/<id>` hiện "HOÁ ĐƠN THANH TOÁN" và tổng tiền |
| `tests/bao-cao.spec.ts` | **Báo cáo & xuất CSV**: KPI hiển thị, file CSV bắt đầu bằng BOM UTF-8 và có "Xuất bởi:" |

Mỗi test dùng bàn riêng (T4/S4, T1, T5, S3) nên độc lập với nhau. Project `desktop` (1280×800) chạy tất cả;
project `tablet` (768×1024, giỏ hàng POS mở dạng sheet) chạy lại kịch bản ca bán hàng trên bàn S4.

## Cách chạy ở máy

Yêu cầu: Node 20, `corepack enable`, MongoDB replica set đang chạy
(`MONGO_PORT=27018 docker compose -f docker-compose.infra.yml up -d`), đã `yarn install` trong `ordergo-api` và `ordergo-web`.

```bash
cd e2e
corepack yarn install
npx playwright install chromium

npx playwright test          # hoặc: corepack yarn test
corepack yarn test:headed    # mở trình duyệt để xem
corepack yarn report         # xem báo cáo HTML lần chạy gần nhất
npx playwright test goi-them # chạy 1 file
```

Playwright tự làm hết phần còn lại (`playwright.config.ts`):

1. **API** (`ordergo-api`): `nest build` rồi `node dist/main.js` ở cổng **4100**, DB riêng **`ordergo_playwright`**
   (`mongodb://localhost:27018/?directConnection=true`), upload vào thư mục tạm.
2. **Web** (`ordergo-web`): `next build` (nhúng `NEXT_PUBLIC_API_URL=http://localhost:4100/v1`) rồi `next start -p 3100`.
   Chọn build + start thay vì `next dev` vì nhanh và ổn định hơn (không phải biên dịch từng trang lúc test chạy).
3. **globalSetup**: chạy `dist/scripts/seed-demo.js` → reset + seed quán demo "Cà phê Góc Phố" (≈25 giây).
4. Project `setup` đăng nhập 4 vai trò, các test dùng lại phiên đăng nhập.

Cổng 3100/4100 khác 3000/4000 nên không đụng môi trường dev. Nếu đã có server chạy sẵn ở 3100/4100, Playwright dùng lại
(`reuseExistingServer`, trừ khi `CI=1`) — khi đó tự bảo đảm server đó trỏ đúng DB `ordergo_playwright`.

### Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `E2E_SKIP_BUILD=1` | (build) | Bỏ `nest build` / `next build`, dùng bản build có sẵn (CI build ở step riêng) |
| `E2E_MONGODB_URI` | `mongodb://localhost:27018/?directConnection=true` | Mongo replica set (cần cho realtime) |
| `E2E_MONGODB_DB` | `ordergo_playwright` | Tên DB test |
| `E2E_API_PORT` / `E2E_WEB_PORT` | `4100` / `3100` | Cổng API / web |

### Lưu ý

- `next build` ghi vào `ordergo-web/.next` với URL API của test → **đừng chạy song song với `yarn dev`/`yarn build` của web**,
  và build lại web trước khi chạy dev/deploy thật.
- Cảnh báo `"next start" does not work with "output: standalone"` là vô hại.
- API giới hạn số lần đăng nhập/phút theo IP: mỗi lượt chạy chỉ đăng nhập 4 lần; chạy liên tục nhiều lượt trong 1 phút có thể bị 429.
- Seed chỉ reset tenant demo trong DB `ordergo_playwright`, nên chạy lại test bao nhiêu lần cũng được
  (nhưng `--repeat-each` trong cùng 1 lượt sẽ hỏng vì bàn đã "Cần dọn").

## CI

`.github/workflows/e2e.yml` (gốc workspace): checkout kèm submodule → Mongo replica set bằng `docker run --replSet rs0`
→ cài 3 gói → build API + web → `npx playwright install --with-deps chromium` → `yarn test` với `CI=1`
→ thất bại thì tải lên artifact `playwright-report`.
