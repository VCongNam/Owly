# Lịch sử Các Kế hoạch Đã Duyệt (Approved Plans)

Tài liệu này lưu trữ tất cả các Kế hoạch Thực thi (Implementation Plans) đã được chốt và thông qua bởi người dùng. Trợ lý AI (kể cả trong các phiên làm việc mới) PHẢI đọc tài liệu này để hiểu bối cảnh, các quyết định kiến trúc và tính năng đã thống nhất trước đó.

---

## 1. Nâng cấp Toàn diện Feedback Hub (Ngày 15/07/2026)

### 1. Mở rộng Giao diện (Frontend UI)
- Đổi kích thước của Drawer từ `md` sang `xl` để có không gian thao tác thoải mái.

### 2. Tính năng Đính kèm Ảnh (Paste / Upload)
- **Database:** Thêm cột `attachmentUrl` vào bảng `SystemFeedback`.
- **Backend:** Thêm API `POST /api/feedbacks/upload-image` sử dụng Multer đẩy file lên bucket `Owly` (Supabase).
- **Frontend Form:** Cho phép dán ảnh (Ctrl+V) hoặc chọn file qua input ẩn. Upload lấy URL trước khi tạo Feedback. Thẻ Lịch sử hiển thị thumbnail ảnh đính kèm.

### 3. Tối ưu Lịch sử (Search & Load More)
- Thanh Tìm kiếm và Bộ lọc cố định ở đầu tab Lịch sử (Client-side real-time filtering).
- Cuộn danh sách bằng `ScrollArea` độc lập, tránh tràn màn hình.
- Phân trang bằng nút "Xem thêm" (tải thêm từng đợt 15 thẻ) để tối ưu DOM.

---

## 2. Tự động hóa Workflow & API Documentation (Ngày 15/07/2026)

### 1. Kỹ năng Tự động hóa (Agent Skill)
- Tạo file `fe/.agents/skills/owly-workflow/SKILL.md` để ép buộc AI (kể cả trong tương lai) phải đọc `CODE_STANDARD.md` và `SKILL.md` ở thư mục frontend trước khi code.
- Yêu cầu AI luôn đọc `APPROVED_PLANS.md` trước khi đề xuất kế hoạch mới.
- Bắt buộc AI tự động cập nhật Bruno mỗi khi viết/sửa API.

### 2. Cập nhật API Documentation (Bruno)
- Tạo thư mục `be/bruno/SystemFeedback` và khởi tạo 3 API: `Create Feedback`, `Get My Feedbacks`, `Upload Image`.

### 3. Lưu trữ kế hoạch
- Quy định ghi chép lại mọi Kế hoạch đã duyệt vào file `APPROVED_PLANS.md` này.

---

## 3. Nâng cấp Đính kèm Nhiều Ảnh & Xem chi tiết Lightbox (Ngày 15/07/2026)

### 1. Thay đổi Database
- Xóa cột `attachmentUrl` (String) thay bằng `attachmentUrls` (String[]) trong `schema.prisma`.

### 2. Nâng cấp API Tải ảnh
- Chuyển sang dùng `upload.array('images', 5)` trong Multer.
- `uploadImage` (Controller) xử lý up song song các file lên Supabase và trả về mảng URL.
- Cập nhật payload `createFeedback` để nhận `attachmentUrls`.

### 3. Nâng cấp Giao diện Frontend
- Cho phép chọn nhiều file, hiển thị danh sách các file (Hover tooltip).
- Thêm Modal Lightbox bật lên khi click vào ảnh thu nhỏ để xem full HD.
