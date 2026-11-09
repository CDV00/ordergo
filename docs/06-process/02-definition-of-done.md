# Definition of Done (DoD)

> "Done" có nhiều cấp. Một story xong không đồng nghĩa feature ship được. File này định nghĩa rõ từng cấp để team không tranh cãi.

## 4 cấp DoD

```
┌─────────────────────────────────────────────────────┐
│  L4 — Live & Healthy (production stable 7 ngày)    │
└─────────────────────────────────────────────────────┘
              ▲
┌─────────────┴───────────────────────────────────────┐
│  L3 — Released (deployed production, monitored)    │
└─────────────────────────────────────────────────────┘
              ▲
┌─────────────┴───────────────────────────────────────┐
│  L2 — Shippable (staging tested, stakeholder ack)  │
└─────────────────────────────────────────────────────┘
              ▲
┌─────────────┴───────────────────────────────────────┐
│  L1 — Code Done (merged main, CI green)            │
└─────────────────────────────────────────────────────┘
```

---

## L1 — Code Done

Tiêu chí story "code done":

### Functional
- [ ] Acceptance criteria pass
- [ ] Happy path test thủ công ở local
- [ ] Edge case quan trọng được cover (lỗi mạng, input rỗng, không có quyền...)

### Code quality
- [ ] Code review approved (≥ 1 reviewer, ≥ 2 cho payment/auth)
- [ ] Lint pass, no new warning
- [ ] Type check pass
- [ ] No `TODO`/`FIXME` không tracked
- [ ] No commented-out code (hoặc có comment lý do giữ)
- [ ] No console.log / Console.WriteLine debug

### Testing
- [ ] Unit test cho logic mới (≥ 1 test/use case)
- [ ] Integration test nếu touch DB hoặc external API
- [ ] Test pass cả CI
- [ ] Coverage không giảm > 2%

### Security
- [ ] Tenant isolation: query filter `tenant_id` (nếu touch DB)
- [ ] Authorization: endpoint có policy `[Authorize]` đúng
- [ ] Validation server-side (FluentValidation hoặc tương đương)
- [ ] No secret hardcoded
- [ ] No PII trong log/trace
- [ ] Input sanitize cho XSS / injection

### Infrastructure
- [ ] Migration script (nếu thay đổi schema)
- [ ] Migration reversible (có Down method)
- [ ] Feature flag (nếu nhạy cảm)
- [ ] Idempotency key (nếu POST)
- [ ] Audit log (nếu action sensitive)

### Doc
- [ ] PR description đầy đủ (What/Why/How tested)
- [ ] OpenAPI doc update (nếu API thay đổi)
- [ ] Doc internal update (nếu logic phức tạp / quy ước thay đổi)
- [ ] Changelog update (nếu breaking)

→ **Merge vào `main`**.

---

## L2 — Shippable (Sprint Done)

Sau L1 + thêm:

### Staging
- [ ] Deploy lên staging tự động
- [ ] Smoke test pass trên staging (manual hoặc Playwright)
- [ ] QA verify happy path + 2 edge case
- [ ] No regression với feature đang có

### Stakeholder
- [ ] Demo cho PM/Founder/Designer
- [ ] Stakeholder ack — "OK to ship"
- [ ] Screenshot/video nếu UI thay đổi (cho release notes)

### Performance
- [ ] Latency p95 endpoint mới < 500ms (POS action)
- [ ] No N+1 query
- [ ] Bundle size không tăng > 5% (FE)
- [ ] App size không tăng > 1MB (Mobile)

### Cross-platform
- [ ] Test ít nhất 2 device (iPhone + Android cho mobile)
- [ ] Test 2 browser (Chrome + Safari) cho web
- [ ] Responsive test (mobile, tablet, desktop) cho web

### Accessibility (UI)
- [ ] Keyboard navigation
- [ ] Color contrast AA
- [ ] Screen reader label cho icon button
- [ ] Form label đúng chuẩn

→ **Sprint Review demo**.

---

## L3 — Released

Sau L2 + thêm:

### Production deployment
- [ ] Deploy production thành công
- [ ] Migration prod chạy thành công
- [ ] Health check pass
- [ ] Smoke test pass trên prod

### Monitoring
- [ ] Alert config cho metric mới (nếu có)
- [ ] Dashboard có entry mới (nếu cần)
- [ ] Sentry không spike error sau deploy

### Communication
- [ ] Release notes update (cho khách)
- [ ] In-app announcement nếu user-facing
- [ ] Email nurture flow update nếu mở subscription/feature mới
- [ ] Sales/Support team được brief
- [ ] CS docs (FAQ) update

### Rollback plan
- [ ] Có feature flag tắt nhanh
- [ ] Hoặc có script rollback rõ ràng

→ **Feature live**.

---

## L4 — Live & Healthy

Sau L3 + 7 ngày:

### Health check
- [ ] No critical bug 7 ngày
- [ ] Error rate ổn định (không spike)
- [ ] Latency ổn định
- [ ] Adoption metric: ≥ X% target user dùng (tuỳ feature)
- [ ] User feedback positive (hoặc neutral) — không có complaint nghiêm trọng

### Cleanup
- [ ] Feature flag remove (nếu 100% rollout)
- [ ] Old code path cleanup (nếu thay thế feature cũ)
- [ ] Tech debt ticket (nếu có shortcut)

### Documentation
- [ ] Postmortem (nếu có incident)
- [ ] Doc public (developer.ordergo.vn) update
- [ ] Internal wiki update

→ **Feature considered "shipped & stable"**. Có thể đo metric impact + quyết định iterate hoặc kill.

---

## DoD đặc biệt cho từng loại work

### Bug fix
- L1 + repro test added (regression test)
- L2 + verify trên staging với chính scenario gốc

### Refactor
- L1 + behavior unchanged (test pass)
- L2 + perf không xấu hơn

### Spike / Research
- L1 không apply
- Output: doc + recommendation
- Time-boxed (max 1 sprint)
- Decision: build / không build / iterate

### Hotfix production
- Ưu tiên: L3 trong < 4h
- Skip L4 7 ngày — monitor 24h, postmortem
- Code review post-deploy nếu emergency

---

## DoD cho release lớn (milestone-level)

Ngoài tổng hợp các L4 của từng story:

### Pre-release
- [ ] Load test pass với 5x baseline
- [ ] Security scan no high CVE
- [ ] Backup test pass
- [ ] Disaster recovery drill
- [ ] Pricing/plan update (nếu áp dụng)
- [ ] Marketing material ready
- [ ] Onboarding video update
- [ ] Support team training

### Release
- [ ] Public announcement
- [ ] Blog post / press release
- [ ] Social media
- [ ] Email blast khách hàng

### Post-release (30 ngày)
- [ ] Adoption metric review
- [ ] User feedback analysis
- [ ] Decision: iterate / sunset / scale up
- [ ] Postmortem nếu có incident

---

## Anti-pattern

- ❌ "Code done = task done" — chưa, mới L1
- ❌ Skip L2 vì gấp → đẩy bug ra prod → loss trust
- ❌ L4 không track → feature "ship" nhưng không ai biết có ai dùng
- ❌ Feature flag không cleanup → flag debt tích luỹ → khó debug

---
*Changelog: v0.1 — 2026-05-01.*
