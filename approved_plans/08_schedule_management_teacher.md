# Phân hệ Lịch học & Điểm danh (Giáo viên) - Kế hoạch thực hiện

Triển khai các tính năng quản lý lịch biểu cho Giáo viên (UC-26, UC-27, UC-28, UC-29, UC-30, UC-31).

## 1. Thay đổi Backend
*   Tạo Zod schemas, service logic tương tác Prisma DB, controller và API router cho lịch học.
*   Tự động sinh các buổi học (`Session`) trong khoảng khoảng ngày dựa trên lịch cố định hàng tuần (`ClassSchedule`), bảo vệ các buổi học đã có dữ liệu điểm danh/nhận xét không bị xóa khi sửa lịch cố định.
*   Xử lý chính xác múi giờ Việt Nam (UTC+7) khi ghép giờ học và lưu trữ UTC trong Postgres.

## 2. Thay đổi Frontend
*   Xây dựng custom Hook `useSchedule` thực hiện các cuộc gọi API.
*   Tạo trang Lịch dạy `SchedulePage.jsx` thiết kế premium dạng tháng (Calendar Grid) và dạng danh sách tuần (Timeline). Hỗ trợ Light/Dark mode, lọc theo lớp học.
*   Tích hợp tab "Buổi học" (`ClassSessionsTab`) vào trang chi tiết lớp học cùng các modal cấu hình lịch học cố định (`ScheduleSetupModal`) và tạo/sửa buổi lẻ (`SessionFormModal`).

## 3. Tài liệu API
*   Tạo bộ sưu tập Bruno API cho Module Lịch học đặt trong thư mục `be/bruno/Schedule`.
