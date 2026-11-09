# OrderGo — Workspace

Phần mềm quản lý vận hành đa ngành (F&B → Hospitality → ...).

## Cấu trúc workspace

```
ordergo/
├── ordergo-api/             # Backend NestJS + Mongoose (submodule)
├── ordergo-web/             # Frontend Next.js: admin, POS, KDS, QR khách (submodule)
├── docs/                    # Bộ tài liệu nền tảng (00-vision → 08-database)
├── docker-compose.infra.yml # 👈 Default dev: chỉ Mongo + Redis
├── docker-compose.yml       # Production-style: build full image
└── docker-compose.dev.yml   # Override (rare): full-docker + hot reload
```

## Yêu cầu

- Node.js ≥ 20
- Yarn 4.18.1 qua corepack (`corepack enable` một lần — version lấy từ `packageManager` trong `package.json`)
- Docker Desktop ≥ 24 hoặc Docker Engine + Compose v2

Clone lần đầu (kèm submodule):
```bash
git clone --recurse-submodules https://github.com/CDV00/ordergo.git
# hoặc nếu đã clone: git submodule update --init --recursive
```

## Workflow daily (recommended)

Hạ tầng (Mongo + Redis) chạy Docker, code chạy native — fastest hot reload, debugger attach dễ, IDE tooling chuẩn.

```bash
# Lần đầu setup
cd ordergo-api && yarn install && cd ..
cd ordergo-web && yarn install && cd ..

# Mỗi ngày
docker compose -f docker-compose.infra.yml up -d   # Mongo replica set + Redis
cd ordergo-api && yarn start:dev                    # Tab 1: BE watch mode
cd ordergo-web && yarn dev                          # Tab 2: FE turbopack
```

Truy cập:
- Web: http://localhost:3000
- API: http://localhost:4000
- Swagger: http://localhost:4000/api-docs
- Mongo: `mongodb://localhost:27017/?replicaSet=rs0&directConnection=true` (đã set sẵn ở `ordergo-api/.env.development`)

Port 27017/6379 đã bị chiếm trên máy? Đổi port host: `MONGO_PORT=27018 REDIS_PORT=6380 docker compose -f docker-compose.infra.yml up -d` rồi sửa `MONGODB_URI` tương ứng.

### Dữ liệu demo

```bash
cd ordergo-api && yarn seed:demo
```

Tạo quán **"Cà phê Góc Phố"**: 30 món (biến thể size, mức đường/đá, topping), 12 bàn ở 3 khu, 7 ngày lịch sử (~360 đơn), các đơn đã thu hôm nay và 4 bàn đang phục vụ (chờ bếp / đang làm / đã xong / nháp). Chạy lại bất kỳ lúc nào để reset — chỉ xoá dữ liệu của tenant demo.

| SĐT | Vai trò |
| --- | --- |
| 0900000001 | Chủ quán (owner) |
| 0900000002 | Quản lý (venue_manager) |
| 0900000003 | Thu ngân (cashier) |
| 0900000004 | Phục vụ (server) |
| 0900000005 | Bếp (kitchen) |

Mật khẩu chung `ordergo123` (đổi bằng `DEMO_PASSWORD`). Thanh toán VietQR cần tài khoản thật của quán: đặt `DEMO_BANK_BIN`, `DEMO_BANK_NAME`, `DEMO_BANK_ACCOUNT`, `DEMO_BANK_ACCOUNT_NAME` trước khi seed. Trong Docker: `docker compose exec api node dist/scripts/seed-demo.js --force` (cần `--force` vì `NODE_ENV=production`).

Stop:
```bash
docker compose -f docker-compose.infra.yml down       # giữ data
docker compose -f docker-compose.infra.yml down -v    # XOÁ data Mongo + Redis
```

## Workflow production-style (test trước deploy)

Build full image BE + FE chạy hoàn toàn trong Docker — verify Dockerfile + production behavior:

```bash
cp .env.example .env
# Đổi JWT secrets trong .env

docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose down
```

> Lần đầu build mất ~2-3 phút; lần sau cache nhanh.

## Workflow full-docker dev (option, hiếm dùng)

Mọi thứ trong Docker với volume mount cho hot reload — chỉ dùng khi không muốn cài Node local:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Hot reload chậm hơn native (đặc biệt Windows/Mac filesystem qua Docker Desktop), debugger attach phức tạp hơn → **không khuyến nghị làm default**.

## Mongo replica set

Cả 3 compose file dùng replica set single-node `rs0` (bắt buộc cho transactions: setupWizard, payment, …). Healthcheck tự động khởi tạo lần đầu — không cần thao tác tay.

Lý do `directConnection=true` trong connection string từ host:
- Replica set advertise member là `mongo:27017` (tên container, không phải `localhost`)
- BE chạy native từ host machine không resolve được `mongo:27017`
- `directConnection=true` bảo driver bỏ qua discovery, dùng URI host đã chỉ định

Khi BE chạy trong Docker (workflow prod-style), dùng `mongodb://mongo:27017/...&directConnection=true`.

## Quản lý data

Mỗi workflow có project name + volume riêng (data tách biệt):

| Workflow | Project name | Mongo volume |
| --- | --- | --- |
| infra (daily dev) | `ordergo-infra` | `ordergo-infra_mongo-data` |
| full prod-style | `ordergo` | `ordergo_mongo-data` |

→ `docker compose -f infra.yml down` không ảnh hưởng data của full prod-style và ngược lại.

Backup nhanh:
```bash
docker exec ordergo-mongo mongodump \
  --uri "mongodb://localhost:27017/?replicaSet=rs0&directConnection=true" \
  --db ordergo --out /tmp/backup
docker cp ordergo-mongo:/tmp/backup ./backup-$(date +%Y%m%d)
```

## Test E2E flow

1. `docker compose -f docker-compose.infra.yml up -d`
2. `cd ordergo-api && yarn start:dev` (tab 1)
3. `cd ordergo-web && yarn dev` (tab 2)
4. Mở http://localhost:3000 → redirect `/login`
5. Tab **Đăng ký** → SĐT (vd `0901234567`) + password ≥ 8 ký tự
6. Setup wizard → tên doanh nghiệp + cơ sở đầu → submit
7. Vào **Menu** → tạo nhóm "Cà phê" → thêm món "Cà phê đen đá" 25.000đ
8. Vào **Bàn ăn** → tạo bàn 1, đổi trạng thái

## Tài liệu

- [Bộ tài liệu nền tảng](docs/README.md)
- [Database schema](docs/08-database/02-mongodb-schema.md)
- [API Guidelines](docs/04-architecture/03-api-guidelines.md)
- [Microservice readiness](docs/08-database/04-microservice-readiness.md)
- [Deploy staging/demo lên VPS](docs/06-process/04-deploy-staging.md)

## Deploy staging / demo (1 VPS)

`docker-compose.prod.yml` + thư mục `deploy/` (Caddy HTTPS tự động, backup Mongo hằng ngày, script deploy/seed/restore). Runbook từng bước: **[docs/06-process/04-deploy-staging.md](docs/06-process/04-deploy-staging.md)**.

```bash
cp deploy/.env.staging.example .env   # điền domain + secrets
chmod +x deploy/*.sh && ./deploy/deploy.sh
```

## Cấu hình production

Trước khi deploy thật, **bắt buộc**:
- [ ] Đổi JWT secrets sang chuỗi random unique (≥ 32 ký tự, không reuse từ dev)
- [ ] Đặt `NODE_ENV=production`
- [ ] Reverse proxy (Caddy / Nginx / Traefik) trước `web` và `api` với HTTPS
- [ ] **Bỏ `mongo` service trong `docker-compose.yml`** — production dùng MongoDB Atlas / managed cluster có auth + TLS + backup
- [ ] Đặt `CORS_ORIGINS` chính xác domain frontend
- [ ] Đặt `PUBLIC_API_URL` thành domain thật trước khi build FE (NEXT_PUBLIC_* bake vào bundle build-time)
- [ ] Backup tự động Mongo + cross-region replica
- [ ] Sentry/observability
- [ ] Cookie httpOnly thay localStorage cho refresh token

## Cleanup

```bash
docker compose -f docker-compose.infra.yml down -v   # xoá hạ tầng dev + data
docker compose down -v                               # xoá full prod-style + data
docker system prune                                  # dọn image dangling
```
