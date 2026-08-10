# Kế hoạch Triển khai: Phân trang từ Backend (Backend Pagination) cho Lớp học

Kế hoạch này tích hợp phân trang từ Backend cho các API danh sách lớp học (đang hoạt động và lưu trữ) để đảm bảo tối ưu hiệu năng và khả năng mở rộng.

## 1. Backend (`be`)
- Nâng cấp `getClasses` dịch vụ và controller hỗ trợ `page`, `limit` (mặc định 9), `search` (từ khóa tìm kiếm) và `isArchived`.
- Sử dụng skip/take trong Prisma để phân trang.
- Trả về cấu trúc dữ liệu gồm `items` và `pagination` chứa `totalItems`, `totalPages`, `currentPage`, `limit`.

## 2. Frontend (`fe`)
- Cập nhật custom hook `useClasses` để truyền `page`, `limit`, `search` lên backend và theo dõi trạng thái trang.
- Tích hợp component `<Pagination />` của Mantine vào [ClassListPage.jsx](file:///d:/Study/Owly/fe/src/features/classes/components/ClassListPage.jsx) và [ArchivedClassesPage.jsx](file:///d:/Study/Owly/fe/src/features/classes/components/ArchivedClassesPage.jsx).
- Áp dụng kỹ thuật debounce cho ô tìm kiếm để tối ưu lượt gọi API.
