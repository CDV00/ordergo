# Risks & Mitigation

> Risk register sống. Đầu mỗi quý: review, update probability/impact, kill risk đã giải quyết, thêm risk mới.

## Cách đọc

- **P (Probability)**: 1 (rất thấp) → 5 (gần chắc)
- **I (Impact)**: 1 (gây khó chịu) → 5 (chết startup)
- **Score = P × I** (max 25)
- Risk score ≥ 12 → owner + mitigation plan rõ
- Risk score ≥ 20 → escalate weekly

---

## 1. Rủi ro thị trường

### R-M1 — KiotViet/MISA copy "multi-vertical" — **Score 12 (P3 × I4)**
- **Mô tả**: KiotViet đã có F&B + bán lẻ + dịch vụ. Nếu thấy traction OrderGo Hospitality, họ có thể ship trong 12 tháng.
- **Mitigation**:
  - Build moat ngoài tính năng: integration sâu, network effect chủ chuỗi, dữ liệu benchmark
  - Speed: ship nhanh hơn, ra Hospitality năm 2 trước khi họ kịp
  - Tập trung phân khúc đô thị, mobile-first, đa ngành — không cạnh tranh đại lý tỉnh
- **Owner**: Founder
- **Indicator giảm**: KiotViet không ra hospitality module trong 18 tháng

### R-M2 — Quy định HĐĐT thay đổi đột biến — **Score 16 (P4 × I4)**
- **Mô tả**: Cơ quan thuế VN thay đổi format/API HĐĐT (như NĐ 70/2025) → cost compliance + downtime
- **Mitigation**:
  - Tích hợp ≥ 2 nhà cung cấp HĐĐT (VNPT + Viettel) — dependency risk thấp
  - Subscribe legal newsletter (LawSoft, Thư viện pháp luật)
  - Buffer 5–10% capacity engineering cho compliance
  - Có kế toán viên cố vấn pre-empt (1tr/tháng retainer)
- **Owner**: Founder + Legal advisor

### R-M3 — Khủng hoảng kinh tế / lạm phát → chủ quán cắt phần mềm — **Score 15 (P3 × I5)**
- **Mô tả**: F&B đặc biệt nhạy cảm. Tỉ lệ đóng quán có thể tăng 50% trong khủng hoảng → churn cao
- **Mitigation**:
  - Free tier nuôi base — khách Free không churn (họ không trả tiền)
  - Pricing linh hoạt: pause subscription thay vì cancel
  - Expand vertical Hospitality (du lịch ít cyclical hơn F&B)
  - Cost discipline: không hire vượt revenue, runway 18 tháng minimum
- **Owner**: Founder

### R-M4 — Thị trường VN đã bão hoà, khách OrderGo phải chiếm thị phần KiotViet — **Score 12 (P4 × I3)**
- **Mô tả**: Khách hàng F&B SMB mục tiêu phần lớn đã có giải pháp. CAC cao vì phải migrate.
- **Mitigation**:
  - Migration tool import từ KiotViet/POS365 (hỗ trợ free)
  - Parallel run 1 tháng (dùng cả 2)
  - Switching incentive: 3 tháng free
  - Target quán mới mở (TAM 30k mới/năm) trước → ít cần migrate
- **Owner**: Sales + PM

---

## 2. Rủi ro kỹ thuật

### R-T1 — Mobile POS offline-first phức tạp hơn dự kiến — **Score 16 (P4 × I4)**
- **Mô tả**: Sync conflict, queue corruption, multi-device cùng bàn. Một bug có thể mất tiền khách thật.
- **Mitigation**:
  - Spike research 2 tuần đầu sprint 0
  - Reference: Linear, Notion offline-first patterns
  - Idempotency key + version mọi entity
  - Optimistic UI nhưng UI không mark "đã thu" cho đến server confirm payment
  - Test chaos: tắt mạng giữa transaction, verify
- **Owner**: Mobile Tech Lead

### R-T2 — Realtime Socket.IO scale issue ở 1.000+ venue — **Score 9 (P3 × I3)**
- **Mô tả**: Socket.IO với Redis adapter (Node đơn luồng) chưa proven ở 10k+ concurrent connection
- **Mitigation**:
  - Load test sớm (sprint 3) với 100 connection/venue × 100 venue = 10k
  - Backup plan: switch sang Ably (managed) nếu fail
  - Architecture cho phép swap realtime layer
- **Owner**: Backend Tech Lead

### R-T3 — Tenant isolation bug → data leak — **Score 20 (P4 × I5)**
- **Mô tả**: Một query thiếu `WHERE tenant_id = ?` → khách hàng A thấy data khách B → data breach
- **Mitigation**:
  - **Architecture**: `ITenantContext` middleware enforce
  - **Repository pattern**: filter mặc định, opt-out phải explicit
  - **Code review checklist** mục "tenant isolation"
  - **Lint rule**: query không filter `tenant_id` → CI fail
  - **Test isolation**: integration test 2 tenant verify cross-leak
  - **Audit periodically**: query log scan
- **Owner**: Security + Tech Lead

### R-T4 — DB scaling khi reach 5k+ venue — **Score 9 (P3 × I3)**
- **Mô tả**: Single Postgres không scale cho > 5k venue. Sharding phức tạp.
- **Mitigation**:
  - Sớm: read replica cho reporting
  - Năm 2: tách Reporting DB, partition table lớn theo `tenant_id`
  - Năm 3: Citus/sharding hoặc tenant Enterprise dedicated
- **Owner**: Backend Tech Lead

### R-T5 — External payment API down → POS không thu tiền được — **Score 10 (P5 × I2)**
- **Mô tả**: Momo/VNPay xuống → khách không trả được → quán mất bill
- **Mitigation**:
  - Fallback Cash + VietQR (không depend external API)
  - Queue retry HĐĐT khi VNPT down
  - Status banner trong app khi payment provider có vấn đề
  - Webhook idempotent (Momo/VNPay có thể retry)
- **Owner**: Payment module owner

### R-T6 — Máy in nhiệt phổ biến (Sunmi, Xprinter) thay đổi protocol — **Score 6 (P2 × I3)**
- **Mô tả**: Firmware update phá compatibility
- **Mitigation**:
  - Test ≥ 3 model phổ biến
  - Adapter pattern, dễ thêm model mới
  - Fallback PDF qua Bluetooth nếu printer specific fail
- **Owner**: Mobile dev

---

## 3. Rủi ro vận hành

### R-O1 — Founder bị kiệt sức (founder burnout) — **Score 15 (P3 × I5)**
- **Mô tả**: Solo founder ôm everything, sức khoẻ + judgement giảm
- **Mitigation**:
  - Hire C-level đầu tiên trong 6 tháng (CTO hoặc CMO)
  - 1 ngày off/tuần bắt buộc
  - Coach/mentor monthly
  - Đo burnout (sleep, mood) hằng tuần
- **Owner**: Founder + Co-founder/Board

### R-O2 — Hire sai người early — **Score 12 (P3 × I4)**
- **Mô tả**: 5 hire đầu thời stage có impact lớn nhất. 1 hire sai = 6 tháng lùi.
- **Mitigation**:
  - Take-home test thay phỏng vấn whiteboard
  - Reference check 360 (đồng nghiệp + manager + report)
  - Trial 2 tuần (paid) cho early hire
  - "Hire slow, fire fast"
- **Owner**: Founder

### R-O3 — Design partner churn trong beta đóng — **Score 9 (P3 × I3)**
- **Mô tả**: Partner thử 1 tháng → dùng cảm thấy chưa tốt → churn → mất feedback loop
- **Mitigation**:
  - Onboarding đậm tay đầu (founder + PM trực tiếp)
  - Daily standup với partner ngày đầu, weekly sau đó
  - Free 6 tháng đổi feedback
  - Pivot kịp thời nếu 3/5 partner unhappy với feature core
- **Owner**: Founder + PM

### R-O4 — Hỗ trợ khách hàng quá tải khi scale 100→1000 venue — **Score 9 (P3 × I3)**
- **Mô tả**: 1 founder không support 1000 khách. Ticket queue dài → NPS giảm.
- **Mitigation**:
  - Build help center + chatbot trước scale
  - Hire CS rep 1 từ 100 venue, mỗi 200 venue thêm 1
  - SLA rõ theo tier
  - Self-service settings, API tự test
- **Owner**: Founder → CS Lead

### R-O5 — Compliance VN mới (PDPL audit, ANM) — **Score 10 (P2 × I5)**
- **Mô tả**: Bộ Công an audit, fail → fine + brand damage
- **Mitigation**:
  - Privacy by design ngay từ đầu
  - Annual audit nội bộ
  - Hire DPO part-time khi đạt 1.000 venue
  - Lưu data VN cho khách regulated
- **Owner**: Founder + Legal

---

## 4. Rủi ro tài chính

### R-F1 — Runway hết trước khi đạt PMF — **Score 16 (P4 × I4)**
- **Mô tả**: Burn 200tr/tháng × 12 tháng = 2.4 tỷ. Nếu MVP miss 3 tháng → runway còn 6 tháng → áp lực gọi vốn ở vị thế yếu
- **Mitigation**:
  - Bootstrap đến PMF (founder không lương 6 tháng đầu)
  - Bridge round nếu cần (raise convertible note 2 tỷ)
  - Cost discipline: cloud < $200/tháng đến 100 venue
  - Revenue sớm: pricing test trial → conversion từ tháng 6
- **Owner**: Founder

### R-F2 — VC không invest startup VN early stage — **Score 12 (P4 × I3)**
- **Mô tả**: Thị trường VC đông Nam Á co lại, VN early stage khó raise
- **Mitigation**:
  - Default alive: profitable hoặc gần ở vòng đầu
  - Bootstrap với 200tr cá nhân + 500tr 3F (Family/Friends/Fools)
  - Angel: 5–10 người, mỗi 100–200tr → 1 tỷ
  - Show traction trước khi pitch VC
- **Owner**: Founder

### R-F3 — CAC cao hơn dự đoán → unit economics broken — **Score 12 (P3 × I4)**
- **Mô tả**: Dự đoán CAC < 1.5tr, thực tế > 3tr → LTV/CAC < 2 → không scale được
- **Mitigation**:
  - Test channel sớm (tháng 6) với budget nhỏ
  - Đo CAC theo channel, kill channel xấu
  - Tăng LTV trước (giảm churn) thay tăng CAC
  - Free tier organic acquisition
- **Owner**: Founder + Marketing

---

## 5. Rủi ro pháp lý

### R-L1 — Vi phạm bản quyền (icon, font, code thư viện) — **Score 6 (P3 × I2)**
- **Mô tả**: Dùng asset/lib không kiểm tra license
- **Mitigation**:
  - Chỉ dùng MIT/Apache/BSD library
  - Icon: Lucide (ISC), Heroicons (MIT)
  - Font: Google Fonts open-source
  - Image: free stock hoặc tự chụp
  - Audit license hằng quý
- **Owner**: Tech Lead

### R-L2 — Tranh chấp tên thương hiệu "OrderGo" — **Score 8 (P2 × I4)**
- **Mô tả**: "OrderGo" có thể trùng brand khác → kiện cáo, rebrand cost cao
- **Mitigation**:
  - Đăng ký nhãn hiệu Cục SHTT VN (trong 3 tháng đầu)
  - Search trademark database trước khi launch
  - Đăng ký domain backup (.com, .net, .com.vn)
- **Owner**: Founder + Legal

### R-L3 — Khách kiện vì data loss / payment sai — **Score 10 (P2 × I5)**
- **Mô tả**: Bug payment làm khách thua tiền → khởi kiện
- **Mitigation**:
  - SaaS Agreement (ToS) limit liability
  - Bảo hiểm trách nhiệm sản phẩm (năm 1+)
  - Audit log đầy đủ
  - SLA + financial credit nếu downtime
  - Backup + recovery test
- **Owner**: Founder + Legal

---

## Heat map

```
        Impact →
P  ┌─────┬─────┬─────┬─────┬─────┐
↓  │  1  │  2  │  3  │  4  │  5  │
   ├─────┼─────┼─────┼─────┼─────┤
 5 │     │R-T5 │     │     │     │
   ├─────┼─────┼─────┼─────┼─────┤
 4 │     │     │R-M4 │R-M2 │R-T3 │
   │     │     │     │R-T1 │     │
   │     │     │     │R-F1 │     │
   │     │     │     │R-F2 │     │
   ├─────┼─────┼─────┼─────┼─────┤
 3 │     │     │R-T2 │R-M1 │R-M3 │
   │     │     │R-T4 │R-O2 │R-O1 │
   │     │     │R-O3 │R-F3 │     │
   │     │     │R-O4 │     │     │
   │     │     │R-L1 │     │     │
   ├─────┼─────┼─────┼─────┼─────┤
 2 │     │     │R-T6 │R-L2 │R-O5 │
   │     │     │     │     │R-L3 │
   ├─────┼─────┼─────┼─────┼─────┤
 1 │     │     │     │     │     │
   └─────┴─────┴─────┴─────┴─────┘
```

→ **Top 5 phải mitigate ngay**: R-T3 (20), R-M2 (16), R-T1 (16), R-F1 (16), R-M3 (15)

---

## Risk review cadence

- **Weekly**: review top 5 (founder)
- **Monthly**: review tất cả ≥ 10 (PM + Tech Lead)
- **Quarterly**: review toàn bộ register, add/remove (all leadership)

---
*Changelog: v0.1 — 2026-05-01.*
