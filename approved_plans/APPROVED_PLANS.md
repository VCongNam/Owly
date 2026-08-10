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

---

## 9. Phân hệ Bảng tin Lớp học & Thảo luận (Class Stream & Comments) (Ngày 19/07/2026)

### 1. Cơ cấu Cơ sở dữ liệu & Storage
- **Post & Comment Models:** Thêm bảng `Post` (chứa `views`, `commentsEnabled`) và `Comment` trong Postgres thông qua Prisma, tạo quan hệ ngược lại vào `Class` và `Account`.
- **Đồng bộ DB:** Chạy `prisma db push` kết nối trực tiếp cổng `5432` và sinh Prisma Client `prisma generate`.

### 2. API Backend & Nghiệp vụ (Express.js)
- **Validation & Upload:** Thiết lập Zod schema validate và sử dụng `upload.array('files', 10)` hỗ trợ đính kèm nhiều file bài đăng.
- **Nghiệp vụ:**
  - Chỉ giáo viên của lớp được quyền đăng bài, xóa bài, bật/tắt bình luận bài viết.
  - Học sinh và giáo viên trong lớp được quyền bình luận, tăng lượt xem (views) khi mở bài viết.
  - Bình luận có thể bị xóa bởi chính tác giả bình luận hoặc giáo viên lớp.
  - **Tự động đăng thông báo học liệu:** Khi Giáo viên đăng học liệu mới (upload file ở tab Học liệu), hệ thống tự động tạo một bài viết thông báo trên Bảng tin đính kèm trực tiếp danh sách file học liệu vừa upload.
- **Bài tập sắp đến hạn:** Thêm API `/api/classes/:classId/upcoming-assignments` lấy danh sách bài tập sắp hết hạn.

### 3. Giao diện Người dùng & Tích hợp (Frontend)
- **Split Layout (2 cột):**
  - Cột trái: Thông tin lớp học (Môn, GV, Lịch, Mã lớp + sao chép nhanh, Sĩ số) và bài tập sắp đến hạn.
  - Cột phải: Khung đăng tin dặn dò (Giáo viên) và danh sách luồng bài đăng.
- **Mạng xã hội Modal Detail:** Click vào bình luận mở modal hiển thị đầy đủ thông tin bài đăng, file đính kèm, lượt xem, luồng hội thoại bình luận dạng bong bóng và cho phép gửi bình luận nhanh.
- **ConfirmModal:** Sử dụng modal xác nhận dùng chung thay thế các hàm `confirm()` của trình duyệt.

### 4. API Testing Documentation (Bruno)
- Tạo folder `be/bruno/Posts/` chứa 7 API mẫu:
  - `Create Post`
  - `Get Class Posts`
  - `Get Post Details`
  - `Toggle Comments`
  - `Delete Post`
  - `Create Comment`
  - `Delete Comment`


## 8. Quản lý Bài tập (Assignment Management) - "Mọi thứ đều là File" & Cloudflare R2 (Ngày 20/07/2026)

### 1. Giải pháp Lưu trữ (Kiến trúc "Mọi thứ đều là File")
- Thống nhất không lưu nội dung bài tập bằng văn bản siêu dài vào Database.
- Thay vào đó, nếu giáo viên upload file có sẵn (PDF, Word) -> lưu thẳng lên Cloudflare R2 lấy Link.
- Nếu giáo viên soạn thảo nội dung trên trình soạn thảo Tiptap Editor -> Hệ thống tự động bọc đoạn HTML đó thành 1 file `.html`, đẩy lên Cloudflare R2 và lấy Link.
- Giúp giảm tải cho Database (bảng `Assignment` chỉ cần lưu 1 mảng các URL duy nhất).

### 2. Thay đổi Database
- Bổ sung trường `attachmentUrls` (kiểu mảng `String[]`) vào model `Assignment` trong `schema.prisma`.

### 3. Công nghệ Frontend
- Sử dụng **Tiptap** (thông qua `@mantine/tiptap`) làm Rich Text Editor.
- Tích hợp **Mammoth.js** để hỗ trợ tính năng kéo thả file `.docx` vào khung soạn thảo để tự động chuyển thành định dạng HTML.

---

## 9. Tích hợp Danh mục Đầu điểm & Tự động hóa Fallback (Ngày 21/07/2026)

### 1. Cơ cấu Cơ sở dữ liệu & Backend
- **Tự động hóa Fallback**: Cập nhật `createAssignmentSchema` (Zod) cho phép `gradeCategoryId` optional/nullable. Nếu chưa truyền `gradeCategoryId`, Service tự động kiểm tra/khởi tạo danh mục mặc định `"Bài tập chung"` (trọng số `1.0`) cho lớp học.
- **API Danh mục điểm**: Tạo mới `gradeCategoryService.js`, `gradeCategoryController.js`, `gradeCategoryRoutes.js` cung cấp 2 endpoint: `GET /api/classes/:classId/grade-categories` và `POST /api/classes/:classId/grade-categories`.
- **Bruno Testing**: Tạo folder `be/bruno/GradeCategories/` chứa 2 file `.bru` kiểm thử (`Get Grade Categories` và `Create Grade Category`).

### 2. Giao diện Người dùng (Frontend)
- **Select & Quick Modal**: Thêm ô chọn `Select` "Danh mục điểm" trên trang tạo bài tập kèm nút `+` tạo nhanh danh mục điểm mới qua Modal.
- **Nhắc nhở UX**: Thêm Tooltip rõ ràng thông báo người dùng có thể để trống (hệ thống tự xếp vào "Bài tập chung") hoặc chọn/tạo danh mục cụ thể.

---

## 10. Tái cấu trúc Giao diện Tạo Bài tập & Đọc File Đa Định dạng (Ngày 21/07/2026)

### 1. Tải cấu trúc Giao diện (Layout & Styling)
- **Thanh Tiêu đề (Top Bar)**: Giữ lại nút `← Quay lại` và **Ô nhập Tiêu đề** trải rộng toàn bộ không gian ở trên. Loại bỏ tất cả ô Hạn nộp bài, Điểm số, Danh mục điểm và nút Lưu khỏi thanh trên cùng.
- **Cột bên phải (Sidebar 320px)**: Gom trọn nút **💾 Lưu bài tập** ở đầu, theo sau là **Hạn nộp bài**, **Điểm số**, **Danh mục đầu điểm**, khung **Nhập đề bài từ File** và khung **Tệp đính kèm**.

### 2. Ràng buộc Màn hình Desktop (>= 1024px)
- Kiểm tra độ rộng màn hình bằng `useMediaQuery('(min-width: 1024px)')`.
- Nếu màn hình `< 1024px`, hiển thị màn hình thông báo yêu cầu chuyển sang thiết bị máy tính để đảm bảo trải nghiệm soạn thảo bài tập tốt nhất.

### 3. Mở rộng Khả năng Đọc File Nhập liệu (Multi-format Import)
- Đọc trực tiếp nội dung đề bài từ các file: **Word (`.docx`)** qua `mammoth.js`, **Văn bản thuần (`.txt`)**, **Markdown (`.md`)**, và **Trang web (`.html`, `.htm`)** bằng `FileReader`.

---

## 11. Phân hệ Quản lý Danh mục Đầu điểm & Trọng số (UC-55 đến UC-58) (Ngày 22/07/2026)

### 1. Cơ cấu Cơ sở dữ liệu & API Backend
- **Cập nhật & Xóa Danh mục điểm (`UC-57`, `UC-58`)**:
  - `PUT /api/classes/:classId/grade-categories/:id`: Cho phép sửa tên và trọng số phần trăm `weight`.
  - `DELETE /api/classes/:classId/grade-categories/:id`: Xóa danh mục điểm. Tự động kiểm tra và di chuyển tất cả bài tập thuộc danh mục bị xóa về danh mục mặc định `"Bài tập chung"` để bảo đảm an toàn dữ liệu.
- **API Documentation (Bruno)**: Khởi tạo 2 file kiểm thử API mới `Update Grade Category.bru` và `Delete Grade Category.bru` tại `be/bruno/GradeCategories/`.

### 2. Giao diện Người dùng Frontend
- **Modal Quản lý Đầu điểm (`GradeCategoriesModal.jsx`) (`UC-55`)**:
  - Bảng hiển thị toàn bộ danh mục điểm của lớp kèm Tên, Trọng số (%), Số lượng bài tập liên kết, nút Sửa/Xóa.
  - Thanh tổng quan tính toán tổng trọng số % hiện tại (Cảnh báo nếu tổng $\neq 100\%$).
- **Giao diện Thêm/Sửa & Xóa (`UC-56`, `UC-57`, `UC-58`)**:
  - Tích hợp ô nhập Tên & Trọng số % (`NumberInput` suffix `%`).
  - Hỗ trợ `ConfirmModal` cảnh báo trước khi xóa và tự động di chuyển bài tập liên quan.
- **Gắn nút Thao tác (`ClassAssignmentsTab.jsx`)**: Đặt nút "Cấu hình đầu điểm" trên giao diện tab Bài tập để giáo viên mở nhanh Modal quản lý.

---

## 12. Phân hệ Quản lý Học phí (Tuition Fee Management) (Ngày 23/07/2026)

### 1. Cơ cấu Cơ sở dữ liệu & Backend
- **Cập nhật Database Schema**: Bổ sung `billingMonth`, `sessionCount`, `title` vào model `Invoice`; bổ sung `rejectionReason` vào model `Transaction`.
- **API Backend & Business Logic**:
  - API Cấu hình đơn giá học phí lớp (`GET/PUT /api/classes/:classId/tuition-config`).
  - API Sinh hóa đơn tháng tự động dựa trên số buổi học trong tháng của lớp (`POST /api/classes/:classId/invoices/generate`).
  - API Lấy danh sách hóa đơn lớp phân trang & thống kê (`GET /api/classes/:classId/invoices`).
  - API Học sinh xem hóa đơn & nộp minh chứng chuyển khoản (`GET /api/tuition/my-invoices`, `POST /api/tuition/invoices/:invoiceId/submit-proof`).
  - API Giáo viên đối soát & duyệt/từ chối giao dịch (`PATCH /api/tuition/transactions/:transactionId/review`).
- **API Documentation (Bruno)**: Tạo bộ sưu tập `be/bruno/Tuition/` gồm 6 file kiểm thử API.

### 2. Giao diện Người dùng Frontend
- **Tab Học phí Lớp học (`ClassTuitionTab.jsx`)**:
  - Thẻ thống kê tổng quan (Đơn giá/buổi, Tiền cần thu, Đã thu, Chưa thu).
  - Chọn tháng/năm thu phí & nút "Tạo hóa đơn tháng".
  - Bảng danh sách hóa đơn học viên kèm Badge trạng thái và nút xem minh chứng đối soát.
- **Modals thao tác**:
  - `TuitionConfigModal`: Cài đặt đơn giá học phí/buổi.
  - `GenerateInvoicesModal`: Xem trước (Preview) danh sách hóa đơn trước khi phát hành.
  - `PaymentProofModal`: Hiển thị VietQR động, ảnh minh chứng chuyển khoản, nút Duyệt/Từ chối.

---

## 13. Tự động hóa Đối soát Học phí qua Webhook VietQR (SePay/Casso) (Ngày 24/07/2026)

### 1. Nguyên lý Hoạt động & Backend API
- **Endpoint Webhook công khai**: Khởi tạo API `POST /api/tuition/webhook/sepay` nhận thông báo giao dịch trực tiếp từ SePay/Casso khi có biến động số dư tài khoản của Giáo viên.
- **Xác thực chữ ký & Đối soát tự động**:
  - Sử dụng Token bí mật để xác thực request gửi từ SePay.
  - Sử dụng biểu thức chính quy (Regex) phân tích nội dung chuyển khoản để khớp mã hóa đơn (`invoiceId`).
  - Tự động cập nhật hóa đơn sang `Paid` nếu số tiền chuyển khoản khớp hoặc lớn hơn số tiền trên hóa đơn, đồng thời ghi nhận bản ghi giao dịch thành công.

---

## 14. Tích hợp API & Tái cấu trúc Dashboard Giáo viên (Ngày 29/07/2026)

### 1. Đồng bộ API & Cơ sở dữ liệu (Backend)
- **API Mới**:
  - `GET /api/tuition/teacher/pending`: Lấy danh sách toàn bộ hóa đơn có trạng thái `Pending` của các lớp học do giáo viên sở hữu để duyệt học phí.
  - `GET /api/assignments/teacher/upcoming`: Lấy danh sách toàn bộ bài tập sắp tới (dueDate >= hiện tại) của các lớp học do giáo viên phụ trách.
- **Controller & Service**:
  - Viết logic truy vấn Prisma liên kết các bảng lớp học và giáo viên.

### 2. Tích hợp Frontend & Giao diện Dashboard Giáo viên (`TeacherDashboard`)
- **API Services**:
  - Thêm API calls `tuitionService.getTeacherPendingInvoices` và `assignmentService.getTeacherUpcomingAssignments`.
- **Giao diện người dùng**:
  - Tái cấu trúc `TeacherDashboard` trong `DashboardPage.jsx` tương tự `StudentDashboard`.
  - Sử dụng 4 thẻ thống kê động tích hợp dữ liệu thực từ `classService`, `studentService`, `scheduleService`, `tuitionService`.
  - Hiển thị lối tắt nhanh, lịch dạy hôm nay, hóa đơn học phí chờ duyệt và danh sách lớp học giáo viên phụ trách.
  - Tích hợp Skeleton loading và Empty states.

---

## 15. Phân hệ Student Learning Portal (Ngày 29/07/2026)

### 1. Đồng bộ API Backend (Prisma & Express.js)
- **API Nộp bài & Chấm điểm (Assignments & Submissions)**:
  - `POST /api/assignments/:assignmentId/submissions`: Học sinh nộp bài tập (tải tệp lên Cloudflare R2 và lưu link).
  - `GET /api/assignments/:assignmentId/my-submission`: Học sinh xem bài nộp cá nhân cùng kết quả chấm điểm.
  - `GET /api/assignments/:assignmentId/submissions`: Giáo viên lấy danh sách bài nộp của lớp để chấm.
  - `POST /api/submissions/:submissionId/feedback`: Giáo viên chấm điểm và viết nhận xét cho bài nộp.
- **Bảo mật & Quyền hạn (Class Members)**:
  - Cập nhật API `GET /api/classes/:classId/members`: Bổ sung logic tự động ẩn `studentCode`, email đăng nhập, `parentPhone` của các học viên khác nếu người dùng thực hiện cuộc gọi là `student`.

### 2. Giao diện Người dùng Frontend (Vite + React)
- **Hành động & Phân quyền các Tab lớp học**:
  - **ClassSessionsTab**: Học sinh xem lịch học và trạng thái điểm danh (Có mặt, Vắng, Muộn, Phép). Ẩn các nút hành động chỉnh sửa lịch và ẩn cột nhận xét buổi học.
  - **ClassMembersTab**: Học sinh xem danh sách bạn cùng lớp (chỉ hiển thị Họ tên và Avatar). Ẩn mã học sinh, ẩn thông tin liên hệ và các nút xóa/điểm danh thành viên.
  - **ClassAssignmentsTab**: Học sinh xem danh sách bài tập, hạn nộp, và nộp bài làm trực tiếp. Xem kết quả điểm số sau khi giáo viên chấm bài.
  - **ClassTuitionTab**: Giao diện học phí riêng của học sinh: danh sách hóa đơn cá nhân, thanh toán VietQR động và nút upload Payment Proof.
- **Tính năng lùi lại phát triển sau (Deferred)**:
  - Xem nhận xét chi tiết buổi học (Session Feedback details).
  - Sổ điểm tổng kết (Gradebook).
  - Giáo viên upload bulk danh sách học sinh bằng file Excel.


---

## 16. Vá Lỗi Ưu tiên Cao — Phân quyền, Error Handler, Validate (Ngày 06/08/2026)

### 1. Phân quyền nộp bài (`assignmentService.js`)
- Thêm **Guard Enrollment**: `submitAssignment()` kiểm tra học sinh có phải thành viên active (`isActive: true`) của lớp chứa bài tập trước khi cho phép nộp. Trả `403` nếu không hợp lệ.
- Thêm **Guard Deadline**: Kiểm tra `dueDate` — trả `400` nếu bài tập đã hết hạn nộp.
- Đổi toàn bộ `throw new Error(...)` trong service assignments → `throw new AppError(message, statusCode)` để error handler nhận đúng HTTP status code.

### 2. Centralized Error Handler
- Tạo mới `be/src/middlewares/errorHandler.js`: Global Express error handler 4-argument.
  - `AppError` (isOperational): dùng `statusCode` và `message` gốc (tiếng Việt).
  - `Error` thường: luôn trả `500` + message chung, ẩn chi tiết.
  - Stack trace chỉ expose ở môi trường non-production.
- Đăng ký `app.use(errorHandler)` vào `app.js` **sau tất cả routes**, trước `app.listen()`.

### 3. Nâng cấp Validate Middleware + Pagination Schema
- `be/src/middlewares/validate.js`: Thêm tham số `target = 'body'` hỗ trợ `'query'` | `'params'`. Dùng `safeParse` thay `parse`. Ghi lại `req[target] = result.data` để coerce/default có hiệu lực.
- Tạo mới `be/src/validation/paginationSchema.js`: Schema tái sử dụng (`page` ≥ 1, `limit` 1–100).
- Áp dụng `validate(paginationSchema, 'query')` vào `GET /api/assignments/class/:classId`.
- Đơn giản hóa controller `getAssignments`: bỏ `parseInt()` thủ công, đọc trực tiếp giá trị đã coerce.

### 4. Bruno Documentation
- Cập nhật `Submit Homework.bru`: ghi chú các behavior 403/400 mới.
- Cập nhật `Get Assignments.bru`: thêm `params:query` và docs về pagination validation bounds.


---

## 17. Kế hoạch Chuẩn hóa & Nâng cấp 5 Giai đoạn Toàn diện (Ngày 06/08/2026)

Kế hoạch 5 giai đoạn nhằm chuẩn hóa dự án Owly từ 70% lên mức sẵn sàng phát hành (Production-Ready) với độ an toàn cao, 0 lỗi lint và test tự động.

### Giai đoạn 1: Khóa các lỗ hổng backend & Chuẩn hóa phân quyền
- **Auth Helpers dùng chung (`src/utils/authHelpers.js`)**:
  - `assertClassAccess(userId, userRole, classId)`: Kiểm tra sở hữu lớp (Teacher) hoặc ghi danh active (Student). Trả `404` nếu không tìm thấy lớp, `403` nếu không có quyền.
  - `requireTeacher(req)` & `requireStudent(req)`: Phân quyền vai trò trả `AppError(..., 403)`.
- **Phân quyền danh sách bài tập**: Áp dụng `assertClassAccess` cho API `GET /api/assignments/class/:classId`.
- **Ràng buộc điểm chấm**: Kiểm tra `0 <= grade <= maxPoints` trong `gradeSubmission()`.
- **Chuẩn hóa Error Handling**: Chuyển toàn bộ `throw new Error()` thành `AppError(message, statusCode)` trên toàn bộ 9 controllers/services backend để Global Error Handler xử lý đúng HTTP status code (400, 401, 403, 404, 409).

### Giai đoạn 2: Chuẩn hóa Validation Zod
- Tạo bộ schema dùng chung trong `be/src/validation/`:
  - `commonSchema.js`: `idParamsSchema`, `classIdParamsSchema`, `assignmentIdParamsSchema`, `upcomingLimitSchema`.
  - `paginationSchema.js`: `page` (min 1, default 1), `limit` (min 1, max 100, default 10).
- Áp dụng middleware `validate(schema, target)` vào routes của 7 phân hệ: Assignments, Classes, Students, Schedule, Materials, Posts, Tuition.
- Điều kiện nghiệm thu: `page=0`, `limit=101`, ID sai định dạng UUID đều trả HTTP 400 kèm JSON định dạng thống nhất.

### Giai đoạn 3: Hoàn thiện Bruno & Security Test Suite
- Bổ sung các request còn thiếu: Update/Delete Assignment, Get Class Sessions, Bulk Import Students, Download Student Template, Get My Invoices, Upload file dùng chung.
- Tạo thư mục kiểm thử phân quyền chéo `be/bruno/Security/`:
  - `Student Access Foreign Class.bru`
  - `Student Submit Foreign Assignment.bru`
  - `Teacher Grade Foreign Submission.bru`
  - `Student Submit Foreign Invoice.bru`
  - `Teacher Review Foreign Transaction.bru`
- Điều kiện nghiệm thu: Toàn bộ kịch bản happy path thành công; toàn bộ kịch bản truy cập chéo trả 403/404.

### Giai đoạn 4: Làm sạch Frontend (Clean ESLint - 0 Errors)
- Sửa triệt để 70 vấn đề (62 errors, 8 warnings) khi chạy `pnpm lint` ở thư mục `fe`.
- Xóa import/biến không dùng, sửa dependency array của React hooks.
- Tái cấu trúc logic reset state trong effect (dùng `key` component hoặc handler mở/đóng modal).
- Chuẩn hóa việc sử dụng `Date.now()` trong render.
- Điều kiện nghiệm thu: `pnpm lint` chạy thành công với 0 errors và 0 warnings.

### Giai đoạn 5: Thêm Test tự động (Vitest + Supertest)
- Tách Express configuration và Server listen: `be/src/app.js` (export app) và `be/src/server.js` (gọi `app.listen`).
- Thiết lập cấu trúc test `be/tests/`:
  - `helpers/`: `auth.js` (mock JWT token), `fixtures.js` (data mẫu).
  - `integration/`: `auth.test.js`, `classes.test.js`, `assignments.test.js`, `tuition.test.js`.
  - `unit/`: `validation.test.js`.
- Điều kiện nghiệm thu: Chạy `npm test` thành công 100% kiểm thử tích hợp cho Auth, Roles, Class Access, Submissions, Grading & Tuition.

---

## 18. Triển khai Giai đoạn 1 & Giai đoạn 2: Sửa đổi & Chuẩn hóa Validation (Ngày 08/08/2026)

- **Giai đoạn 1 (Đã triển khai phần trọng yếu, chưa nghiệm thu - ~85%)**:
  - Đã chuyển toàn bộ các controller trả lỗi thủ công (`classController`, `scheduleController`, `attendanceController`) sang dùng `next(error)` để Global Error Handler format đồng bộ lỗi dạng JSON thống nhất và không lộ stack trace trong production.
  - Sửa `classService.js` để ném lỗi `AppError` 404 (không tìm thấy) và 403 (không sở hữu) một cách chính xác thay vì gộp chung và trả về `null`.
  - Thay thế việc ném raw error + gán status code thủ công trong `gradeCategoryService.js` thành `AppError` chuẩn hóa.
  - Review sau triển khai xác nhận Auth, Profile, Subjects, SePay và một số middleware/controller vẫn còn response lỗi thủ công hoặc raw `error.message`; cần tiếp tục chuẩn hóa trước khi nghiệm thu toàn Phase 1.
- **Giai đoạn 2 (Đã triển khai phần trọng yếu, chưa nghiệm thu - ~70%)**:
  - Tạo mới và mở rộng [commonSchema.js](file:///d:/Study/Owly/be/src/validation/commonSchema.js) định nghĩa đầy đủ Single parameter, Combined parameters (tránh Zod strip params trên route nhiều params), và các Query validation schemas.
  - Áp dụng parameter validation cho tất cả các routes nhận UUID của 7 phân hệ.
  - Đưa body validation của phân hệ Học phí (Tuition) về route middleware thay vì gọi `.parse` thủ công ở controller, tránh trả lỗi 500 do Zod error.
  - Áp dụng pagination và filter validation trên tất cả 8 danh sách endpoints chính, đồng thời định nghĩa `studentScheduleQuerySchema` cho `/me/schedule`.
  - Loại bỏ việc parsing page/limit thủ công trong controllers.
  - Bổ sung 8 request Bruno mới tại thư mục `be/bruno/Validation` để kiểm tra validation thủ công.
  - Review sau triển khai xác nhận `studentScheduleQuerySchema` mới kiểm tra định dạng ngày bằng regex, chưa chặn ngày không tồn tại hoặc `startDate > endDate`.
  - Các request Bruno Validation chưa có assertion tự động và một số request còn hardcode UUID; chưa được coi là regression test suite cho đến khi bổ sung `tests {}` và biến environment/fixture.
