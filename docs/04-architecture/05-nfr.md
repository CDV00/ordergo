# Non-functional Requirements (NFR)

> "Functional requirements" trả lời "phần mềm làm gì". NFR trả lời "**làm tốt đến đâu**". Không có NFR rõ ràng → không thể nói khi nào sản phẩm "đủ tốt".

## Mục tiêu NFR theo phase

| Hạng mục | MVP | Năm 1 | Năm 2 | Năm 3 |
| --- | --- | --- | --- | --- |
| **Uptime giờ kinh doanh** (06–24h) | 99.5% | 99.7% | 99.9% | 99.95% |
| **Uptime tổng** | 99% | 99.5% | 99.9% | 99.95% |
| **Latency p95 POS action** | < 500ms | < 300ms | < 200ms | < 150ms |
| **Latency p95 Báo cáo** | < 3s | < 1.5s | < 1s | < 500ms |
| **Latency p99 POS action** | < 2s | < 1s | < 500ms | < 300ms |
| **Throughput tối đa** | 50 đơn/phút/venue | 200 | 500 | 1.000 |
| **Concurrent users/venue** | 50 | 100 | 200 | 500 |
| **Scale max venues** | 100 | 1.000 | 10.000 | 50.000 |
| **RPO (data loss)** | 5 phút | 1 phút | 30 giây | < 30 giây |
| **RTO (recovery time)** | 1 giờ | 30 phút | 15 phút | 5 phút |
| **Mobile crash-free** | 99.5% | 99.7% | 99.9% | 99.95% |

---

## 1. Performance

### POS action — must be fast (UX-critical)
"POS action" = bất kỳ thao tác trong giờ peak: order, gửi bếp, thu tiền, in bill, đổi bàn.

**Targets**:
- p50 < 100ms
- p95 < 500ms (MVP) → < 200ms (năm 2)
- p99 < 2s (MVP) → < 500ms (năm 2)
- Timeout: 10s, sau đó offline mode kích hoạt

**Cách đạt**:
- Optimistic UI (hiển thị "đã gửi" trước khi server xác nhận)
- Write-behind cache cho update không critical
- Queue offline trên client (pending → sync)
- Index DB hợp lý (tenant_id, venue_id always first)
- Connection pool DB đủ size
- Không gọi external API trong request handler
- SignalR push, không polling

### Báo cáo
- Aggregate query từ read model riêng (không real-time aggregate trên transactional DB)
- Materialized view refresh mỗi 5 phút cho dashboard
- Pre-compute hàng ngày (worker chạy lúc 1h sáng)
- Cache 1 giờ TTL cho query lặp

### Print bill
- Render PDF server-side: < 500ms
- In ra giấy: < 3 giây từ "thu tiền" → ra bill

---

## 2. Scalability

### Vertical scale (MVP)
- Single instance backend, single DB primary
- Đủ cho ~100 venues active

### Horizontal scale (năm 1+)
- Backend stateless (session ở Redis)
- Auto-scale theo CPU > 70% trong 5 phút
- Min 2, max 10 instances
- Database: primary + 1 read replica → primary + 2 replica

### Sharding strategy (năm 2+)
- Shard theo `tenant_id` hash
- Routing layer ở app
- Tenant Enterprise có shard riêng

### Hot-spot prevention
- Tenant lớn (chuỗi 50+ venue) → check resource quota, throttle nếu vượt plan
- "Noisy neighbor": isolate compute cho tenant Enterprise (dedicated instance)

---

## 3. Availability

### Định nghĩa "uptime giờ kinh doanh"
- Giờ kinh doanh = 06:00–24:00 Asia/Ho_Chi_Minh
- 99.5% = ~2.7 giờ downtime/tháng
- 99.9% = ~32 phút downtime/tháng
- 99.95% = ~16 phút downtime/tháng

### Maintenance window
- 02:00–05:00 (off-peak, hầu như không có quán mở)
- Schedule maintenance trước 7 ngày
- Khách hàng có thể opt-in lock branch nhất định

### Multi-AZ (năm 2+)
- DB managed multi-AZ failover
- Backend ở 2 AZ minimum
- LB health check + auto-recovery

---

## 4. Reliability

### Idempotency
- Mọi POST/PUT/PATCH gây side-effect → require `Idempotency-Key`
- Server lưu key 24h, return cùng response

### At-least-once delivery
- Outbox pattern cho events
- Webhook retry với exponential backoff
- Consumer phải handle duplicate (idempotent processing)

### Circuit breaker
- External API call (Momo, VNPay, VNPT) → wrapped với Polly circuit breaker
- Mở circuit sau 5 fail/30s → fallback (vd: queue HĐĐT để retry)

### Retry policy
- Read query: retry 3 lần với jitter
- Write: chỉ retry với idempotency key
- Background job: retry 5 lần với backoff (1m, 5m, 30m, 2h, 6h)

---

## 5. Recovery (DR)

### Backup
- DB: daily full + incremental WAL streaming
- Object Storage: lifecycle policy archive sau 90 ngày
- Encrypt với KMS key tách khỏi data

### Test
- Restore test monthly (automated)
- Failover drill quarterly
- Postmortem mỗi lần test

### Cross-region (năm 2+)
- Backup mirror sang region khác (DO Frankfurt → AWS US)
- Read-only fallback nếu primary region down

---

## 6. Observability

### Logs
- Structured JSON
- Mỗi log có `request_id`, `tenant_id`, `user_id`, `correlation_id`
- Retention: 30 ngày hot, 1 năm cold

### Metrics
- Request rate, error rate, latency (RED method)
- Saturation: CPU, memory, DB connections, queue depth (USE method)
- Business metrics: orders/min, revenue/hour, active venues

### Traces
- OpenTelemetry, sampling 10% (100% cho error/slow)
- End-to-end trace từ mobile → API → DB → external

### Alerts (PagerDuty hoặc tương đương)
- Sev0/1: page on-call ngay
- Sev2: Slack ngay
- Sev3: ticket sáng hôm sau

### SLO + Error Budget
- SLO uptime 99.5% MVP
- Error budget 0.5% = ~3.6h/tháng
- Khi consume hết budget → freeze feature, fix reliability

---

## 7. Mobile NFR

### App size
- iOS < 50MB
- Android < 30MB

### Cold start
- < 3s đến màn hình order

### Offline
- Last 100 orders + full menu + tables cache
- Queue 30 phút offline, sync khi reconnect
- Conflict resolution: last-write-wins với version

### Battery
- Background sync max 1%/giờ
- WebSocket idle keep-alive efficient

### Network
- Tối ưu cho 3G/4G yếu (75% truy cập VN qua mobile)
- Image lazy load + WebP/AVIF
- API response gzip

---

## 8. Capacity planning

### Per venue (F&B busy)
- ~100 orders/ngày
- ~300 order lines
- ~150 payments
- ~200 audit log entries
- ~5MB data/tháng

### Per venue (Hotel)
- ~10 bookings/ngày
- ~30 folio items
- ~100 audit log entries
- ~3MB data/tháng

### Năm 1 — 1.000 venues:
- ~30M order lines
- ~50M audit logs
- ~5GB data/tháng (50GB cộng dồn)

### Năm 3 — 10.000 venues:
- ~300M orders/năm
- ~3TB total data
- → Đến đây phải sharding

---

## 9. Cost targets

| Phase | Cost/tháng | Cost per venue |
| --- | --- | --- |
| MVP (10 venue) | ~$100 | $10 |
| Năm 1 (300 venue) | ~$500 | $1.7 |
| Năm 2 (1.500 venue) | ~$3.000 | $2 |
| Năm 3 (5.000 venue) | ~$15.000 | $3 |

→ Margin SaaS phải duy trì 70–80% sau infra.

---

## 10. Compliance NFR (xem `04-security.md` cho chi tiết)

- Audit log retention: 7 năm với action tài chính
- Encrypt at-rest cho PII
- Right to erase: xoá data cá nhân trong 30 ngày kể từ yêu cầu
- Data export: cho user/tenant trong 30 ngày
- Data residency option cho Enterprise

---

## 11. Test NFR

### Load test
- k6 hoặc Locust scenarios
- Test trước mỗi major release
- Scenarios:
  - 50 venues × 100 orders/giờ peak
  - 1 venue 1.000 orders/ngày
  - Burst: 10x normal trong 5 phút

### Chaos engineering (năm 1+)
- Kill random pod weekly
- Inject latency 100ms
- Block external API → verify circuit breaker

---

*Changelog: v0.1 — 2026-05-01.*
