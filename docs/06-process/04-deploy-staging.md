# Deploy staging / demo lên 1 VPS

> Runbook cho người vận hành. Kết quả: OrderGo chạy trên 1 VPS Ubuntu với HTTPS tự động, Mongo replica set, backup hằng ngày.
> File liên quan: `docker-compose.prod.yml`, `deploy/` (Caddyfile, script, `.env.staging.example`).
> Đây là môi trường **staging/demo**, chưa phải production thật (xem mục 13).

## 0. Kiến trúc

```
Internet ──80/443──▶ caddy ──▶ web:3000   (WEB_DOMAIN, vd demo.example.com)
                          └──▶ api:4000   (API_DOMAIN, vd api.demo.example.com: /v1, /uploads, /socket.io, /api-docs)
                                  │
                         mongo:27017 (rs0, KHÔNG mở ra ngoài) ◀── backup (mongodump hằng ngày → volume backups)
```

| Service | Image | Ghi chú |
| --- | --- | --- |
| `mongo` | `mongo:7` | Replica set `rs0` 1 node, healthcheck tự `rs.initiate`. Không publish port. |
| `api` | build `./ordergo-api` | `NODE_ENV=production`, ảnh upload ở volume `uploads-data` (`/app/uploads`). |
| `web` | build `./ordergo-web` | `NEXT_PUBLIC_API_URL` = `PUBLIC_API_URL` bake lúc build. |
| `caddy` | `caddy:2` | Duy nhất mở port 80/443 (+443/udp HTTP/3). Chứng chỉ Let's Encrypt trong volume `caddy-data`. |
| `backup` | `mongo:7` | `deploy/backup-loop.sh`: mỗi ngày 03:00 (giờ VN) dump DB + nén ảnh upload, giữ 14 bản. |

Tất cả `restart: unless-stopped`, log `json-file` xoay vòng 10MB × 5 file / container. Project name `ordergo-prod` → volume tên `ordergo-prod_mongo-data`, `ordergo-prod_backups`, …

## 1. Chọn VPS & chi phí

| Gói (DigitalOcean Basic, tham khảo) | Giá ước tính | Dùng khi |
| --- | --- | --- |
| 1 vCPU / 2GB / 50GB | ~12 USD/tháng | Demo ít người. **Bắt buộc thêm swap 2GB** (build Next.js tốn RAM). |
| 2 vCPU / 4GB / 80GB | ~24 USD/tháng | **Khuyến nghị** — build nhanh hơn, demo nhiều thiết bị cùng lúc. |

- Region: Singapore (`sgp1`) cho độ trễ thấp từ Việt Nam. Ubuntu 24.04 LTS.
- Tuỳ chọn: bật "Backups" của nhà cung cấp (+20% giá) — snapshot cả máy, bổ sung cho backup Mongo.
- Giá thay đổi theo thời gian — kiểm tra lại trên trang nhà cung cấp. Nhà cung cấp khác (Vultr, Linode, VPS trong nước) làm tương tự.

## 2. DNS

Tạo 2 bản ghi **A** trỏ về IP public của VPS (TTL 300 lúc đầu):

| Loại | Tên | Giá trị |
| --- | --- | --- |
| A | `demo` (→ `demo.example.com`) | `<IP VPS>` |
| A | `api.demo` (→ `api.demo.example.com`) | `<IP VPS>` |

- Có IPv6 thì thêm bản ghi **AAAA** tương ứng; không có thì **đừng** để AAAA cũ trỏ chỗ khác (Let's Encrypt sẽ thử IPv6 trước và lỗi).
- Dùng Cloudflare: để **DNS only** (mây xám) ít nhất đến khi Caddy lấy được chứng chỉ.
- Kiểm tra: `dig +short demo.example.com` và `dig +short api.demo.example.com` đều ra IP VPS.

## 3. Chuẩn bị máy (chạy 1 lần, user root hoặc sudo)

```bash
# Cập nhật + tạo user deploy
apt update && apt -y upgrade
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh

# Múi giờ (log dễ đọc; app tự tính theo timezone của venue)
timedatectl set-timezone Asia/Ho_Chi_Minh

# Swap 2GB — bắt buộc với VPS 2GB
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Firewall (ufw): chỉ 22, 80, 443

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp      # HTTP/3 (tuỳ chọn)
ufw enable
ufw status verbose
```

> Docker tự thêm rule iptables cho port được publish và **bỏ qua ufw**. Stack này chỉ publish port của Caddy (80/443) — Mongo/API/Web không publish nên vẫn kín. Đừng thêm `ports:` cho `mongo` vào `docker-compose.prod.yml`.
> Nên tắt đăng nhập SSH bằng mật khẩu (`PasswordAuthentication no` trong `/etc/ssh/sshd_config`) sau khi chắc chắn SSH key hoạt động.

### Cài Docker Engine + Compose v2 (repo chính thức)

```bash
apt -y install ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker deploy
docker compose version    # cần ≥ 2.24 (env_file "required: false")
```

Đăng xuất, đăng nhập lại bằng `deploy` để nhóm `docker` có hiệu lực.

## 4. Clone code (kèm submodule)

```bash
# user deploy
cd ~
git clone --recurse-submodules https://github.com/CDV00/ordergo.git
cd ordergo
git checkout phase4/demo-ready            # hoặc nhánh được chọn để demo (main sau khi merge)
git submodule update --init --recursive
chmod +x deploy/*.sh
```

- Repo private: tạo **deploy key** (read-only) cho cả 3 repo, hoặc dùng token HTTPS chỉ quyền đọc. Submodule dùng URL trong `.gitmodules`.
- Script trong `deploy/` phải là LF (đã ép bởi `.gitattributes`). Lỗi `/usr/bin/env: 'bash\r'` = file bị CRLF → `git config core.autocrlf false && git checkout -- deploy/`.

## 5. Điền `.env`

```bash
cp deploy/.env.staging.example .env
chmod 600 .env
openssl rand -hex 48     # chạy 2 lần: 1 cho JWT_ACCESS_SECRET, 1 cho JWT_REFRESH_SECRET
nano .env
```

Bắt buộc sửa:

| Biến | Ví dụ | Ghi chú |
| --- | --- | --- |
| `WEB_DOMAIN` | `demo.example.com` | Hostname web (không có `https://`). |
| `API_DOMAIN` | `api.demo.example.com` | Hostname API. |
| `PUBLIC_API_URL` | `https://api.demo.example.com/v1` | Bake vào bundle web — đổi phải build lại (deploy.sh luôn build). |
| `CORS_ORIGINS` | `https://demo.example.com` | Đúng origin web, không có `/` cuối. Nhiều origin: phân cách bằng dấu phẩy. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | `openssl rand -hex 48` | ≥ 32 ký tự, 2 giá trị khác nhau, không dùng lại từ dev. |

Tuỳ chọn: `MONGODB_DB` (mặc định `ordergo`), `MONGO_CACHE_GB` (0.5 cho 2GB, 1 cho 4GB), `BACKUP_KEEP`, `BACKUP_HOUR_UTC`, `SENTRY_DSN`, `DEMO_*` (mục 7), Mongo auth (mục 11).

`deploy.sh` từ chối chạy nếu JWT secret còn `change_me…` hoặc domain còn `demo.example.com`.

## 6. Deploy lần đầu

```bash
./deploy/deploy.sh
```

Script làm: `git pull --ff-only` → `git submodule update --init --recursive` → `docker compose -f docker-compose.prod.yml --env-file .env up -d --build --remove-orphans --wait` → in `docker compose ps` → curl thử `https://<API_DOMAIN>/v1/health/ready` và `https://<WEB_DOMAIN>/login`. Lần đầu build mất ~5–10 phút trên VPS nhỏ.

Alias tiện dùng (thêm vào `~/.bashrc`):

```bash
alias dcp='docker compose -f ~/ordergo/docker-compose.prod.yml --env-file ~/ordergo/.env'
# Nếu bật Mongo auth: thêm  -f ~/ordergo/deploy/docker-compose.mongo-auth.yml  sau file đầu tiên
dcp ps
dcp logs -f --tail 100 api
```

## 7. Seed dữ liệu demo

> ⚠️ Seed tạo các tài khoản **công khai** `0900000001`…`0900000005` (owner, venue_manager, cashier, server, kitchen) với mật khẩu `ordergo123` **nếu không đặt `DEMO_PASSWORD`**. Ai biết domain đều đăng nhập được với quyền chủ quán demo.
> - **Luôn đặt `DEMO_PASSWORD`** trong `.env` trước khi seed trên server có domain public.
> - **KHÔNG BAO GIỜ** chạy seed trên server chứa dữ liệu khách hàng thật. Seed chỉ reset tenant demo, nhưng vẫn tạo tài khoản đăng nhập trên chính DB đó.

```bash
nano .env      # bỏ comment DEMO_PASSWORD=... ; VietQR: DEMO_BANK_* = tài khoản THẬT của quán demo (không bịa)
./deploy/seed-demo.sh          # hỏi xác nhận; --yes để bỏ qua
```

Script chạy `node dist/scripts/seed-demo.js --force` trong container `api` (cần `--force` vì `NODE_ENV=production`), truyền các biến `DEMO_*` có giá trị trong `.env`. Chạy lại bất kỳ lúc nào để reset dữ liệu demo về ban đầu (vd. trước mỗi buổi demo).

## 8. Kiểm tra sau deploy

1. **Container**: `dcp ps` → `mongo`, `api`, `web` đều `healthy`; `caddy`, `backup` `running`.
2. **Health**:
   ```bash
   curl -s https://api.demo.example.com/v1/health          # {"data":{"status":"ok",...}}
   curl -s https://api.demo.example.com/v1/health/ready    # mongo: connected
   curl -sI https://demo.example.com/login | head -5       # 200, có Strict-Transport-Security
   ```
3. **HTTPS**: mở `https://demo.example.com` → ổ khoá hợp lệ; `http://` tự chuyển sang `https://`.
4. **Đăng nhập** bằng từng vai trò demo (`0900000001` owner → thấy dashboard; `0900000005` kitchen → vào KDS).
5. **QR trên điện thoại** (dùng 4G, không dùng Wi-Fi cùng mạng để chắc chắn đi qua internet):
   mở trang in QR bàn `https://demo.example.com/tables/qr` (từ màn **Bàn ăn**) → quét QR một bàn bằng camera điện thoại → trang gọi món `https://demo.example.com/m/<tenantSlug>/t/<tableId>` mở ra (QR lấy origin của trang đang mở — luôn in QR khi đang truy cập qua domain thật, không in từ `localhost`) → thêm món, gửi đơn.
6. **Realtime**: laptop mở **KDS** (bấm "Bật âm báo") và **POS**. Đặt món từ điện thoại → KDS hiện đơn mới **không cần reload** (có toast/âm báo). Bếp bấm xong món → trang khách trên điện thoại cập nhật trạng thái.
   - DevTools → Network → WS: request `wss://api.demo.example.com/socket.io/?EIO=4&transport=websocket` trạng thái **101**.
7. **Upload ảnh**: Menu → sửa món → tải ảnh JPG < 2MB → ảnh hiển thị (URL `https://api.demo.example.com/uploads/...`).
8. **Backup**: `./deploy/backup-now.sh` → thấy file `ordergo-ordergo-*.archive.gz` mới.

## 9. Cập nhật phiên bản

```bash
cd ~/ordergo
./deploy/deploy.sh
```

- Code mới phải được merge/push vào nhánh mà VPS đang checkout (kể cả **con trỏ submodule** trong repo workspace — commit submodule xong phải commit pointer ở workspace).
- `deploy/.deploy-history` ghi thời điểm + commit của mỗi lần deploy (dùng để rollback).
- Downtime: vài giây khi container `api`/`web` được thay. Nên deploy ngoài giờ demo.
- Đổi `PUBLIC_API_URL`/domain → chỉ cần `./deploy/deploy.sh` (luôn `--build`).
- Chỉ sửa `deploy/Caddyfile` → `dcp exec caddy caddy reload --config /etc/caddy/Caddyfile` (không ngắt kết nối).

## 10. Rollback

```bash
cd ~/ordergo
tail -5 deploy/.deploy-history          # chọn commit workspace trước đó, vd a1b2c3d
git checkout a1b2c3d                     # HEAD detached — đúng ý
./deploy/deploy.sh --no-pull             # submodule update + build lại đúng commit đó
```

Quay lại nhánh khi đã sửa xong: `git checkout phase4/demo-ready && ./deploy/deploy.sh`.

- Rollback code **không** rollback dữ liệu. Nếu bản mới đã đổi dữ liệu không tương thích → khôi phục backup (mục 12) — chụp backup ngay **trước** mỗi lần deploy lớn: `./deploy/backup-now.sh`.

## 11. MongoDB auth (bật / tắt)

**Mặc định: TẮT.** Mongo chỉ nằm trong network nội bộ Docker (`backend`), không publish port, ufw chặn mọi port khác 22/80/443 → chỉ container `api`/`backup` truy cập được. Chấp nhận được cho demo; **bắt buộc bật** nếu có dữ liệu thật hoặc nhiều người có quyền vào VPS.

### Bật ngay từ deploy đầu tiên (volume Mongo còn trống)

```bash
openssl rand -hex 24                          # → MONGO_ROOT_PASSWORD (hex: không cần URL-encode)
openssl rand -base64 756 | tr -d '\n'         # → MONGO_REPLICA_KEY (keyFile cho replica set)
nano .env
#   MONGO_ROOT_USER=ordergo_root
#   MONGO_ROOT_PASSWORD=<hex ở trên>
#   MONGO_REPLICA_KEY=<chuỗi base64 ở trên>
#   MONGODB_URI=mongodb://ordergo_root:<hex ở trên>@mongo:27017/?replicaSet=rs0&directConnection=true&authSource=admin
./deploy/deploy.sh
```

Khi `.env` có `MONGO_ROOT_USER`, mọi script trong `deploy/` tự thêm `-f deploy/docker-compose.mongo-auth.yml` (entrypoint ghi keyFile, `--keyFile`, healthcheck đăng nhập bằng root). `api` và `backup` dùng chung `MONGODB_URI` có user/pass.
Kiểm tra: `dcp exec mongo mongosh --quiet --eval 'db.adminCommand({listDatabases:1})'` phải báo `Unauthorized`.

### Bật sau khi đã có dữ liệu

`MONGO_INITDB_ROOT_*` chỉ có tác dụng khi `/data/db` trống, nên phải tạo user bằng tay trước:

```bash
./deploy/backup-now.sh
dcp exec mongo mongosh --quiet --eval \
  'db.getSiblingDB("admin").createUser({user:"ordergo_root", pwd:"<MẬT KHẨU HEX>", roles:["root"]})'
# điền 4 biến như trên vào .env rồi:
./deploy/deploy.sh
```

Tắt lại: xoá/comment 4 biến đó trong `.env` (user vẫn còn trong DB nhưng không bắt buộc) rồi `./deploy/deploy.sh`.

## 12. Backup & khôi phục

### Backup tự động

- Container `backup` chạy `mongodump --archive --gzip --db <MONGODB_DB>` mỗi ngày lúc `BACKUP_HOUR_UTC` (mặc định 20 UTC = 03:00 giờ VN), kèm `uploads-*.tar.gz` (ảnh upload). Giữ `BACKUP_KEEP` (14) bản mới nhất mỗi loại trong volume `ordergo-prod_backups`.
- Xem log: `dcp logs --tail 20 backup`. Liệt kê: `dcp exec backup ls -lht /backups`.
- Backup ngay: `./deploy/backup-now.sh`.
- **Backup nằm trên cùng VPS** — mất VPS là mất backup. Copy ra ngoài định kỳ:
  ```bash
  ./deploy/backup-now.sh --copy-to ~/ordergo-backups
  # từ máy khác:
  scp deploy@<IP>:~/ordergo-backups/* ./
  ```
  (hoặc bật snapshot của nhà cung cấp / đồng bộ lên S3, Spaces bằng `rclone`).

### Khôi phục DB

```bash
dcp exec backup ls -lht /backups                                    # chọn file
./deploy/restore.sh ordergo-ordergo-20261110-200000Z.archive.gz     # tên file trong volume
./deploy/restore.sh ~/ordergo-backups/ordergo-ordergo-....archive.gz  # hoặc file trên host
```

Script: bắt **gõ đúng tên DB** để xác nhận → tự backup trạng thái hiện tại (phòng khi khôi phục nhầm) → dừng `api` → `mongorestore --archive --gzip --drop --nsInclude='<db>.*'` → bật lại `api` và chờ healthy.

- `--drop` chỉ xoá các collection **có trong bản backup** rồi ghi lại; collection sinh ra sau thời điểm backup vẫn còn.
- Lệnh tay tương đương (khi script không dùng được):
  ```bash
  dcp stop api
  dcp exec -T backup bash -c 'mongorestore --uri="$MONGODB_URI" --archive=/backups/<file> --gzip --drop --nsInclude="ordergo.*"'
  dcp start api
  ```

### Khôi phục ảnh upload

```bash
dcp stop api
docker run --rm -v ordergo-prod_uploads-data:/u -v ordergo-prod_backups:/b alpine \
  sh -c 'tar -xzf /b/uploads-<thời điểm>.tar.gz -C /u && chown -R 1001:1001 /u'
dcp start api
```

### Diễn tập khôi phục (nên làm 1 lần sau deploy đầu, rồi mỗi tháng)

1. `./deploy/backup-now.sh` → ghi lại tên file.
2. Trên web: tạo 1 món "TEST RESTORE".
3. `./deploy/restore.sh <file ở bước 1>` → món "TEST RESTORE" biến mất, đăng nhập/đơn cũ vẫn bình thường.
4. Ghi lại thời gian khôi phục thực tế vào nhật ký vận hành.

## 13. Xử lý sự cố

### Caddy không lấy được chứng chỉ (trình duyệt báo lỗi SSL)

- `dcp logs caddy | grep -i -E "error|acme|challenge"`.
- DNS chưa trỏ đúng (`dig +short <domain>`), còn bản ghi AAAA sai, hoặc Cloudflare đang bật proxy (mây cam) → chuyển DNS only.
- Port 80/443 bị chặn: `ufw status`, firewall của nhà cung cấp (DigitalOcean Cloud Firewall) phải mở 80/443.
- Bị rate limit Let's Encrypt (thử quá nhiều lần): chờ 1 giờ; khi thử nghiệm thêm vào khối global của `deploy/Caddyfile`:
  `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory` (chứng chỉ test, trình duyệt sẽ cảnh báo) — nhớ bỏ đi sau đó.
- **Không xoá** volume `ordergo-prod_caddy-data` (chứa chứng chỉ + account ACME).

### Realtime không chạy (KDS phải reload mới thấy đơn)

- DevTools → Network → WS: không có request `socket.io` trạng thái 101 → kiểm tra:
  - `CORS_ORIGINS` khớp **chính xác** origin web (`https://demo.example.com`, không `/` cuối, đúng http/https). Socket.IO dùng chung danh sách này.
  - `PUBLIC_API_URL` đúng domain API (bundle web cũ còn trỏ `localhost`? → `./deploy/deploy.sh` để build lại).
  - Proxy/CDN phía trước Caddy có chặn WebSocket không (Cloudflare: bật WebSockets).
- `dcp logs api | grep -i -E "realtime|change stream"`: cảnh báo "replica set"/change stream → xem mục Mongo bên dưới. Client tự fallback polling (chậm ~vài giây) nên app vẫn dùng được.

### Mongo: replica set chưa khởi tạo / api không kết nối được

- `dcp ps` → `mongo` không `healthy`: `docker inspect --format '{{json .State.Health}}' $(dcp ps -q mongo) | head -c 2000`.
- Khởi tạo tay:
  ```bash
  dcp exec mongo mongosh --quiet --eval 'rs.status().ok' \
    || dcp exec mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'mongo:27017'}]})"
  ```
- Lỗi kiểu `NotYetInitialized`/`no replset config` sau khi đổi tên service/project: member phải là `mongo:27017`. Sửa: `rs.reconfig({_id:'rs0',members:[{_id:0,host:'mongo:27017'}]},{force:true})`.
- Bật auth: `Authentication failed` → kiểm tra `MONGODB_URI` khớp user/pass, có `authSource=admin`; mật khẩu có ký tự đặc biệt phải URL-encode (dùng hex để tránh).
- Thiếu RAM (container mongo bị OOM kill, `dmesg | grep -i oom`): giảm `MONGO_CACHE_GB`, thêm swap, hoặc nâng VPS.

### Lỗi CORS trên trình duyệt

- Console báo `blocked by CORS policy` → `CORS_ORIGINS` sai. Sửa `.env` → `./deploy/deploy.sh` (hoặc `dcp up -d api`).
- Request đi tới `http://localhost:4000` → web build với `PUBLIC_API_URL` cũ → build lại.

### Khác

- `502` từ Caddy: `api`/`web` chưa lên hoặc đang restart → `dcp ps`, `dcp logs --tail 100 api`.
- Upload ảnh báo `413`: vượt `request_body max_size 3MB` của Caddy (API giới hạn 2MB).
- Build web bị kill (`exit code 137`): hết RAM → thêm swap (mục 3).
- Hết đĩa: `docker system df`, `docker builder prune -f` (deploy.sh đã dọn image dangling).
- Đăng nhập được nhưng refresh bị out ngay: kiểm tra đồng hồ VPS (`timedatectl`) và 2 JWT secret không bị đổi giữa các lần deploy.

## 14. Những gì còn thiếu so với production thật

- Mongo 1 node trên cùng VPS (không HA). Production: MongoDB Atlas / cluster 3 node có TLS + backup PITR.
- Swagger `/api-docs` đang public trên API domain — cân nhắc chặn bằng Caddy (`basic_auth`) hoặc tắt ở API.
- Rate limit theo IP ở API cần `trust proxy` (Caddy gửi `X-Forwarded-For`) — phối hợp với phần hardening API.
- Backup off-site tự động, giám sát uptime (UptimeRobot/BetterStack ping `/v1/health/ready`), Sentry (`SENTRY_DSN`).
- Refresh token trong localStorage (README → "Cấu hình production").
