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

---

## 4. Phân hệ Quản lý Học viên (Student Management) (Ngày 15/07/2026)

### 1. Đăng nhập bằng Tên đăng nhập (Mã học sinh)
- Cho phép học sinh đăng nhập bằng mã học sinh (dạng `HSxxx`, ví dụ `HS001`) thay vì bắt buộc dùng email. 
- Backend tự động tra cứu để đổi tên đăng nhập thành email đăng ký thật trong Supabase Auth trước khi thực hiện xác thực.

### 2. Giao diện quản lý Thành viên lớp học (`/classes/{classId}/members`)
- Chuyển toàn bộ luồng thêm học viên mới và thêm học viên đã có vào trang thành viên lớp học.
- Modal "Thêm học viên vào lớp" gồm 2 tab: Chọn học sinh đã có sẵn (tìm kiếm theo tên hoặc SĐT phụ huynh) và Tạo học sinh mới (khởi tạo tên, ngày sinh, SĐT phụ huynh - hệ thống tự cấp tên đăng nhập và mật khẩu mặc định).
- Cho phép "Hủy học" (hủy ghi danh khỏi lớp hiện tại, không xóa tài khoản).

### 3. Tự cập nhật thông tin (Học sinh self-update)
- Học sinh đăng nhập lần đầu tiên sẽ tự cập nhật thông tin cá nhân (Email thật, SĐT cá nhân, Ngày sinh, Mật khẩu mới) trên trang cá nhân.
- Khi cập nhật email thật, hệ thống đồng bộ email đó sang Supabase Auth để đăng nhập cho các lần tiếp theo.
- Giáo viên chỉ có quyền read-only đối với thông tin cá nhân của học sinh.

### 4. Giao diện Danh sách Học viên chung (`/students`)
- Chuyển thành trang Chỉ đọc (Read-only), hiển thị danh bạ học sinh đang học các lớp của giáo viên đăng nhập.

---

## 5. Phân hệ Lịch học & Điểm danh (Giáo viên) (Ngày 16/07/2026)

### 1. Đồng bộ API & Cơ sở dữ liệu (Backend)
- Định nghĩa schemas kiểm tra đầu vào Zod cho lịch lặp lại, tạo/sửa buổi học lẻ.
- Viết các service tương tác Prisma: tự động tính toán sinh hàng loạt buổi học từ lịch tuần lặp lại, bảo vệ các buổi học tương lai đã có điểm danh/nhận xét không bị xóa.
- Xử lý đồng bộ múi giờ UTC+7 giữa client, server và Postgres (lưu UTC).

### 2. Giao diện Người dùng (Frontend)
- Xây dựng trang Lịch biểu cá nhân `SchedulePage` hỗ trợ xem dạng tháng (Calendar Grid) và dạng danh sách tuần (Timeline).
- Thiết lập tab "Buổi học" trong chi tiết lớp học giúp cấu hình lịch tuần lặp lại (`ScheduleSetupModal`) và thêm buổi học lẻ/học bù (`SessionFormModal`).
- Tự động hóa kết nối qua custom Hook `useSchedule` và Axios client.

---

## 6. Tính năng Điểm danh Buổi học cho Giáo viên (Teacher Attendance) (Ngày 17/07/2026)

### 1. Đồng bộ API & Cơ sở dữ liệu (Backend)
- **Database Schema**: Tận dụng bảng `Attendance` và `Session`.
- **API endpoints**:
  - `GET /api/sessions/:sessionId/attendances`: Lấy danh sách điểm danh buổi học. Tự động kết hợp (Left Join) học sinh từ `ClassEnrollment` và bản ghi `Attendance` hiện có để trả về sĩ số đầy đủ, mặc định trạng thái 'Present'.
  - `PUT /api/sessions/:sessionId/attendances`: Lưu điểm danh hàng loạt (Bulk Upsert) dùng Prisma `$transaction`. Tự động cập nhật trạng thái session sang `Completed` nếu đây là lần điểm danh đầu tiên.
- **Middleware**: Đăng ký route sử dụng middleware xác thực tập trung `/src/middlewares/auth.js`.

### 2. Giao diện Người dùng & Luồng (Frontend)
- **Mantine UI Modal (`AttendanceModal.jsx`)**: 
  - Thay thế layout Tailwind CSS bằng các component chuẩn của Mantine (`Modal`, `Table`, `Radio`, `TextInput`, `Avatar`...) để đồng bộ giao diện.
  - Hiển thị danh sách học viên trực quan kèm các nút chọn trạng thái Tiếng Việt hoàn toàn: `Có mặt`, `Vắng`, `Muộn`, `Có phép`, và ô nhập `Ghi chú`.
- **Custom Hook (`useAttendance.js`)**:
  - Xây dựng hooks quản lý API bằng các hooks React cơ bản (`useState`, `useCallback`) thay vì dùng `@tanstack/react-query` (do dự án không cài đặt thư viện này).
  - Tích hợp thông báo qua Mantine `@mantine/notifications`.
- **Tích hợp giao diện**: Gắn nút Điểm danh mở Modal trực tiếp ở cả tab **Buổi học** trong Chi tiết Lớp học và trên trang **Lịch dạy**.

### 3. API Testing Documentation (Bruno)
- Tạo folder `be/bruno/Attendance/` chứa 2 request mẫu:
  - `Get Attendances by Session.bru`
  - `Upsert Attendances.bru`

---

## 7. Nhật ký Điểm danh Học sinh (View Student Attendance Log - UC-35) (Ngày 18/07/2026)

### 1. Đồng bộ API & Cơ sở dữ liệu (Backend)
- **API endpoint**:
  - `GET /api/classes/:classId/members/:studentId/attendance-log`: Lấy lịch sử và thống kê điểm danh của học sinh trong lớp.
- **Business Logic**: 
  - Tính tổng số buổi học, số buổi đã điểm danh, số buổi có mặt, vắng, muộn, phép.
  - Tính tỉ lệ chuyên cần theo công thức: `(Có mặt + Đi muộn) / (Tổng số buổi đã điểm danh) * 100%`.

### 2. Giao diện Người dùng & Tích hợp (Frontend)
- **Mantine UI Modal (`AttendanceLogModal` trong `ClassMembersTab.jsx`)**:
  - Tích hợp vòng tròn tỉ lệ chuyên cần `RingProgress` và 6 thẻ thống kê chi tiết.
  - Hiển thị bảng lịch sử từng buổi học kèm ghi chú và badge trạng thái đồng bộ với trang quản lý lịch.
  - Hỗ trợ **Bộ lọc dynamic** (tìm kiếm theo ngày/tiêu đề, lọc trạng thái điểm danh, lọc trạng thái buổi học) và **Phân trang (Pagination)** 8 dòng/trang.
  - Đảm bảo hiển thị hoàn toàn **Responsive** qua thanh cuộn ngang `overflow-x: auto`.

---

## 8. Tải lên Tài liệu học tập (Học liệu) qua Cloudflare R2 (Ngày 19/07/2026)

### 1. Cơ cấu Cơ sở dữ liệu & Storage
- **Database Schema:** Thêm bảng `ClassMaterial` lưu thông tin tài liệu liên kết quan hệ 1-N với `Class` trong Postgres qua Prisma.
- **Storage:** Sử dụng **Cloudflare R2** thông qua service `r2.service.js` sẵn có để tải file vật lý lên bucket.
- **Đồng bộ DB:** Chạy `prisma db push` kết nối trực tiếp cổng `5432` và sinh lại Prisma Client bằng `prisma generate`.

### 2. API Backend & Nghiệp vụ
- **Upload (Multer):** Sử dụng `upload.array('files', 10)` hỗ trợ tải lên tối đa 10 file tài liệu đồng thời.
- **Controller:** Tự động sử dụng tên file gốc làm tiêu đề học liệu nếu upload hàng loạt. Phân trang dữ liệu trả về theo quy chuẩn.

### 3. Giao diện Người dùng & Tích hợp (Frontend)
- **UI Tab Component:** Xây dựng tab `ClassMaterialsTab.jsx` hiển thị danh sách tài liệu dưới dạng bảng kèm icon nhận dạng loại file, nút tải xuống trực tiếp.
- **Form tải lên:** Cho chọn nhiều file cùng lúc, tự động ẩn trường tiêu đề thủ công khi upload hàng loạt.
- **Mượt mà (Optimistic UI):** Xử lý xóa tài liệu tối ưu, lọc trực tiếp trên state React local giúp giao diện cập nhật ngay lập tức mà không cần fetch lại API.
- **Không dùng Native Dialogs:** Nghiêm cấm sử dụng `alert()` hay `confirm()` native của trình duyệt. Thay bằng component `ConfirmModal` dùng chung.

### 4. API Testing Documentation (Bruno)
- Tạo folder `be/bruno/Materials/` chứa 3 file API mẫu kiểm thử:
  - `Get Class Materials`
  - `Upload Material`
  - `Delete Material`




