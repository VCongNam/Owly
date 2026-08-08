# Tiến độ Kế hoạch Chuẩn hóa & Nâng cấp 5 Giai đoạn

**Ngày cập nhật:** 08/08/2026  
**Tài liệu kế hoạch gốc:** Mục 17 trong `approved_plans/APPROVED_PLANS.md`  
**Mục tiêu:** Đưa phần code hiện có của Owly đến trạng thái an toàn, kiểm thử được và sẵn sàng cho UAT/Production.

---

## 1. Tổng quan tiến độ

| Giai đoạn | Tiến độ ước tính | Trạng thái |
|---|---:|---|
| 1. Khóa lỗ hổng backend & chuẩn hóa phân quyền | 90% | Gần hoàn tất |
| 2. Chuẩn hóa Validation Zod | 15% | Đang triển khai |
| 3. Hoàn thiện Bruno & Security Test Suite | 15% | Đang triển khai bước đầu |
| 4. Làm sạch Frontend | 0% | Chưa triển khai |
| 5. Thêm Test tự động | 0% | Chưa triển khai |

**Tiến độ tổng thể của riêng kế hoạch 5 giai đoạn:** khoảng **30–35%**.

> Tiến độ trên phản ánh trạng thái code tại ngày 08/08/2026. Một giai đoạn chỉ được đánh dấu hoàn tất khi đáp ứng đầy đủ điều kiện nghiệm thu, không chỉ dựa trên việc đã có file hoặc code khởi tạo.

---

## 2. Giai đoạn 1 — Khóa lỗ hổng backend & Chuẩn hóa phân quyền

### 2.1. Phần đã hoàn thành

- [x] Tạo `be/src/utils/authHelpers.js`.
- [x] Tạo `assertClassAccess(userId, userRole, classId)`:
  - Teacher phải là chủ sở hữu lớp.
  - Student phải có `ClassEnrollment` với `isActive: true`.
  - Lớp không tồn tại trả HTTP `404`.
  - Không có quyền trả HTTP `403`.
- [x] Tạo `requireTeacher(req)` và `requireStudent(req)` dùng `AppError`.
- [x] Bảo vệ `GET /api/assignments/class/:classId` bằng `assertClassAccess`.
- [x] Bảo vệ thao tác tạo, sửa và xóa bài tập theo quyền sở hữu lớp.
- [x] Kiểm tra enrollment active trước khi học sinh nộp bài.
- [x] Chặn học sinh nộp bài sau `dueDate`.
- [x] Chặn nộp lại sau khi bài đã được chấm.
- [x] Kiểm tra giáo viên sở hữu bài tập trước khi xem danh sách bài nộp hoặc chấm bài.
- [x] Kiểm tra điểm chấm thỏa mãn `0 <= grade <= maxPoints`.
- [x] Tạo Global Error Handler và đăng ký sau tất cả routes.
- [x] Chuyển phần lớn lỗi nghiệp vụ backend sang `AppError`.

### 2.2. Phần còn lại

- [ ] Chuyển hai `throw new Error()` còn lại trong `be/src/services/r2.service.js` sang `AppError` phù hợp.
- [ ] Áp dụng `assertClassAccess` hoặc helper phân quyền tương đương cho:
  - Posts.
  - Materials.
  - Sessions và Session Feedback.
  - Tuition và Invoices.
  - Class Members.
- [ ] Validate và giới hạn `limit` của `GET /api/assignments/teacher/upcoming`.
- [ ] Rà soát tất cả endpoint nhận `classId`, bảo đảm không endpoint nào chỉ kiểm tra đăng nhập mà bỏ qua quyền truy cập lớp.
- [ ] Chạy đầy đủ ca kiểm thử truy cập chéo giữa hai giáo viên và hai học sinh.

### 2.3. Điều kiện nghiệm thu

- Tài nguyên không tồn tại trả `404`.
- Người dùng sai vai trò hoặc không sở hữu tài nguyên trả `403`.
- Dữ liệu đầu vào không hợp lệ trả `400`.
- Không có lỗi nghiệp vụ nào bị trả nhầm thành `500`.
- Student ngoài lớp hoặc enrollment inactive không đọc/nộp dữ liệu của lớp.
- Teacher không thể sửa, xóa hoặc chấm dữ liệu thuộc lớp của teacher khác.
- Response lỗi là JSON thống nhất và không lộ stack trace trong Production.

---

## 3. Giai đoạn 2 — Chuẩn hóa Validation Zod

### 3.1. Phần đã hoàn thành

- [x] Nâng cấp `validate(schema, target)` để hỗ trợ `body`, `query` và `params`.
- [x] Dùng `safeParse` và ghi dữ liệu đã coerce/default trở lại `req[target]`.
- [x] Tạo `be/src/validation/paginationSchema.js`.
- [x] Áp dụng pagination validation cho `GET /api/assignments/class/:classId`.

### 3.2. Phần còn lại

- [ ] Tạo `be/src/validation/commonSchema.js`.
- [ ] Bổ sung các schema dùng chung:
  - `idParamsSchema`.
  - `classIdParamsSchema`.
  - `assignmentIdParamsSchema`.
  - `submissionIdParamsSchema`.
  - `sessionIdParamsSchema`.
  - `transactionIdParamsSchema`.
  - `upcomingLimitSchema`.
- [ ] Áp dụng validation `params` cho tất cả route nhận ID.
- [ ] Áp dụng validation `query` và pagination cho các phân hệ:
  - Assignments.
  - Classes.
  - Students.
  - Schedule.
  - Materials.
  - Posts.
  - Tuition.
- [ ] Loại bỏ `parseInt(req.query...)` thủ công trong controller sau khi route đã coerce bằng Zod.
- [ ] Rà soát tất cả API trả danh sách để bảo đảm có `items` và `pagination`, ngoại trừ danh mục nhỏ và cố định.

### 3.3. Điều kiện nghiệm thu

Các trường hợp sau phải trả HTTP `400` cùng response JSON thống nhất:

- `page=0`.
- `page=-1`.
- `page=abc`.
- `limit=0`.
- `limit=101`.
- `limit=abc`.
- ID sai định dạng UUID.
- Body thiếu trường bắt buộc hoặc sai kiểu dữ liệu.

---

## 4. Giai đoạn 3 — Hoàn thiện Bruno & Security Test Suite

### 4.1. Phần đã hoàn thành

- [x] Cập nhật `Assignment/Get Assignments.bru` cho pagination.
- [x] Cập nhật `Assignment/Submit Homework.bru` cho enrollment và deadline guard.
- [x] Bộ Bruno hiện có bao phủ phần lớn happy path của Auth, Classes, Students, Schedule, Attendance, Materials, Posts, Assignments, Grade Categories, Tuition và Feedback.

### 4.2. Request Bruno còn thiếu

- [ ] `Assignment/Update Assignment.bru`.
- [ ] `Assignment/Delete Assignment.bru`.
- [ ] `Schedule/Get Class Sessions.bru`.
- [ ] `Students/Bulk Import Students.bru`.
- [ ] `Students/Download Student Template.bru`.
- [ ] `Tuition/Get My Invoices.bru`.
- [ ] `Upload/Upload Files.bru`.

### 4.3. Security Test Suite cần tạo

Tạo thư mục `be/bruno/Security/` với tối thiểu các request:

- [ ] `Student Access Foreign Class.bru`.
- [ ] `Student Access Inactive Enrollment.bru`.
- [ ] `Student Submit Foreign Assignment.bru`.
- [ ] `Student Submit Expired Assignment.bru`.
- [ ] `Teacher Update Foreign Assignment.bru`.
- [ ] `Teacher Grade Foreign Submission.bru`.
- [ ] `Grade Exceeds Max Points.bru`.
- [ ] `Student Submit Foreign Invoice.bru`.
- [ ] `Teacher Review Foreign Transaction.bru`.
- [ ] `Invalid Pagination.bru`.
- [ ] `Invalid UUID Params.bru`.
- [ ] `Invalid SePay Token.bru`.
- [ ] `Duplicate SePay Webhook.bru`.

### 4.4. Bộ dữ liệu kiểm thử chuẩn

- `teacherA`: chủ sở hữu `classA`.
- `teacherB`: không sở hữu `classA`.
- `studentA`: enrollment active trong `classA`.
- `studentB`: không tham gia `classA`.
- `studentInactive`: từng tham gia nhưng enrollment không active.
- Một assignment còn hạn và một assignment đã quá hạn.
- Một submission chưa chấm và một submission đã có feedback.
- Một invoice thuộc `studentA` và một transaction đang Pending.

### 4.5. Điều kiện nghiệm thu

- Tất cả happy path trả đúng HTTP status và response format.
- Tất cả truy cập chéo trả `403` hoặc `404` theo thiết kế.
- Tất cả input sai trả `400`.
- Request Bruno không phụ thuộc ID hardcode không còn tồn tại.
- Local và Production environment không chứa secret thật trong repository.

---

## 5. Giai đoạn 4 — Làm sạch Frontend

### 5.1. Baseline hiện tại

Kết quả `pnpm lint` tại `fe/` ngày 08/08/2026:

```text
70 problems (62 errors, 8 warnings)
```

### 5.2. Phần còn lại

- [ ] Xóa import và biến không sử dụng.
- [ ] Xử lý các assignment không có tác dụng.
- [ ] Sửa dependency array của React hooks.
- [ ] Tái cấu trúc việc reset state trong effect.
- [ ] Tách data fetching khỏi component hiển thị sang custom hooks khi phù hợp.
- [ ] Loại bỏ việc gọi hàm không thuần như `Date.now()` trực tiếp trong render.
- [ ] Rà lại loading, empty state và error state sau khi tái cấu trúc hooks.
- [ ] Kiểm tra lại giao diện light/dark mode.
- [ ] Kiểm tra responsive cho table, modal, form và dashboard.
- [ ] Chạy build frontend sau khi lint sạch.

### 5.3. Điều kiện nghiệm thu

```powershell
cd fe
pnpm lint
pnpm build
```

- Lint đạt `0 errors`, `0 warnings`.
- Build thành công.
- Không phát sinh vòng lặp fetch, request lặp hoặc render dây chuyền.
- Các luồng Teacher và Student vẫn hoạt động đúng sau khi refactor.

---

## 6. Giai đoạn 5 — Test tự động với Vitest + Supertest

### 6.1. Trạng thái hiện tại

- [ ] Chưa có test runner thực tế cho backend.
- [ ] Chưa có thư mục `be/tests/`.
- [ ] Chưa tách `app.listen()` khỏi `be/src/app.js`.
- [ ] Chưa có `be/src/server.js`.

### 6.2. Công việc cần triển khai

- [ ] Cài đặt và cấu hình Vitest + Supertest.
- [ ] Tách Express application:
  - `be/src/app.js`: cấu hình middleware/routes và export `app`.
  - `be/src/server.js`: import `app` và gọi `app.listen()`.
- [ ] Tạo cấu trúc:

```text
be/tests/
├── helpers/
│   ├── auth.js
│   └── fixtures.js
├── integration/
│   ├── auth.test.js
│   ├── classes.test.js
│   ├── assignments.test.js
│   └── tuition.test.js
└── unit/
    └── validation.test.js
```

- [ ] Mock hoặc cô lập Supabase, Prisma, R2 và SePay phù hợp với từng loại test.
- [ ] Sử dụng database test riêng cho integration test; không dùng database Production.
- [ ] Bổ sung script `test`, `test:watch` và `test:coverage` vào `be/package.json`.
- [ ] Chạy test trong CI trước khi merge hoặc deploy.

### 6.3. Phạm vi test tối thiểu

- Authentication và refresh token.
- Role Teacher/Student.
- Class ownership và active enrollment.
- Tạo, sửa, xóa và xem bài tập.
- Nộp bài, quá hạn, nộp lại và chấm điểm.
- Grade không vượt `maxPoints`.
- Xem hóa đơn cá nhân.
- Nộp minh chứng thanh toán.
- Giáo viên duyệt/từ chối transaction.
- Webhook sai token và webhook gửi trùng.
- Pagination và UUID validation.

### 6.4. Điều kiện nghiệm thu

```powershell
cd be
pnpm test
```

- Tất cả test bắt buộc chạy thành công.
- Không test nào phụ thuộc Production database hoặc secret thật.
- Test phân quyền bao phủ cả happy path và truy cập chéo.
- Test thất bại phải làm command trả exit code khác `0`.

---

## 7. Thứ tự triển khai còn lại

1. Hoàn tất các việc còn lại của Giai đoạn 1.
2. Hoàn tất validation cho toàn bộ 7 phân hệ ở Giai đoạn 2.
3. Tạo Bruno Security Suite và chạy kiểm thử API thủ công.
4. Sửa frontend đến khi lint sạch và build thành công.
5. Tách Express app/server và thêm test tự động.
6. Chạy regression test toàn hệ thống trước UAT.

Không bắt đầu phát triển Gradebook, Progress Report, Admin Portal hoặc mở rộng Mobile trước khi các lỗi bảo mật và validation trọng yếu của Giai đoạn 1–2 được nghiệm thu.

---

## 8. Quy tắc cập nhật tài liệu tiến độ

- Cập nhật ngày mỗi khi thay đổi trạng thái của một giai đoạn.
- Chỉ đánh dấu `[x]` khi code đã được kiểm tra và đáp ứng điều kiện nghiệm thu.
- Khi thêm hoặc sửa endpoint, bắt buộc cập nhật Bruno tương ứng.
- Ghi lại kết quả thực tế của lint, build và test; không chỉ ghi “đã chạy”.
- Khi hoàn thành một giai đoạn, ghi rõ command đã chạy và kết quả cuối cùng.
- Không ghi giai đoạn hoàn tất nếu vẫn còn lỗi bảo mật, lint hoặc test bắt buộc liên quan.
