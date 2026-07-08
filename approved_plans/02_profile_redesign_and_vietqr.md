# Kế hoạch Tái cấu trúc Hồ sơ Giáo viên & Tích hợp VietQR (Đã được duyệt và thực hiện)

Kế hoạch này cải tiến giao diện trang cá nhân giáo viên sang chuẩn cao cấp, tích hợp chọn ngân hàng bằng VietQR API, lưu thông tin BIN ngân hàng và bổ sung trường giới thiệu giảng dạy (bio, bằng cấp, kinh nghiệm).

## Thiết kế Database (Prisma)
- **Bảng Teacher (`Teacher` model):**
  - Thêm cột `bank_name` (Tên ngân hàng), `bank_account_no` (Số tài khoản), `bank_account_name` (Tên chủ tài khoản).
  - Thêm cột `bank_bin` (Mã BIN ngân hàng - lấy từ VietQR).
  - Thêm cột `bio` (Mô tả giới thiệu bản thân giáo viên).
  - Thêm cột `metadata` (Kiểu Json để lưu trữ động thông tin Bằng cấp, Chứng chỉ, Giải thưởng, Kinh nghiệm).

## Backend APIs (`be`)
- Cập nhật Zod validation schema `updateProfileSchema` hỗ trợ các trường mới dạng optional để cho phép Frontend gọi cập nhật riêng lẻ từng form.
- Nâng cấp `profileService.js` xử lý cập nhật các liên kết môn học chuyên môn (`TeacherSubject`) và lưu thông tin ngân hàng mở rộng.

## Frontend UI (`fe`)
- **Tái cấu trúc Layout:** Chuyển đổi sang cấu trúc Grid 2 cột:
  - *Cột trái:* Avatar lớn, thông tin chung và nút xem trước hồ sơ công khai.
  - *Cột phải:* Tab panel chia 4 khu vực: Thông tin chung, Hồ sơ giảng dạy, Bảo mật (đổi mật khẩu mới), Cấu hình thanh toán.
- **Tích hợp VietQR:** Gọi API `https://api.vietqr.io/v2/banks` để hiển thị Select box tìm kiếm nhanh ngân hàng và tự động lưu mã BIN của ngân hàng được chọn.
- **Hồ sơ giảng dạy:** Tích hợp Textarea nhập Bio và bộ nhập liệu động cho phép thêm/xóa nhanh các hàng Kinh nghiệm, Bằng cấp, và Giải thưởng.
- **Đổi mật khẩu mới:** Giao diện form mật khẩu mới với thanh đo độ mạnh (Password Strength) trực quan theo thời gian thực.
- **Modal Xem trước công khai:** Modal giả lập chế độ xem của học sinh/phụ huynh, chỉ hiển thị thông tin công cộng (tên, avatar, bio, kinh nghiệm, bằng cấp) và ẩn hoàn toàn thông tin nhạy cảm (SĐT, Email, thông tin ngân hàng).
