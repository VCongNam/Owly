# Kế hoạch triển khai: Hệ thống Phản hồi từ Người dùng (UC-14B)

Bổ sung tính năng cho phép người dùng thông thường (Giáo viên, Học sinh) gửi ý kiến phản hồi về hệ thống (báo lỗi, đề xuất tính năng, góp ý chung) kèm phân loại và nội dung chi tiết. Tính năng này bổ khuyết cho UC-14 (Admin xem/quản lý phản hồi gửi lên).

## Bối cảnh & Yêu cầu

- **Hiện tại:** Hệ thống đã định nghĩa `UC-14: Manage System Feedbacks` cho Admin để tiếp nhận và xử lý góp ý, báo lỗi. Tuy nhiên, ở phía người dùng (Giáo viên, Học sinh) chưa có Usecase gửi cũng như giao diện và API để đẩy phản hồi lên hệ thống.
- **Yêu cầu mới (UC-14B):**
  - **Tài liệu:** Thêm usecase `UC-14B: Submit System Feedback` cho Giáo viên và Học sinh.
  - **Database:** Tạo bảng `system_feedbacks` liên kết với bảng `accounts` để lưu trữ phản hồi.
  - **Backend API:** Cung cấp API gửi phản hồi (`POST /api/feedbacks`) và lấy danh sách phản hồi của chính mình (`GET /api/feedbacks/my`).
  - **Frontend UI:** Giao diện trang phản hồi gồm Form nhập phản hồi (loại, tiêu đề, nội dung) và bảng lịch sử phản hồi đã gửi kèm trạng thái xử lý (`Pending`, `Reviewed`, `Resolved`).

---

## Chi tiết các thay đổi trong mã nguồn

### I. Database (be/prisma/schema.prisma)

Bổ sung model `SystemFeedback` để lưu thông tin phản hồi của người dùng:

```prisma
model SystemFeedback {
  id          String   @id @default(uuid()) @db.Uuid
  accountId   String   @map("account_id") @db.Uuid
  type        String   @db.VarChar(50) // "Bug" (Báo lỗi), "FeatureRequest" (Đề xuất), "GeneralFeedback" (Góp ý)
  title       String   @db.VarChar(255)
  content     String   @db.Text
  status      String   @default("Pending") @db.VarChar(50) // "Pending", "Reviewed", "Resolved"
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  account     Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@map("system_feedbacks")
}
```

Cập nhật quan hệ ở model `Account`:
```prisma
model Account {
  ...
  systemFeedbacks SystemFeedback[]
  ...
}
```

---

### II. Backend (be)

#### 1. Định nghĩa Routes (`be/src/features/systemFeedbacks/feedbackRoutes.js`)
Tạo các endpoint xử lý phản hồi và tích hợp `authMiddleware`:
```javascript
import express from 'express';
import { authMiddleware } from '../../middlewares/auth.js';
import * as feedbackController from './feedbackController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', feedbackController.createFeedback);
router.get('/my', feedbackController.getMyFeedbacks);

export default router;
```

#### 2. Định nghĩa Controllers (`be/src/features/systemFeedbacks/feedbackController.js`)
Xử lý logic nghiệp vụ và tương tác với Prisma:
- **`createFeedback`**: Nhận `type`, `title`, `content` từ request body, lấy `accountId` từ `req.user.id`, kiểm tra dữ liệu hợp lệ và lưu vào database.
- **`getMyFeedbacks`**: Lấy danh sách phản hồi thuộc sở hữu của `accountId` hiện tại, sắp xếp theo thời gian mới nhất (`createdAt: 'desc'`).

#### 3. Cấu hình App (`be/src/app.js`)
Đăng ký router cho phân hệ phản hồi:
```javascript
import feedbackRoutes from './features/systemFeedbacks/feedbackRoutes.js';
...
app.use('/api/feedbacks', feedbackRoutes);
```

---

### III. Frontend (fe)

#### 1. Thêm trang Phản hồi (`fe/src/features/feedback/components/FeedbackPage.jsx`)
Giao diện xây dựng bằng Mantine UI và CSS Modules:
- **Phía trên:** Form gửi phản hồi gồm:
  - Select chọn `Loại phản hồi` (Báo lỗi, Yêu cầu tính năng, Góp ý khác).
  - Input nhập `Tiêu đề`.
  - Textarea nhập `Nội dung chi tiết`.
  - Nút `Gửi phản hồi` hiển thị trạng thái loading khi đang call API.
- **Phía dưới:** Bảng danh sách hiển thị lịch sử phản hồi đã gửi của user, bao gồm:
  - Cột: Ngày gửi, Loại phản hồi (kèm Badge màu tương ứng), Tiêu đề, Trạng thái xử lý (kèm Badge trạng thái màu sắc trực quan).

#### 2. Cập nhật Sidebar (`fe/src/shared/components/Sidebar.jsx`)
- Import icon `EnvelopeSimpleOpen` hoặc `ChatTeardropText` từ `@phosphor-icons/react`.
- Bổ sung menu `Phản hồi hệ thống` trỏ tới route `/feedback` trong danh sách menu của Giáo viên (`TEACHER_NAV_SECTIONS`) và Học sinh (`STUDENT_NAV_SECTIONS`).

#### 3. Cập nhật Router (`fe/src/routes/AppRoutes.jsx`)
- Khai báo và import trang `FeedbackPage` mới.
- Thêm Route `/feedback` nằm trong khu vực các route được bảo vệ (`ProtectedRoute`).

---

## Kế hoạch kiểm thử & Xác thực

### 1. Đồng bộ và di cư Database
Chạy lệnh tạo migration để đồng bộ cấu trúc bảng `system_feedbacks` vào PostgreSQL:
```bash
npx prisma migrate dev --name add_system_feedbacks
```

### 2. Kiểm thử thủ công (Manual Verification)
- **Đăng nhập:** Đăng nhập dưới vai trò bất kỳ (Giáo viên hoặc Học sinh).
- **Giao diện:** Click mục `Phản hồi hệ thống` trên thanh Sidebar, kiểm tra xem trang có hiển thị đầy đủ form gửi phản hồi và bảng lịch sử trống hay không.
- **Gửi phản hồi:** Nhập nội dung lỗi giả lập và click gửi. Kiểm tra toast thông báo thành công, và bảng lịch sử cập nhật ngay lập tức dòng phản hồi vừa gửi kèm badge trạng thái `Chờ xử lý` (`Pending`).
- **Database Check:** Truy vấn Postgres hoặc Prisma Studio để kiểm tra dòng dữ liệu feedback đã lưu đúng email/accountId của tài khoản đang đăng nhập.
