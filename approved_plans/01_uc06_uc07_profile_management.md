# Kế hoạch Triển khai UC-06 & UC-07 (Đã được duyệt và thực hiện)

Kế hoạch này tập trung xây dựng tính năng Quản lý Hồ sơ cá nhân (UC-06: Xem hồ sơ, UC-07: Cập nhật hồ sơ & ảnh đại diện) cho Giáo viên.

## Thiết kế Database (Prisma)
- **Bảng Account (`Account` model):**
  - Thêm trường `phone` (String, nullable) để lưu số điện thoại liên hệ.
  - Thêm trường `avatarUrl` (String, nullable) để lưu đường dẫn ảnh đại diện.

## Backend APIs (`be`)
Tách logic liên quan đến Hồ sơ cá nhân ra khỏi module `auth` sang module `profile` mới:
- `GET /api/profile` $\rightarrow$ Lấy thông tin cá nhân hiện tại của giáo viên (tên, sđt, email, gói cước).
- `PUT /api/profile` $\rightarrow$ Cập nhật thông tin (Họ tên, Số điện thoại).
- `POST /api/profile/avatar` $\rightarrow$ API nhận file ảnh qua `multer`, tải lên Supabase Storage bucket `Owly` và trả về URL cập nhật vào DB.

## Frontend UI (`fe`)
- Xây dựng Custom Hook `useProfile` để quản lý việc gọi API lấy, cập nhật hồ sơ và upload avatar.
- Tạo màn hình `ProfilePage.jsx` cơ bản chứa Form cập nhật Họ tên, Số điện thoại và nút thay đổi ảnh đại diện (có preview trước khi lưu).
- Cấu hình Header và Route `/profile` để chuyển hướng vào màn hình hồ sơ cá nhân.
