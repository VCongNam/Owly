# Kế hoạch Đã duyệt: Tính năng Tải lên Tài liệu học tập (Học liệu - Ngày 19/07/2026)

Tính năng này cho phép Giáo viên tải lên các tài liệu học tập (file PDF, Word, hình ảnh, tài liệu tham khảo...) cho một lớp học cụ thể, hỗ trợ tải lên nhiều file đồng thời. Học viên trong lớp có thể xem và tải xuống.

## 1. Cơ cấu Cơ sở dữ liệu & Storage
- **Lưu trữ metadata:** Thêm bảng `ClassMaterial` liên kết quan hệ 1-N với bảng `Class` trong Postgres thông qua Prisma.
- **Lưu trữ file vật lý:** Sử dụng **Cloudflare R2** thông qua service `r2.service.js` đã được tích hợp sẵn.
- **Lệnh cập nhật database:** `pnpm exec prisma db push --accept-data-loss` (kết nối trực tiếp qua cổng `5432` để tránh pgbouncer block).
- **Sinh Prisma Client:** Chạy `pnpm exec prisma generate` để cập nhật client nạp bảng mới.

## 2. API Backend & Nghiệp vụ (Express.js)
- **Validation:** Thiết lập Zod schema validate đầu vào tại `materialSchema.js`.
- **Upload (Multer):** Chuyển từ `upload.single` sang `upload.array('files', 10)` để hỗ trợ tải nhiều file song song.
- **Controller:** Tự động lấy tên file làm tiêu đề hiển thị nếu giáo viên upload nhiều file, và lưu trữ metadata riêng biệt cho từng file trong database. Hỗ trợ phân trang danh sách tài liệu.

## 3. Giao diện Người dùng & Tích hợp (Frontend)
- **API Service & Hook:** Phát triển api service `materials.js` và custom hook `useMaterials.js` quản lý dữ liệu.
- **UI Component:** Xây dựng tab `ClassMaterialsTab.jsx` hiển thị danh sách tài liệu bằng Table, tự động hiển thị icon theo định dạng file, hỗ trợ tải về trực tiếp.
- **Tải lên nhiều file:** Hộp thoại file input hỗ trợ `multiple` file, tự động ẩn trường tiêu đề thủ công khi upload hàng loạt.
- **Trải nghiệm mượt mà:** Xử lý xóa tài liệu tối ưu (Optimistic UI) bằng cách lọc trực tiếp trên state React local thay vì reload API gây giật trang.
- **Native Dialog Ban:** Nghiêm cấm sử dụng `alert()` hay `confirm()` native của trình duyệt. Thay thế bằng `ConfirmModal` dùng chung để xác nhận hành động xóa.

---

## 4. Tài liệu API Documentation (Bruno)
- Tạo folder `be/bruno/Materials` chứa đầy đủ 3 API mẫu phục vụ kiểm thử:
  - `Get Class Materials.bru`
  - `Upload Material.bru`
  - `Delete Material.bru`
