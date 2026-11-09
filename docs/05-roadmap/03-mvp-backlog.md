# MVP Backlog — User Stories chi tiết

> Backlog đầy đủ cho 12 tuần MVP. Format: **As [persona], I want to [action], so that [outcome]**. Có Acceptance Criteria + ước lượng (S/M/L/XL = 1/3/5/8 ngày dev).

## Sprint 0 (Tuần 1–2) — Foundation

### EPIC: Infrastructure & DevOps
| ID | User story | Size |
| --- | --- | --- |
| INF-1 | As **dev**, I want a CI pipeline that builds + tests on every PR, so I catch regressions early. | M |
| INF-2 | As **dev**, I want auto-deploy to staging on merge to `main`, so I see changes live in 5 phút. | M |
| INF-3 | As **dev**, I want centralized error tracking (Sentry), so I know about prod errors without users reporting. | S |
| INF-4 | As **dev**, I want schema changes versioned (`schemaVersion` + migration script trong `src/scripts/`), so dữ liệu cũ không vỡ. | M |
| INF-5 | As **founder**, I want staging env with seed data, so I can demo to design partner without messing prod. | S |

### EPIC: Tech debt cleanup (`ordergo-api` NestJS) — cập nhật 2026-11-09
| ID | User story | Size | Trạng thái |
| --- | --- | --- | --- |
| TD-1 | Chặn header `X-Tenant-Id`/`X-Venue-Id` vượt rào tenant: đối chiếu membership trong DB. | S | ✅ |
| TD-2 | Bỏ package `uuid` (ESM-only, crash trên Node < 20.19 và Jest) → UUID v7 tự sinh. | XS | ✅ |
| TD-3 | `.gitattributes` LF + sửa lỗi lint có sẵn để CI chạy lint chặn. | S | ✅ |
| TD-4 | Báo cáo "hôm nay" dùng giờ server/UTC → tính theo `venue.timezone`. | S | ⬜ Phase 1 |
| TD-5 | Endpoint thêm món vào đơn đã tạo (`AddOrderLineDto` có nhưng chưa có route). | M | ⬜ Phase 1 |

---

## Sprint 1 (Tuần 3–4) — Identity, Tenant

### EPIC: Identity (Auth)
| ID | User story | AC | Size |
| --- | --- | --- | --- |
| ID-1 | As **chủ quán**, I want to register với SĐT + OTP, so tôi không cần email. | OTP Twilio/ESMS, expire 5 phút, max 3 lần resend | M |
| ID-2 | As **user**, I want to login với SĐT + password, so I access app. | Argon2id, lockout sau 5 fail | M |
| ID-3 | As **user**, I want refresh token, so I không phải login lại sau 15 phút. | RS256, 30 ngày, rotation | M |
| ID-4 | As **user**, I want to logout (single + all devices), so tôi quản lý session. | Blacklist jti | S |
| ID-5 | As **user**, I want forgot password qua SMS OTP, so tôi recovery account. | OTP 1 lần, expire 15 phút | S |
| ID-6 | As **owner**, I want 2FA TOTP, so account tôi an toàn. | QR setup + backup codes | M |

### EPIC: Tenant + Venue
| ID | User story | Size |
| --- | --- | --- |
| TN-1 | As **người mới**, I want signup wizard tạo tenant + venue đầu tiên, so tôi setup nhanh. | M |
| TN-2 | As **owner**, I want set tên/địa chỉ/mã thuế quán, so HĐĐT đúng thông tin. | S |
| TN-3 | As **owner**, I want chọn loại hình (cafe, restaurant), so module phù hợp hiển thị. | S |
| TN-4 | As **owner**, I want invite nhân viên qua link/SĐT, so họ join venue. | M |
| TN-5 | As **owner**, I want assign role (Manager/Server/Cashier/Kitchen), so phân quyền đúng. | M |
| TN-6 | As **owner**, I want remove nhân viên, so cựu nhân viên không truy cập được. | S |

---

## Sprint 2 (Tuần 5–6) — Catalog, Settings

### EPIC: Menu (F&B)
| ID | User story | AC | Size |
| --- | --- | --- | --- |
| MN-1 | As **owner**, I want CRUD nhóm món, so menu có cấu trúc. | drag sort | S |
| MN-2 | As **owner**, I want CRUD món với name/giá/ảnh, so phục vụ thấy. | upload ảnh max 2MB, resize | M |
| MN-3 | As **owner**, I want add biến thể (size, đường, đá), so giá/option thay đổi theo. | M |
| MN-4 | As **owner**, I want add topping với giá phụ, so khách custom được. | M |
| MN-5 | As **owner**, I want toggle "hết món" tức thì, so phục vụ không gọi món hết. | realtime sync KDS + POS | S |
| MN-6 | As **owner**, I want import menu từ Excel template, so setup nhanh khi có 100 món. | template chuẩn, validate, preview | M |

### EPIC: Table & Section
| ID | User story | Size |
| --- | --- | --- |
| TB-1 | As **owner**, I want khai báo khu vực (Sảnh, Sân, Lầu), so phân loại bàn. | S |
| TB-2 | As **owner**, I want CRUD bàn với name + capacity, so phục vụ chọn đúng. | S |
| TB-3 | As **server**, I want xem trạng thái bàn (trống/có khách/đặt/cần dọn), so tôi biết bàn nào assign khách. | M |
| TB-4 | As **server**, I want chuyển bàn (đổi từ bàn 1 sang bàn 5), so xử lý request khách. | M |
| TB-5 | As **server**, I want ghép bàn (bàn 1+2 thành 1 đơn), so phục vụ đoàn lớn. | M |

### EPIC: Settings
| ID | User story | Size |
| --- | --- | --- |
| ST-1 | As **owner**, I want config thuế (VAT 8/10%), so bill đúng. | S |
| ST-2 | As **owner**, I want config phí phục vụ %, so tự cộng vào bill. | S |
| ST-3 | As **owner**, I want pair máy in Bluetooth, so in được bill. | mobile app pair flow | L |
| ST-4 | As **owner**, I want test in bill demo, so verify printer hoạt động. | S |

---

## Sprint 3 (Tuần 7–8) — Order + KDS + Realtime

### EPIC: Order
| ID | User story | AC | Size |
| --- | --- | --- | --- |
| OR-1 | As **server**, I want chọn bàn → menu hiện ra, so order nhanh. | tap bàn → menu < 200ms | M |
| OR-2 | As **server**, I want add món vào đơn (số lượng, biến thể, topping), so capture đúng order khách. | optimistic UI | L |
| OR-3 | As **server**, I want ghi chú từng món (vd: không hành), so bếp biết. | S |
| OR-4 | As **server**, I want tap "Gửi xuống bếp", so KDS nhận đơn. | < 1s gửi → KDS hiện | M |
| OR-5 | As **server**, I want add thêm món sau khi đã gửi, so xử lý khách order thêm. | M |
| OR-6 | As **manager**, I want approve khi server cancel/sửa món đã gửi, so chống thất thoát. | M |
| OR-7 | As **server**, I want split bill theo món hoặc theo người, so chia tiền dễ. | L |
| OR-8 | As **manager**, I want xem lịch sử đơn của bàn, so tra cứu nhanh. | S |

### EPIC: KDS
| ID | User story | Size |
| --- | --- | --- |
| KD-1 | As **kitchen**, I want màn hình hiện đơn theo cột (Mới / Đang làm / Sẵn sàng), so tôi biết tiến độ. | M |
| KD-2 | As **kitchen**, I want âm thanh khi có đơn mới, so không miss. | S |
| KD-3 | As **kitchen**, I want tap để chuyển trạng thái món (Mới → Đang làm → Sẵn sàng), so phục vụ biết. | S |
| KD-4 | As **server**, I want push noti khi món sẵn sàng, so ra mang ngay. | mobile push + in-app | M |
| KD-5 | As **kitchen**, I want xem ghi chú món rõ to, so không sai. | S |

### EPIC: Realtime infra
| ID | User story | Size |
| --- | --- | --- |
| RT-1 | As **dev**, I want Socket.IO gateway với Redis adapter, so multi-instance scale. | L |
| RT-2 | As **dev**, I want auth JWT + kiểm membership khi join room Socket.IO, so tenant isolation. | M |
| RT-3 | As **dev**, I want connection drop → auto reconnect, so partner UX không bị gián đoạn. | M |

---

## Sprint 4 (Tuần 9–10) — Payment + In bill + HĐĐT

### EPIC: Payment
| ID | User story | Size |
| --- | --- | --- |
| PM-1 | As **cashier**, I want chọn payment method (Cash/Bank/Momo/VNPay), so thu nhiều cách. | M |
| PM-2 | As **cashier**, I want sinh VietQR ngân hàng theo amount + content, so khách scan trả. | M |
| PM-3 | As **cashier**, I want tích hợp Momo Business sandbox, so khách scan QR Momo trả. | L |
| PM-4 | As **cashier**, I want VNPay QR sandbox, so khách trả VNPay. | L |
| PM-5 | As **cashier**, I want partial payment (thu trước 1 phần), so xử lý khách trả nhiều bước. | M |
| PM-6 | As **cashier**, I want apply giảm giá (% hoặc số tiền) trước khi thu, so flexibility. | S |
| PM-7 | As **manager**, I want refund đơn (hoàn tiền), so xử lý khách phàn nàn. | M |

### EPIC: Print bill
| ID | User story | Size |
| --- | --- | --- |
| PR-1 | As **dev**, I want template bill 80mm theo chuẩn VN (tên quán, MST, thời gian, từng món, tổng, QR HĐĐT), so in đẹp. | M |
| PR-2 | As **cashier**, I want in tự động sau khi thu xong, so khách nhận bill ngay. | S |
| PR-3 | As **cashier**, I want in lại nếu bị mất (re-print), so không vẽ tay. | S |
| PR-4 | As **dev**, I want adapter cho 3 model máy in phổ biến (Sunmi/Xprinter/Epson), so 90% case work out-of-box. | L |

### EPIC: HĐĐT (mock + integration prep)
| ID | User story | Size |
| --- | --- | --- |
| EI-1 | As **owner**, I want config "muốn xuất HĐĐT" → input MST + chọn provider VNPT/skip, so flexibility. | M |
| EI-2 | As **dev**, I want VNPT-Invoice adapter (sandbox), so test integration trước GA. | L |
| EI-3 | As **owner**, I want HĐĐT auto-generate khi thu > 1tr, so không phải nhớ. | M |
| EI-4 | As **owner**, I want tra cứu HĐĐT, gửi lại email khách, so xử lý request. | M |

---

## Sprint 5 (Tuần 11) — Mobile POS

### EPIC: Mobile POS app (RN)
| ID | User story | Size |
| --- | --- | --- |
| MO-1 | As **server**, I want mobile app login, so dùng tablet thay desktop. | M |
| MO-2 | As **server**, I want màn hình bàn (responsive 4–10 inch), so order trên tablet. | L |
| MO-3 | As **server**, I want order screen tối ưu touch, so không miss tap. | L |
| MO-4 | As **server**, I want offline queue khi mất mạng, so order không mất. | sqlite queue, sync on reconnect | XL |
| MO-5 | As **kitchen**, I want KDS app riêng cho tablet bếp, so chuyên dụng. | (web KDS đủ MVP) | — |
| MO-6 | As **owner**, I want mobile dashboard hôm nay/tuần này, so xem khi không ở quán. | M |
| MO-7 | As **dev**, I want crash report (Sentry), so fix sớm. | S |

---

## Sprint 6 (Tuần 12) — Polish + Launch

### EPIC: Reporting cơ bản
| ID | User story | Size |
| --- | --- | --- |
| RP-1 | As **owner**, I want dashboard "Today" (doanh thu, đơn, top 5 món), so biết tình hình. | M |
| RP-2 | As **owner**, I want so sánh hôm qua / tuần này / tuần trước, so đo trend. | M |
| RP-3 | As **owner**, I want số đơn theo giờ peak, so biết khi nào đông. | M |
| RP-4 | As **owner**, I want export Excel doanh thu theo ngày, so kế toán dùng. | S |

### EPIC: Shift
| ID | User story | Size |
| --- | --- | --- |
| SH-1 | As **cashier**, I want mở ca đầu (input tiền mặt), so tracking tiền. | S |
| SH-2 | As **cashier**, I want đóng ca cuối → app tổng hợp, kiểm tiền thực tế, so audit. | M |
| SH-3 | As **manager**, I want approve khi lệch ca > 0, so xác minh lý do. | S |

### EPIC: Onboarding & Polish
| ID | User story | Size |
| --- | --- | --- |
| ON-1 | As **người mới**, I want onboarding tour 5 bước, so biết dùng cơ bản. | M |
| ON-2 | As **người mới**, I want video 90s in-app, so xem nhanh. | record | S |
| ON-3 | As **owner**, I want help center FAQ 20 câu, so tự tra cứu. | M |
| ON-4 | As **dev**, I want load test 5 venue × 100 đơn/giờ peak pass, so confident GA. | L |
| ON-5 | As **dev**, I want backup test + restore drill, so DR ready. | M |

---

## Story map tổng

```
ROLE:         Owner          Server         Kitchen        Cashier        Mgr
              │              │              │              │              │
SETUP:    Register/Setup    —              —              —              Onboard
            Tenant
            Menu
            Tables
            Staff
            Settings

OPERATE:  —              Take order →   Receive order →  Take payment   Approve cancel/
                          send                          + print bill   refund

REVIEW:   Dashboard      —              —              Open/Close      View today
          Mobile                                        shift           reports
          Reports
```

---

## Backlog ngoài MVP (priority queue Q2)

- Loyalty cơ bản (sinh nhật voucher)
- Customer profile + lịch sử
- Multi-chi nhánh switching
- Inventory cơ bản
- Migration tool import KiotViet
- Sales site landing
- Self-service signup polish
- Pricing page
- Email nurture flow
- 2FA mở rộng cho Manager
- Hoá đơn tuỳ chỉnh template

---

## Estimation tổng

| Sprint | Total size (dev-days) | Capacity (3 BE + 1 mobile + 1 FE × 10 days) |
| --- | --- | --- |
| S0 (T1–2) | ~25 days | 50 |
| S1 (T3–4) | ~35 days | 50 |
| S2 (T5–6) | ~38 days | 50 |
| S3 (T7–8) | ~45 days | 50 |
| S4 (T9–10) | ~42 days | 50 |
| S5 (T11) | ~28 days | 25 |
| S6 (T12) | ~30 days | 25 |

**Insight**: S2–S4 hơi quá tải so với capacity → cần (a) tuyển sớm hơn, hoặc (b) cắt scope, hoặc (c) trượt MVP sang tuần 14.

---
*Changelog: v0.1 — 2026-05-01 — backlog đầu, sẽ refine sau buổi sprint planning đầu tiên.*
