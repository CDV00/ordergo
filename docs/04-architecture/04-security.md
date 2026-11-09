# Security & RBAC

## Threat model — ai chúng ta đề phòng

| Threat actor | Khả năng tấn công | Ưu tiên phòng |
| --- | --- | --- |
| **Script kiddie** | Brute force login, scan vuln | ⭐⭐⭐ Cao — tự động đến nhiều |
| **Đối thủ scrape data** | Tự tạo account → cào API competitive intel | ⭐⭐⭐ Cao — rate limit |
| **Nhân viên bất mãn của khách** | Lạm quyền cancel order, sửa giá, xoá log | ⭐⭐⭐ Cao — RBAC + audit |
| **Insider OrderGo** | Nhân viên truy cập data tenant không cần thiết | ⭐⭐ Trung — audit + need-to-know |
| **APT có chủ đích** | 0-day, social engineering | ⭐ Thấp — không phải target chính ở MVP |

## Defense-in-depth layers

```
[Edge: Cloudflare WAF + DDoS]
    ▼
[Network: TLS 1.3, HSTS, Security Headers]
    ▼
[App: Auth, RBAC, Tenant Isolation, Validation, Rate Limit]
    ▼
[Data: Encryption at-rest, Audit Log, Soft Delete]
    ▼
[Backup: Daily encrypted, restore tested monthly]
```

---

## 1. Authentication

### Password
- **Argon2id** hashing (memory cost 64MB, iter 3, parallelism 4)
- Min 8 chars, có chữ hoa + thường + số (không bắt special char — UX)
- Check qua haveibeenpwned API khi đổi password (optional)
- Lock account sau 5 lần fail trong 10 phút (CAPTCHA fallback)

### 2FA
- TOTP (Google Authenticator, Authy)
- **Bắt buộc** cho role: Owner, TenantAdmin, PlatformSupport
- **Khuyến khích** cho role: Manager, Accountant
- Backup codes (10 mã 1 lần dùng)

### JWT
- **RS256** (asymmetric) — không HS256
- Access token: 15 phút
- Refresh token: 30 ngày, **rotation** (mỗi lần refresh sinh token mới, invalidate cũ)
- Refresh token lưu DB, có thể revoke
- Claims tối thiểu: `sub`, `tenant_id`, `venue_id`, `roles[]`, `permissions[]` (lite), `iat`, `exp`, `jti`
- **Không** lưu PII trong JWT (email, phone)
- Key rotation 6 tháng/lần

### Session management
- Logout → blacklist `jti` đến `exp`
- Force logout all sessions (đổi password, lộ mật khẩu)
- Hiển thị active sessions cho user (Settings → Security)

---

## 2. Authorization (RBAC)

### Role chuẩn

| Role | Mô tả | Permission cốt lõi |
| --- | --- | --- |
| **Owner** | Chủ doanh nghiệp | * (mọi quyền trong tenant) |
| **TenantAdmin** | Quản trị thay owner | * (trừ billing critical) |
| **VenueManager** | Quản lý 1 cơ sở | quản lý nhân viên + báo cáo + setup venue |
| **Cashier** | Thu ngân | order.* + payment.* |
| **Server** | Phục vụ | order.create, order.update_lines, order.send |
| **Kitchen** | Bếp | order.view (KDS), order.update_status |
| **Receptionist** | Lễ tân khách sạn | booking.*, room.status |
| **Housekeeping** | Buồng phòng | room.status (limited) |
| **Accountant** (read-only) | Kế toán | report.view, einvoice.view (không edit/delete) |
| **PlatformSupport** | OrderGo support | impersonate (audit) |

### Permission naming
Pattern: `<domain>.<action>`

Ví dụ:
- `order.create`, `order.cancel`, `order.refund`, `order.view_history`
- `menu.edit`, `menu.delete`
- `report.view`, `report.export`
- `customer.export` (sensitive, default chỉ Owner)
- `payment.refund`, `payment.cash_management`
- `tenant.billing.edit`
- `audit.view`

### Authorization flow

```
Request
  ▼
JWT validate → claim user_id, tenant_id, roles
  ▼
Tenant context middleware → ITenantContext set
  ▼
Permission check (per endpoint policy):
  - Lookup user.roles in tenant
  - Check role.permissions has required
  - PASS → continue / FAIL → 403
  ▼
Tenant isolation (in repository): WHERE tenant_id = ctx.TenantId
  ▼
Audit log (if action sensitive)
```

### Custom roles (v1+)
- TenantAdmin có thể tạo role custom với cherry-picked permissions
- UI: Settings → Roles → Create
- Limit 20 role/tenant để tránh permission sprawl

---

## 3. Tenant Isolation (đã chi tiết ở `03-domain/04-multi-tenant.md`)

Tóm lược:
- `tenant_id` ở mọi entity nghiệp vụ
- Filter query ở app layer qua `ITenantContext`
- Cache key prefix `tenant:{id}:`
- Không có endpoint trả "all tenants" nào ngoài role `PlatformSupport` với audit

---

## 4. Validation & Input

- **Whitelist** thay vì blacklist
- Validate ở 3 lớp: client (UX), API (FluentValidation), DB (constraint + check)
- HTML/Script trong text field → HTML encode khi render (XSS prevention)
- SQL injection → linq2db parameterize, không string concat
- File upload:
  - Whitelist extension + magic bytes check
  - Max size: 5MB cho image, 10MB cho doc
  - Scan malware với ClamAV (v1+)
  - Lưu Object Storage, không lưu local disk
- Path traversal: không cho user input thành path

---

## 5. Encryption

### In-transit
- TLS 1.3 minimum
- HSTS với `max-age=31536000; includeSubDomains; preload`
- Certificate auto-rotate qua Let's Encrypt / Cloudflare

### At-rest
- DB level: PostgreSQL TDE (managed) — cho disk
- Field level: AES-256-GCM cho cột nhạy cảm
  - `customer.phone` (hash + searchable encryption)
  - `customer.email`
  - `customer.cccd_number` (CMND)
  - `customer.passport_number`
  - `payment.external_ref` (token cổng thanh toán)
- Key management: AWS KMS / DO secrets / HashiCorp Vault (năm 1+)
- Backup encrypted với separate key

### Application secret
- Không hardcode trong code
- Không commit `.env` thật vào git
- MVP: GitHub Secrets + sops-encrypted file
- Năm 1: AWS SSM Parameter Store / Vault

---

## 6. Audit Log

### Hành động phải log

- Login / logout / fail login
- Đổi password / 2FA setup
- Tạo / cancel / refund order
- Tạo / sửa payment
- Tạo HĐĐT
- Đổi giá menu (audit `Catalog.FB`)
- Mời / xoá user
- Đổi role / permission
- Truy cập report (cho data sensitive)
- Export data
- Tenant settings change

### Format
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",
  "action": "order.cancel",
  "entityType": "Order",
  "entityId": "uuid",
  "timestamp": "...",
  "ipAddress": "...",
  "userAgent": "...",
  "before": { ... },
  "after": { ... },
  "metadata": { "reason": "..." }
}
```

### Lưu trữ
- Bảng `audit_log` partition theo `tenant_id` + `timestamp`
- Retention 7 năm cho action tài chính (theo Luật Kế toán VN)
- Retention 1 năm cho action thường
- **Không xoá được** qua API (chỉ qua DBA flow đặc biệt)

---

## 7. Compliance VN

### NĐ 13/2023 (PDPL — bảo vệ dữ liệu cá nhân)
- [ ] Privacy policy công khai (web + checkbox đăng ký)
- [ ] Quyền truy cập, sửa, xoá, di chuyển data cá nhân — Settings → Privacy
- [ ] DPO (Data Protection Officer) chỉ định khi đạt scale
- [ ] Báo cáo Bộ Công an khi có vi phạm > 1.000 user
- [ ] Hợp đồng DPA với mọi processor (SES, FCM, ...)

### Luật Kế toán + NĐ 174/2016
- Sổ sách lưu **10 năm** với dữ liệu kế toán
- Bill, hoá đơn lưu 5 năm

### NĐ 123/2020 + TT 78/2021 + NĐ 70/2025 (HĐĐT)
- Format XML chuẩn cơ quan thuế
- Tích hợp eTax đẩy hoá đơn
- Ký số (qua đối tác VNPT/Viettel)
- Lưu HĐĐT 10 năm

### Luật ANM + NĐ 53/2022
- Lưu data người dùng VN tại VN (cho ngành regulated)
- F&B/Hospitality SMB: không bắt buộc nhưng nên có option Enterprise

---

## 8. Operational security

### Access control
- Production access: chỉ qua bastion + MFA
- Database direct access: 0 cho dev (qua tooling logged)
- SSH keys rotate 6 tháng
- Principle of least privilege

### Secrets rotation
- DB password: 6 tháng
- API key external (Momo, VNPT): 12 tháng (theo provider rule)
- JWT signing key: 6 tháng (rotation, support 2 keys cùng lúc)

### Vulnerability management
- Dependabot enabled
- `dotnet list package --vulnerable` trong CI
- Patch CVE high < 7 ngày, critical < 24h

### Penetration testing
- v1: tự test bằng OWASP ZAP
- v2: thuê pen test bên ngoài 1 lần/năm

### Backup & DR
- Daily snapshot DB, encrypt, lưu cross-region
- Restore test monthly
- RPO 5 phút (WAL streaming) — năm 1+
- RTO 1 giờ MVP → 15 phút năm 2

---

## 9. Incident Response

### Severity levels

| Sev | Mô tả | Response |
| --- | --- | --- |
| **Sev0** | Data breach, auth bypass | All-hands < 15 phút, public disclosure < 72h (NĐ 13) |
| **Sev1** | Production down | War room < 30 phút |
| **Sev2** | Degraded một phần | < 2 giờ |
| **Sev3** | Issue nhỏ | Ticket bình thường |

### Postmortem (blameless)
- Mọi sev0/1 → postmortem trong 5 ngày
- 5 whys, không đổ lỗi cá nhân
- Action items với owner + deadline
- Public summary (transparency với khách)

---

## 10. Security checklist trước khi launch MVP

- [ ] HTTPS only, HSTS enabled
- [ ] Security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] CORS whitelist domain
- [ ] Rate limit middleware
- [ ] Input validation FluentValidation cho mọi DTO
- [ ] Argon2id password hashing
- [ ] JWT RS256 với key rotation
- [ ] Tenant isolation test pass
- [ ] Audit log cho action critical
- [ ] Backup tự động + restore tested
- [ ] Privacy policy + ToS published
- [ ] OWASP Top 10 self-review
- [ ] Sentry alert configured
- [ ] Secret không có trong git history

---
*Changelog: v0.1 — 2026-05-01.*
