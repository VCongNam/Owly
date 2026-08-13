# Kế hoạch Triển khai: Hoàn thiện Logic & Giao diện Tạo Lớp Học (UC-17 & UC-18)

Kế hoạch này hoàn thiện tính năng tạo và chỉnh sửa lớp học bằng việc bổ sung thông tin môn học, ngày kết thúc khóa học (cho phép null), cấu hình học phí linh hoạt (theo buổi/theo tháng) và lịch học tự chọn theo từng thứ trong tuần với giờ giấc khác nhau.

## 1. Thiết kế Database (Prisma)
- **Bảng Class (`Class` model):**
  - Thêm trường `subjectId` (UUID string, nullable) để liên kết với môn học.
  - Thêm trường `expectedEndDate` (DateTime, nullable) để xác định ngày dự kiến bế mạc khóa học.
- **Bảng ClassSchedule (`ClassSchedule` model):**
  - Giữ nguyên cấu trúc hỗ trợ lưu trữ nhiều buổi học trong tuần, mỗi buổi có `dayOfWeek` (Int), `startTime` (String, "HH:mm") và `endTime` (String, "HH:mm"). Trường `room` sẽ được thiết lập là optional hoặc mặc định chuỗi rỗng.
- **Bảng ClassTum (`ClassTum` model):**
  - Lưu thông tin định mức giá học phí `amount` (Float) và chu kỳ đóng học phí `billingCycle` ("Session" hoặc "Monthly").

## 2. Backend APIs (`be`)
- **Validation (Zod Schema):**
  - Cập nhật `createClassSchema` và `updateClassSchema` chấp nhận `subjectId`, `expectedEndDate` (nullable ISO date), `tuitionAmount` (Float), `billingCycle` ("Session" / "Monthly"), và danh sách `schedules` dạng mảng: `[{ dayOfWeek, startTime, endTime, room }]`.
- **Service & Controller:**
  - `createClass`: Thực hiện trong Prisma Transaction. Đầu tiên tạo lớp học, sau đó tạo `ClassTum` (nếu giáo viên nhập học phí) và tạo nhiều bản ghi `ClassSchedule` tương ứng với lịch học được chọn.
  - `updateClass`: Xử lý cập nhật thông tin lớp, đồng bộ lại lịch học (xóa lịch cũ, thêm lịch mới) và cập nhật học phí `ClassTum`.
  - `getClasses` & `getClassById`: Trả về thêm `subject`, `schedules` và `tuitionConfig` đi kèm.

## 3. Frontend UI (`fe`)
- **Custom Hook `useClasses`:**
  - Cập nhật hook để truyền và nhận đầy đủ dữ liệu mở rộng.
- **Giao diện Modal tạo/sửa lớp (`ClassFormModal.jsx`):**
  - Tách thành 3 phần trực quan:
    1. **Thông tin chung:** Nhập tên lớp, chọn môn học (lấy từ `/api/subjects`), ngày bắt đầu và ngày kết thúc (cho phép để trống/null).
    2. **Cấu hình Học phí:** Nhập số tiền và chọn đơn vị tính (theo Buổi hoặc theo Tháng).
    3. **Lịch học linh hoạt:** Cho phép chọn các thứ trong tuần (Thứ 2 đến Chủ nhật) và nhập thời gian học chi tiết của từng thứ đó (sử dụng TimeInput).
- **Giao diện Danh sách lớp (`ClassListPage.jsx` & `ClassCard.jsx`):**
  - Hiển thị môn học và tóm tắt lịch học / học phí trên mỗi thẻ lớp.
