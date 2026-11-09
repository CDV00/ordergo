# Release Process

## Cadence

| Loại release | Tần suất | Approval |
| --- | --- | --- |
| **Hotfix** (sev0/1) | Khi cần | Tech Lead |
| **Continuous deploy** to staging | Sau mỗi merge main | Tự động |
| **Production deploy** | Daily 16:00 ICT (off-peak) | Tech Lead |
| **Major release** (milestone) | 1–2 tháng/lần | Founder + Tech Lead + PM |

## Versioning

### Backend API: **API path versioning**
- `/v1/`, `/v2/` — major version
- Minor/patch không version trong URL — backwards-compatible
- Breaking change → bump major + 12 tháng dual support

### Backend code: **CalVer** (Calendar Versioning)
- `YYYY.MM.DD-<short-sha>` — vd: `2026.05.01-a1b2c3`
- Đơn giản, biết được build từ khi nào

### Web app: **Build hash + tag**
- Mỗi deploy có `NEXT_PUBLIC_DEPLOY_TAG_OR_COMMIT_HASH` (đã có ở Dockerfile)
- Cookie/header gửi tag cho debug

### Mobile: **SemVer + build number**
- `1.2.3 (450)` — semver public + monotonic build number
- App Store / Play Store quản lý
- iOS: TestFlight cho beta
- Android: internal track + open testing

## Release pipeline

```
Developer
   │ (push branch)
   ▼
GitHub PR ──► CI build/test/lint ──► Review ──► Merge to main
                                                     │
                                                     ▼
                                              Auto-deploy staging
                                                     │
                                                     ▼
                                              Smoke test (Playwright)
                                                     │
                                                     ├── FAIL → block + alert
                                                     │
                                                     ▼
                                              Manual approve (Tech Lead)
                                                     │
                                                     ▼
                                              Deploy production (16:00 ICT)
                                                     │
                                                     ▼
                                              Monitor 1h
                                                     │
                                                     ▼
                                              Auto-rollback if error rate spike
```

## Backend deploy (DigitalOcean / AWS)

### Strategy: **Blue-Green** (MVP) → **Rolling** (năm 1+)

Blue-Green:
- 2 environments: blue (current prod) + green (new)
- Deploy lên green
- Smoke test green
- Switch LB từ blue → green
- Keep blue 30 phút làm rollback fallback

Rolling (khi có nhiều instance):
- Replace 1 instance/lần
- Health check pass mới replace tiếp
- Max 25% unhealthy

### Migration
- Run migration trước deploy app (separate step)
- Migration phải backwards-compatible với version cũ trong 1 release cycle (zero-downtime)
- Pattern: add column nullable → deploy app → backfill → make NOT NULL → drop old column (3 release)

### Rollback
- Nếu error rate > baseline + 50% trong 5 phút → auto rollback
- Tech Lead có thể manual rollback bất cứ lúc nào
- Migration: hỗ trợ Down nhưng tránh — thường roll-forward fix nhanh hơn

## Web app deploy

- Vercel hoặc DO App Platform
- Preview deploy cho mỗi PR (URL tự sinh)
- Production deploy on merge to main → auto promote sau staging smoke pass

## Mobile app release

### Beta (TestFlight + Play Internal)
- Build trên mỗi merge main
- Auto invite beta tester (5–10 design partner)
- Feedback qua Sentry + in-app form

### Production
- 1–2 lần/tháng
- Submit App Store / Play Store
- Review SLA: iOS 24–72h, Android 1–4h
- Phased rollout Android: 5% → 20% → 50% → 100% trong 1 tuần
- Phased rollout iOS: tự control, mặc định 1% → 100%

### Force update
- Critical bug → version cũ block khởi động, hiện màn "vui lòng update"
- Mechanism: backend trả `min_supported_version` ở `/v1/config`

## Release notes

### Internal
- File `CHANGELOG.md` ở mỗi repo
- Format: Keep a Changelog
- Phân loại: Added / Changed / Fixed / Deprecated / Security

### Public (cho khách)
- `ordergo.vn/changelog` — release notes thân thiện
- Email nurture cho khách hàng có feature mới
- In-app banner "What's new" cho UI thay đổi lớn
- Vietnamese, không jargon

## Maintenance window

- **Default**: 02:00–05:00 ICT (off-peak F&B)
- **Schedule trước 7 ngày** qua email + status page
- Giảm tối đa downtime — zero-downtime preferred
- Khách Enterprise có thể opt-out (custom window)

## Status page

- `status.ordergo.vn` công khai
- Cập nhật real-time:
  - Operational / Degraded / Outage
  - Incident timeline
  - Postmortem link sau incident
- Auto-update qua health check + manual override

## Pre-release checklist (lớn — milestone)

- [ ] Code freeze 24h trước (chỉ hotfix)
- [ ] Load test pass
- [ ] Security scan
- [ ] Backup verified
- [ ] Rollback plan
- [ ] Migration script reviewed by 2 dev
- [ ] On-call assigned
- [ ] Status page draft
- [ ] Internal Slack announcement
- [ ] Customer email draft
- [ ] Marketing align
- [ ] Sales briefed

## Post-release checklist

### T+0 (deploy time)
- [ ] Deploy success
- [ ] Health check pass
- [ ] Smoke test pass
- [ ] Status page green

### T+1h
- [ ] Error rate baseline
- [ ] Latency baseline
- [ ] Critical user flow verified bằng tay
- [ ] On-call standby

### T+24h
- [ ] Adoption metric check
- [ ] User feedback scan (support ticket, social)
- [ ] No regression detected

### T+7d (cho milestone)
- [ ] Postmortem nếu có incident
- [ ] Adoption metric review
- [ ] Decide: keep / iterate / kill
- [ ] Feature flag cleanup (nếu 100%)

## On-call

### Cadence
- Tech Lead + 1 senior BE rotate weekly
- Hours: 24/7 cho sev0/1; office hours cho sev2/3

### Response SLA
- Sev0 (data breach, complete down): < 15 phút page response
- Sev1 (production degraded): < 30 phút
- Sev2 (single feature broken): < 2 giờ
- Sev3 (cosmetic): next business day

### Tooling
- PagerDuty hoặc OpsGenie
- Slack `#alerts` channel
- Runbook trong `docs/runbooks/` (thêm sau)

## Postmortem

### Trigger
- Mọi sev0/1 (mandatory)
- Sev2 nếu impact > 100 venue
- Bất kỳ near-miss có ý nghĩa learning

### Format
- File markdown, public-internal
- Sections:
  - Summary (1 đoạn)
  - Timeline
  - Impact (số venue, doanh thu mất, NPS)
  - Root cause (5 whys)
  - What went well
  - What went wrong
  - Action items (owner + deadline)
- **Blameless** — không đổ lỗi cá nhân
- Public summary cho khách (transparency)

### Action items
- Track trong tracker chung (Jira/Linear/GitHub Project)
- Owner ký commit
- Review hằng tháng

## Anti-patterns

- ❌ Deploy thứ 6 16:00 ICT — không đủ thời gian fix nếu có vấn đề
- ❌ Deploy ngay trước long weekend — cùng lý do
- ❌ Skip smoke test "vì gấp" — gấp = phải có quy trình
- ❌ Không có rollback plan — luôn phải có
- ❌ Postmortem đổ lỗi cá nhân — phá văn hoá

---
*Changelog: v0.1 — 2026-05-01.*
