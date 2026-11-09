# 08 — Database

Tài liệu thiết kế dữ liệu cho OrderGo. Đối tượng đọc: BE engineer, DBA, Tech Lead.

## Stack đã chọn (v0.2 — 2026-05-01)

- **Primary database**: **MongoDB** (Atlas hoặc tự host replica set)
- **ODM**: Mongoose (NestJS native)
- **Search/Analytics tương lai**: PostgreSQL replica qua Change Streams (chỉ thêm khi cần — không phải MVP)
- **Cache**: Redis (cache + queue + pub/sub)
- **Object Storage**: S3-compatible (DO Spaces / Cloudflare R2)

## Cấu trúc tài liệu

| File | Nội dung | Audience |
| --- | --- | --- |
| [01-database-strategy.md](01-database-strategy.md) | Chiến lược DB tổng thể, nguyên tắc thiết kế, quy ước đặt tên | Tất cả |
| [02-mongodb-schema.md](02-mongodb-schema.md) | Schema chi tiết từng collection per module | BE, DBA |
| [03-indexing-strategy.md](03-indexing-strategy.md) | Compound index, TTL, text, sharding | BE, DBA |
| [04-microservice-readiness.md](04-microservice-readiness.md) | Patterns để dễ tách microservice sau này | Tech Lead, BE |
| [05-postgres-sync-and-migration.md](05-postgres-sync-and-migration.md) | Khi nào thêm Postgres OLAP, plan migrate sang relational/.NET | Tech Lead |

## Quy ước nhanh

- **Collection naming**: `snake_case` số nhiều — `tenants`, `menu_items`, `order_lines`
- **Field naming trong document**: `camelCase` — `tenantId`, `createdAt`
- **ID**: `ObjectId` cho `_id` chính, **UUID v7** cho ID public/cross-module reference (`tenantId`, `venueId`, ...)
- **Multi-tenant**: mọi document nghiệp vụ có `tenantId` — không có ngoại lệ
- **Soft delete**: `deletedAt` field, query mặc định filter null
- **Audit**: `createdAt`, `updatedAt`, `createdBy`, `updatedBy` ở mọi document
- **Money**: `{ amount: number, currency: "VND" }`, dùng integer (đơn vị nhỏ nhất hoặc x100 cho float-safe)
- **Cross-module reference**: chỉ Guid + snapshot. KHÔNG dùng Mongoose `ref` xuyên module.

## Document sống

Bộ tài liệu này là **single source of truth cho schema**. Khi có migration, update file tương ứng + bump phiên bản đầu file.
