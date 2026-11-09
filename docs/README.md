# OrderGo — Bộ tài liệu nền tảng

Bộ tài liệu này là **single source of truth** cho sản phẩm OrderGo: từ tầm nhìn, mô hình kinh doanh, sản phẩm, đến kiến trúc kỹ thuật và lộ trình triển khai. Mọi quyết định lớn nên tham chiếu về đây trước khi bàn cãi trên Slack/họp.

## Cách dùng tài liệu này

- **Founder / nhà đầu tư**: đọc theo thứ tự `00-vision` → `01-business` → `05-roadmap`.
- **Product manager / BA**: tập trung `02-product` → `03-domain` → `05-roadmap`.
- **Tech lead / kỹ sư**: tập trung `03-domain` → `04-architecture` → `06-process`.
- **Người mới vào team**: đọc lần lượt từ `00` → `07`, trong nửa ngày là đủ ngữ cảnh.

Tài liệu là **sống** — khi quyết định thay đổi, hãy update file tương ứng và ghi changelog ở cuối file. Đừng để doc lệch với code.

## Cấu trúc

| Folder | Mục đích | Người chịu trách nhiệm |
| --- | --- | --- |
| [00-vision/](00-vision/) | Tầm nhìn, sứ mệnh, chiến lược mở rộng vertical | Founder |
| [01-business/](01-business/) | Phân tích thị trường, mô hình kinh doanh, pricing, GTM | Founder + Sales |
| [02-product/](02-product/) | Personas, PRD, MVP scope, feature catalog | PO/PM |
| [03-domain/](03-domain/) | Glossary, domain model, module catalog, multi-tenant | PO + Tech Lead |
| [04-architecture/](04-architecture/) | Kiến trúc, tech stack, API, security, NFR | Tech Lead |
| [05-roadmap/](05-roadmap/) | Roadmap 12 tháng, milestones, backlog MVP | PM |
| [06-process/](06-process/) | Workflow phát triển, DoD, release | Tech Lead + PM |
| [07-risks/](07-risks/) | Rủi ro, giả định, mitigation | Founder |
| [08-database/](08-database/) | Strategy DB, schema MongoDB, indexing, microservice readiness | DBA + BE |

## Danh mục nhanh

### 00 — Vision & Strategy
- [Tầm nhìn & Sứ mệnh](00-vision/01-vision-mission.md)
- [Chiến lược đa vertical](00-vision/02-strategy.md)
- [Giá trị cốt lõi & văn hoá team](00-vision/03-core-values.md)

### 01 — Business
- [Phân tích thị trường](01-business/01-market-analysis.md)
- [Đối thủ cạnh tranh](01-business/02-competitors.md)
- [Mô hình kinh doanh & Pricing](01-business/03-business-model.md)
- [Go-to-Market](01-business/04-go-to-market.md)

### 02 — Product
- [Personas](02-product/01-personas.md)
- [User Journey](02-product/02-user-journey.md)
- [Product Requirements (PRD)](02-product/03-prd.md)
- [MVP Scope](02-product/04-mvp-scope.md)
- [Feature Catalog](02-product/05-feature-catalog.md)

### 03 — Domain
- [Glossary](03-domain/01-glossary.md)
- [Domain Model](03-domain/02-domain-model.md)
- [Module Catalog](03-domain/03-module-catalog.md)
- [Multi-tenant & Multi-vertical](03-domain/04-multi-tenant.md)

### 04 — Architecture
- [Tổng quan kiến trúc](04-architecture/01-overview.md)
- [Tech Stack](04-architecture/02-tech-stack.md)
- [API Guidelines](04-architecture/03-api-guidelines.md)
- [Security & RBAC](04-architecture/04-security.md)
- [Non-functional Requirements](04-architecture/05-nfr.md)

### 05 — Roadmap
- [Roadmap 12 tháng](05-roadmap/01-roadmap.md)
- [Milestones](05-roadmap/02-milestones.md)
- [MVP Backlog](05-roadmap/03-mvp-backlog.md)

### 06 — Process
- [Development Workflow](06-process/01-workflow.md)
- [Definition of Done](06-process/02-definition-of-done.md)
- [Release Process](06-process/03-release.md)

### 07 — Risks
- [Risks & Mitigation](07-risks/01-risks.md)
- [Assumptions](07-risks/02-assumptions.md)

### 08 — Database
- [Database Strategy](08-database/01-database-strategy.md)
- [MongoDB Schema](08-database/02-mongodb-schema.md)
- [Indexing & Performance](08-database/03-indexing-strategy.md)
- [Microservice Readiness](08-database/04-microservice-readiness.md)
- [Postgres Sync & Migration](08-database/05-postgres-sync-and-migration.md)

## Trạng thái tài liệu (v0.1 — 2026-05-01)

Bản đầu tiên do founder + AI cùng phác thảo. **Cần review và iterate** sau buổi họp kickoff:
- Xác nhận thị trường mục tiêu (VN-first hay đa quốc gia)
- Chốt mô hình pricing
- Chốt scope MVP (8–12 tuần)
- ~~Chốt stack backend~~ → **NestJS + MongoDB** (v0.3, 2026-11-09). Các đoạn còn nhắc .NET/PostgreSQL trong bộ doc là lịch sử hoặc phương án tương lai.
