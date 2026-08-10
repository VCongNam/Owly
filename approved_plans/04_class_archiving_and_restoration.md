# Kế hoạch Triển khai: Lưu trữ & Khôi phục Lớp học (UC-18, UC-19 & UC-20)

Kế hoạch này kết nối hoàn chỉnh các tính năng Chỉnh sửa thông tin lớp (UC-18), Lưu trữ lớp (UC-19), và Khôi phục lớp đã lưu trữ (UC-20) với cơ sở dữ liệu thực tế.

## 1. Màn hình danh sách chính (ClassListPage.jsx)
- Cập nhật bộ lọc danh sách lớp chính: Chỉ hiển thị các lớp học có `status !== 'Archived'`.
- Khi tính toán số lớp đang hoạt động (`activeCount`), đếm số lượng lớp không bị lưu trữ (`c.status !== 'Archived'`).

## 2. Màn hình Kho lớp cũ (ArchivedClassesPage.jsx)
- Tải danh sách lớp thực tế của giáo viên bằng hook `useClasses`.
- Lọc danh sách lớp học để chỉ hiển thị các lớp có `status === 'Archived'`.
- Kết nối hành động khôi phục lớp gọi API cập nhật trạng thái lớp trở lại.
