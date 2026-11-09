# Assumptions

> Mọi business plan đứng trên giả định. Khi giả định sai, plan sai. File này liệt kê **giả định cốt lõi** + **cách verify** + **plan B nếu sai**.

## Cách dùng

- Mỗi quý: đánh dấu giả định nào đã verify, sai, hoặc cần thêm thời gian
- Khi 1 giả định sai nghiêm trọng → review lại docs liên quan
- Đánh dấu confidence: 🟢 cao | 🟡 trung | 🔴 thấp

---

## A. Giả định thị trường

### A1 — Thị trường F&B VN có nhu cầu phần mềm SaaS — **🟢 Cao**
- **Cơ sở**: KiotViet > 200k khách, MISA Cukcuk 30k khách → thị trường tồn tại
- **Verify**: số liệu công khai đối thủ, phỏng vấn 30 chủ quán
- **Plan B nếu sai**: rất khó sai — đã có existence proof

### A2 — Phân khúc SMB 1–10 chi nhánh là sweet spot — **🟡 Trung**
- **Cơ sở**: Logical reasoning + 1 vài interview
- **Verify**: 30 interview qua sprint 0
- **Plan B nếu sai**:
  - Nếu Micro (1 quán) là sweet spot → tăng free tier, cắt feature chuỗi
  - Nếu Enterprise là sweet spot → pivot sales-led, không self-service

### A3 — Khách F&B VN sẵn sàng trả 300–600k/tháng — **🟡 Trung**
- **Cơ sở**: Pricing đối thủ + thu nhập trung bình quán cà phê
- **Verify**: A/B test pricing trong sprint 6+
- **Plan B nếu sai**:
  - Nếu willingness < 300k → rely transaction-based (% phí thanh toán) thay subscription
  - Nếu willingness > 600k → tier có thể đẩy lên 700k

### A4 — Multi-vertical là USP mà khách thật sự trả tiền — **🔴 Thấp** (chưa verify)
- **Cơ sở**: Logical reasoning + 1 founder anecdote
- **Verify**: phỏng vấn 20 chủ chuỗi đa ngành (kết hợp F&B + Hospitality)
- **Plan B nếu sai**:
  - Multi-vertical chỉ là nice-to-have, chưa đủ deal-breaker
  - → Tập trung F&B đơn lẻ + cross-sell module mở rộng (Inventory, Loyalty)
  - → Hospitality chỉ ra mắt ở năm 3 sau khi F&B vững

### A5 — Du lịch VN tiếp tục phục hồi đến 2027 — **🟡 Trung**
- **Cơ sở**: Báo cáo Tổng cục Du lịch + xu hướng 2024–2025
- **Verify**: theo dõi metric occupancy hằng quý
- **Plan B nếu sai**:
  - Trì hoãn vertical Hospitality từ năm 2 sang năm 3
  - F&B đủ để đạt mục tiêu năm 2

### A6 — Vietnam SMB sẽ nhận tài chính qua ví điện tử ngày càng nhiều — **🟢 Cao**
- **Cơ sở**: Momo/VNPay/ZaloPay tăng trưởng 2 chữ số/năm, gov push cashless
- **Verify**: theo dõi % payment qua ví trong base khách
- **Plan B nếu sai**: tập trung Cash + VietQR (cũng ổn)

---

## B. Giả định sản phẩm

### B1 — Mobile-first sẽ là deal-breaker so với đối thủ desktop-first — **🟡 Trung**
- **Cơ sở**: Smartphone penetration > 90%, behavior shift
- **Verify**: NPS score và user feedback ưu tiên mobile/desktop
- **Plan B nếu sai**: vẫn phải có web POS responsive, không tốn quá nhiều extra

### B2 — Phục vụ/bếp Vietnam có thể adopt mobile app trong 1 buổi training — **🟡 Trung**
- **Cơ sở**: Persona research, đa số Gen Z + Millennial
- **Verify**: time-to-first-order < 30 phút mục tiêu
- **Plan B nếu sai**:
  - Đầu tư tutorial in-app dài hơn
  - Có dịch vụ training onsite

### B3 — Offline-first là requirement chứ không phải nice-to-have — **🟢 Cao**
- **Cơ sở**: Internet VN không 100% reliable, peak hour đông quán → mạng yếu
- **Verify**: incident report về mất mạng từ design partner
- **Plan B**: không có (must-have)

### B4 — UX hiện đại (Material/iOS) là lý do switch — **🟡 Trung**
- **Cơ sở**: Founder hypothesis, design taste
- **Verify**: A/B test landing với screenshot UI
- **Plan B nếu sai**: UX vẫn quan trọng nhưng không phải primary differentiator → focus vào tính năng + giá

### B5 — Self-service onboarding < 30 phút khả thi — **🟡 Trung**
- **Cơ sở**: Chuẩn của Square, Toast US (đã làm được)
- **Verify**: timer từ 5 quán đầu tự setup
- **Plan B nếu sai**:
  - Founder onboarding 1-1 cho 50 khách đầu (tốn time)
  - Hire CS rep sớm

---

## C. Giả định kỹ thuật

### C1 — Modular monolith đủ scale tới 5.000 venue — **🟢 Cao**
- **Cơ sở**: Shopify, Stripe đã chứng minh mô hình tới hàng trăm nghìn merchant
- **Verify**: load test + capacity planning quarterly
- **Plan B nếu sai**: tách microservice từng module 1 (Reporting trước, Payment sau)

### C2 — .NET 8 + linq2db có hệ sinh thái đủ tốt cho payment/HĐĐT VN — **🟢 Cao**
- **Cơ sở**: VNPT/Viettel/Momo đều có SDK .NET hoặc REST API. linq2db production-ready
- **Verify**: prototype tích hợp trong sprint 0
- **Plan B**: nếu thiếu SDK, tự wrap REST API (không khó)

### C3 — PostgreSQL đủ feature so với SQL Server cho enterprise tenant — **🟢 Cao**
- **Cơ sở**: Postgres mạnh hơn nhiều ở JSON, partitioning, replication
- **Verify**: migration test
- **Plan B nếu sai**: giữ SQL Server cho Enterprise tier (đã thiết kế silo allow)

### C4 — React Native đủ performance cho POS workload — **🟡 Trung**
- **Cơ sở**: Shopify POS dùng RN, scale tốt
- **Verify**: prototype POS app, đo FPS + latency tap
- **Plan B nếu sai**: switch sang Flutter (tốn 2 tháng) hoặc native (4 tháng)

### C5 — DigitalOcean đủ ổn định cho production — **🟡 Trung**
- **Cơ sở**: Đa số startup SEA dùng DO ổn
- **Verify**: monitoring uptime sau MVP
- **Plan B nếu sai**: migrate AWS ASEAN trong 1 sprint (terraform sẵn)

### C6 — VNPT-Invoice API ổn định, doc đủ — **🟡 Trung**
- **Cơ sở**: Reputation tốt, dùng nhiều
- **Verify**: tích hợp sandbox sprint 4
- **Plan B nếu sai**: switch Viettel-Sinvoice (đã plan tích hợp ở v1)

---

## D. Giả định team & văn hoá

### D1 — Có thể hire 5 dev senior trong 3 tháng đầu ở VN — **🟡 Trung**
- **Cơ sở**: Thị trường tech VN sôi động, có pool dev .NET + RN
- **Verify**: open 3 vị trí cùng lúc, đo apply rate
- **Plan B nếu sai**:
  - Hire 2–3 mid + train, slow down roadmap
  - Remote contractors từ Đông Âu (cost cao hơn nhưng available)

### D2 — Founder có thể đảm nhiệm cả PM + Sales + Founder ban đầu — **🟡 Trung**
- **Cơ sở**: Solo founder reality
- **Verify**: capacity check hằng tuần
- **Plan B nếu sai**: hire PM hoặc COO trước khi đạt 100 venue

### D3 — Async-first work culture ổn ở VN — **🟡 Trung**
- **Cơ sở**: Hậu COVID, dev VN quen remote
- **Verify**: feedback từ team đầu
- **Plan B**: hybrid 2 ngày/tuần lên office

---

## E. Giả định pháp lý / compliance

### E1 — Quy định HĐĐT không thay đổi cấu trúc trong 12 tháng — **🟡 Trung**
- **Cơ sở**: NĐ 70/2025 vừa ra, ổn định 1–2 năm
- **Verify**: theo dõi legal newsletter, advisor
- **Plan B**: đã mitigate qua 2 nhà cung cấp HĐĐT

### E2 — PDPL không yêu cầu DPO chứng chỉ — **🟢 Cao** (NĐ 13 hiện tại)
- **Verify**: theo dõi guidance Bộ Công an
- **Plan B**: hire DPO consultant nếu cần

### E3 — Lưu data ở Singapore acceptable cho 95% khách F&B SMB — **🟢 Cao**
- **Cơ sở**: F&B không phải ngành regulated cao
- **Verify**: feedback khách Enterprise
- **Plan B**: dual hosting VN + SG cho khách regulated

---

## F. Giả định tài chính

### F1 — Có thể bootstrap 6 tháng với 1.5 tỷ — **🟡 Trung**
- **Cơ sở**: 5 hire × 30tr × 6 tháng = 900tr + infra + marketing seed
- **Verify**: actual burn từ tháng 1
- **Plan B nếu sai**: bridge round 1 tỷ angel

### F2 — Có thể raise seed $500k–1M sau PMF — **🟡 Trung**
- **Cơ sở**: SaaS B2B SEA scene, có VC active (500 Global VN, AVV, Do Ventures, Touchstone)
- **Verify**: pitch deck refine, gặp 10 VC sau Q3
- **Plan B nếu sai**: revenue-based growth — chậm hơn nhưng possible

### F3 — Series A $5M sau 2.000 WAV + ARR $1M — **🔴 Thấp** (xa, nhiều ẩn số)
- **Verify**: theo dõi market sentiment
- **Plan B**: bridge convertible nếu Series A khó

---

## G. Anti-assumptions (giả định ta KHÔNG dựa vào)

- ❌ "Khách hàng sẽ tha thứ bug nếu UI đẹp" — không, bug = mất tiền, mất trust
- ❌ "Có nhiều feature hơn thì khách sẽ chọn ta" — không, focus và execute > breadth
- ❌ "Tech tốt là đủ" — không, cần distribution
- ❌ "Đối thủ chậm vì lớn" — không, lớn có ngân sách + đại lý mạnh
- ❌ "Khách hàng biết họ cần gì" — không, observe behavior > listen request
- ❌ "VN thị trường nhỏ nên ít cạnh tranh" — sai, 100 phần mềm POS đang chen lấn

---

## Verify schedule

| Tháng | Assumption verify chính |
| --- | --- |
| 1 | A1, A2, A3 (interviews) |
| 3 | B1, B2, B5 (5 design partner) |
| 6 | A3, A4 (pricing test, multi-vertical signal) |
| 9 | F1 (burn rate vs plan), D1 (hire status) |
| 12 | F2 (PMF readiness for raise), all critical assumptions revisit |

---

*Changelog: v0.1 — 2026-05-01.*
