# Giá trị cốt lõi & Văn hoá team

Đây không phải poster treo tường. Đây là tiêu chí dùng để **tuyển người, đuổi người, ra quyết định khi conflict**.

## 5 giá trị cốt lõi

### 1. Khách hàng > Code đẹp
Một feature xấu về kiến trúc nhưng giải quyết được nỗi đau của chủ quán đáng giá hơn 3 sprint refactor "cho đẹp". Tech debt được trả khi nó thật sự cản trở khách hàng — không trả vì cảm xúc.

**Áp dụng**: Mỗi PR cần mô tả rõ "ảnh hưởng tới khách hàng nào, đo bằng metric gì". Refactor không có lý do khách hàng → reject.

### 2. Mobile-first, không phải mobile-also
Người vận hành (phục vụ, bếp, lễ tân) sống bằng điện thoại/tablet. Nếu một feature **chạy được trên web nhưng UX kém trên mobile** → coi như chưa xong.

**Áp dụng**: Mỗi tính năng vận hành phải pass test "mở trên iPhone SE 1 tay". Demo nội bộ luôn demo bằng mobile trước.

### 3. Đa vertical là kiến trúc, không phải tham vọng
Mọi quyết định kỹ thuật/sản phẩm phải trả lời được câu: "Khi mai thêm vertical Khách sạn, chỗ này có phải viết lại không?". Nếu có → thiết kế lại.

**Áp dụng**: Không có cột `restaurant_id` cứng nào trong DB ngoài bảng `restaurants` (nếu có). Dùng `tenant_id` + `business_type`. Không hardcode "Bàn", "Món" trong UI shared component.

### 4. Đo trước khi bàn cãi
Conflict về tính năng → mở dữ liệu/khảo sát trước, ý kiến sau. "Tôi nghĩ" thua "data nói".

**Áp dụng**: Mỗi feature lớn phải có hypothesis + metric. Nếu không đo được → chưa định nghĩa rõ. Sau release: review sau 2 tuần, kill feature nếu không di chuyển metric.

### 5. Ship nhỏ, ship thường
Không có release "big bang". Một feature lớn được chia thành 5–10 PR, mỗi PR ship được một mình. Cuối tuần luôn có production deploy.

**Áp dụng**: Feature flags là mặc định cho mọi feature mới. PR > 500 dòng phải giải thích lý do. Branch sống quá 5 ngày phải merge hoặc đóng.

## Văn hoá team

### Cách làm việc
- **Async-first**: viết doc, comment trên PR, ghi quyết định trong file. Họp chỉ khi async không giải quyết được.
- **Một cuộc họp = một quyết định**. Không có quyết định → cuộc họp thất bại.
- **Office hours, không bắt online**. Đo output, không đo giờ.
- **English code, Vietnamese product**. Code/comment/PR title bằng tiếng Anh để onboarding dev nước ngoài sau này dễ. Doc product/UI/marketing bằng tiếng Việt.

### Cách feedback
- **Direct nhưng kèm context**: "Phần này chưa đúng vì A, B" thay vì "phần này tệ".
- **Critique idea, không critique người**.
- **Disagree and commit**: tranh luận xong, có quyết định → tất cả thực thi như đó là quyết định của mình.

### Cách tuyển
Profile ưu tiên:
- Đã từng build SaaS ở quy mô tương tự
- Hiểu thị trường VN F&B/Hospitality (đã từng làm chủ quán/làm app cho ngành này càng tốt)
- Thoải mái với mơ hồ — early stage không có spec rõ
- "Owner mindset": coi sản phẩm là của mình, không chỉ làm task

### Cách phát triển con người
- 1:1 hằng tuần với manager — tập trung career, không phải status update
- Mỗi quý 1 ngày "lab day" tự chọn dự án
- Stock options cho mọi nhân viên đầu tiên (top 20)

## Anti-patterns (những thứ KHÔNG dung thứ)

- "Code này tôi viết lâu rồi không nhớ" → tài liệu ngay khi viết
- "Mọi người đều biết rồi" → viết xuống vẫn
- "Để hỏi sếp" → empower team ra quyết định ở scope của họ
- "Khách hàng không hiểu" → vấn đề là sản phẩm, không phải khách hàng
- "Ở chỗ cũ làm thế" → context khác, chưa chắc đúng ở đây
- "Cứ làm xong rồi tính" cho refactor lớn → có plan, đo trước/sau
- Đổ lỗi cá nhân khi sự cố → blameless postmortem

---
*Changelog: v0.1 — 2026-05-01 — bản phác thảo đầu tiên.*
