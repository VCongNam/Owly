# Kế hoạch Đã duyệt: Phân hệ Bảng tin Lớp học (Class Stream - Ngày 19/07/2026)

Phân hệ này xây dựng không gian tương tác trung tâm của lớp học. Giáo viên đăng bài viết thông báo/dặn dò kèm tài liệu đính kèm, giáo viên và học sinh trao đổi thảo luận thông qua bình luận (comments).

## 1. Cơ cấu Cơ sở dữ liệu & Storage
- **Model Post:** Lưu trữ bài đăng lớp học (gồm các cột `views` đếm lượt xem, `commentsEnabled` cấu hình mở bình luận). Liên kết quan hệ 1-N với `Class` và `Account` (author).
- **Model Comment:** Lưu bình luận bài viết, liên kết quan hệ 1-N với `Post` và `Account` (author).
- **attachments:** Mảng lưu link các tệp đính kèm trên Cloudflare R2.
- **Đồng bộ cơ sở dữ liệu:** Chạy `prisma db push` (sử dụng direct url cổng 5432) và sinh client bằng `prisma generate` thành công.

## 2. API Backend & Nghiệp vụ (Express.js)
- **Validation:** Thiết lập Zod schema kiểm tra dữ liệu bài đăng và bình luận tại `postSchema.js` (Việt hóa thông báo lỗi).
- **Upload (Multer):** Hỗ trợ đính kèm lên tới 10 file tài liệu trong 1 bài đăng thông qua `upload.array('files', 10)`.
- **Phân quyền và nghiệp vụ:**
  - Giáo viên của lớp mới có quyền đăng thông báo (`UC-41`), xóa thông báo (`UC-45`), bật/tắt bình luận bài đăng.
  - Học sinh và giáo viên trong lớp đều có quyền xem danh sách bài đăng (`UC-44`), xem chi tiết để tăng view, viết bình luận (`UC-43`).
  - Bình luận có thể bị xóa bởi chính chủ bình luận hoặc giáo viên của lớp.
  - **Tự động đăng thông báo học liệu:** Khi Giáo viên đăng học liệu mới (upload file ở tab Học liệu), hệ thống tự động tạo một bài viết thông báo trên Bảng tin đính kèm trực tiếp danh sách file học liệu vừa upload.
- **Upcoming Assignments API:** Tạo API riêng lấy danh sách bài tập sắp đến hạn để tối ưu luồng tải dữ liệu.

## 3. Giao diện Người dùng & Tương thích (Frontend)
- **Split Layout (2 cột):**
  - **Cột trái (Sidebar 25%):** Hiển thị thông tin lớp học (Môn, Giáo viên, Mã lớp kèm nút copy nhanh, Lịch học trong tuần) và Bài tập sắp đến hạn gần nhất.
  - **Cột phải (Post Feed 75%):** Khung tạo bài thông báo (cho Giáo viên), danh sách luồng tin.
- **Mạng xã hội Modal Detail:** Khi click vào bình luận/bài viết, mở Modal chi tiết gồm thông tin bài đăng, file đính kèm, lượt xem, và luồng bình luận dạng bong bóng hội thoại trực quan kèm form gửi bình luận nhanh.
- **Không dùng Native Dialogs:** Áp dụng `ConfirmModal` dùng chung khi xóa bài viết hoặc bình luận, đồng bộ Light/Dark Mode của dự án.
