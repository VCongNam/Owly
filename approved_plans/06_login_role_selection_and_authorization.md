# Kế hoạch triển khai: Chọn vai trò Đăng nhập (Giáo viên / Học sinh)

Bổ sung tính năng chọn vai trò đăng nhập (Học sinh hoặc Giáo viên) tại cổng đăng nhập, cập nhật API backend và Prisma service để kiểm tra và phân quyền đúng vai trò, đồng thời điều hướng giao diện phù hợp với từng vai trò.

## Bối cảnh & Yêu cầu

- **Đăng ký (SignUp):** Giữ nguyên như hiện tại (chỉ có Giáo viên được phép tự đăng ký tài khoản). Học sinh sẽ do Giáo viên khởi tạo trực tiếp trong từng lớp học và không có quyền tự đăng ký.
- **Đăng nhập (SignIn):** Cho phép người dùng chọn vai trò là Giáo viên (`teacher`) hoặc Học sinh (`student`) trên giao diện đăng nhập:
  - Nếu tài khoản tồn tại nhưng vai trò thực tế trong cơ sở dữ liệu không khớp với vai trò được chọn tại Form đăng nhập, hệ thống sẽ báo lỗi và từ chối truy cập.
  - Sau khi đăng nhập thành công, thanh Sidebar và giao diện hiển thị sẽ thay đổi linh hoạt theo vai trò (Học sinh sẽ bị giới hạn các quyền quản lý và chỉ xem được các lớp học/lịch học của mình).

---

## Chi tiết các thay đổi trong mã nguồn

### I. Backend (be)

#### 1. [authSchema.js](file:///e:/Data/Owly/be/src/features/auth/authSchema.js)
Bổ sung trường `role` vào `signInSchema` dưới dạng enum để kiểm tra tính hợp lệ của vai trò được truyền lên từ client:
```javascript
export const signInSchema = z.object({
  email: z.string({
    required_error: 'Email không được để trống'
  })
  .min(1, 'Email không được để trống')
  .email('Email không đúng định dạng'),

  password: z.string({
    required_error: 'Mật khẩu không được để trống'
  })
  .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),

  role: z.enum(['teacher', 'student'], {
    required_error: 'Vai trò đăng nhập không được để trống',
    invalid_type_error: 'Vai trò đăng nhập không hợp lệ'
  })
});
```

#### 2. [authService.js](file:///e:/Data/Owly/be/src/features/auth/authService.js)
- Cập nhật hàm `getMyProfile` để tự động kiểm tra xem tài khoản (Account ID) liên kết với hồ sơ Giáo viên (`teacherProfile`), Học sinh (`studentProfile`), hay Quản trị hệ thống (`adminProfile`). Trả về cấu trúc thông tin phẳng hóa (flattened) kèm trường phân biệt `role`.
- Thay thế hàm `signInTeacher` bằng hàm `signInUser` nhận thêm đối số `role`. Sau khi xác thực qua Supabase thành công, hàm sẽ đối chiếu `role` thực tế của tài khoản trong DB với `role` được chọn. Nếu không khớp sẽ ném lỗi:
```javascript
export const signInUser = async (email, password, role) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  const profile = await getMyProfile(data.user.id);

  if (!profile) {
    throw new Error('Tài khoản chưa được tạo hồ sơ');
  }

  if (role && profile.role !== role) {
    throw new Error(`Tài khoản này không đăng ký vai trò ${role === 'teacher' ? 'Giáo viên' : 'Học sinh'}`);
  }

  return {
    user: {
      ...data.user,
      ...profile
    },
    token: data.session?.access_token
  };
};
```

#### 3. [authController.js](file:///e:/Data/Owly/be/src/features/auth/authController.js)
Cập nhật controller `signIn` đón nhận thêm `role` từ request body và chuyển tiếp vào `authService.signInUser`. Nếu ném lỗi sai lệch quyền hạn vai trò, phản hồi về Client với mã lỗi `403 Forbidden` cùng thông báo lỗi tiếng Việt tương ứng.

---

### II. Frontend (fe)

#### 1. [useAuth.js](file:///e:/Data/Owly/fe/src/features/auth/hooks/useAuth.js)
Cập nhật hàm `login` trong global store (Zustand) để nhận thêm tham số `role` (mặc định là `'teacher'`) và truyền tải lên API qua Axios POST:
```javascript
login: async (email, password, rememberMe = false, role = 'teacher') => {
  set({ loading: true, error: null });
  try {
    const response = await apiClient.post('/api/auth/signin', { email, password, role });
    ...
```

#### 2. [SignIn.jsx](file:///e:/Data/Owly/fe/src/features/auth/components/SignIn.jsx)
- Khởi tạo giá trị mặc định cho `role` là `'teacher'` trong `useForm`.
- Sử dụng component `SegmentedControl` của Mantine UI hiển thị thanh chọn vai trò trực quan phía trên ô nhập địa chỉ Email:
```jsx
<SegmentedControl
  fullWidth
  size="md"
  radius="md"
  value={form.values.role}
  onChange={(value) => form.setFieldValue('role', value)}
  data={[
    { label: 'Giáo viên', value: 'teacher' },
    { label: 'Học sinh', value: 'student' },
  ]}
  color="copper"
  mb="lg"
/>
```
- Truyền `values.role` vào hàm `login` khi submit Form.
- **Ẩn Đăng nhập Bên Thứ 3 & Link Đăng ký:** Khi vai trò **Học sinh** được lựa chọn, giao diện sẽ ẩn hoàn toàn các nút đăng nhập qua Google, Facebook, vách ngăn "HOẶC ĐĂNG NHẬP BẰNG EMAIL" và dòng chuyển tiếp đăng ký tài khoản ở dưới cùng để đảm bảo chỉ Giáo viên mới sử dụng các tính năng này.

#### 3. [Sidebar.jsx](file:///e:/Data/Owly/fe/src/shared/components/Sidebar.jsx)
Cấu hình thanh Sidebar phân chia danh mục điều hướng theo vai trò:
- **Giáo viên:** Hiển thị đầy đủ chức năng quản lý lớp, học viên, kho lớp cũ và tùy chọn cấu hình hồ sơ.
- **Học sinh:** Ẩn các mục quản lý chung, chỉ giữ lại "Tổng quan", "Lớp học của tôi", "Lịch & Điểm danh" và "Hồ sơ cá nhân".
- **Hiển thị thông tin:** Đọc `studentCode` đối với vai trò Học sinh, hoặc `teacherCode` đối với vai trò Giáo viên, đồng thời ẩn gói dịch vụ (`packageType`) đối với Học sinh.

---

## Giải quyết Lỗi Đăng nhập Bên thứ 3 (Google OAuth - Unknown argument `avatarUrl`)

### Nguyên nhân lỗi
Gặp lỗi `Unknown argument avatarUrl` khi Prisma Client gọi `prisma.account.update()` để đồng bộ thông tin avatar từ tài khoản Google/Facebook. Lỗi này xuất hiện do file `schema.prisma` đã được cập nhật thêm cột `avatarUrl` và `phone` nhưng Prisma Client cục bộ chưa được biên dịch lại (stale generated client) hoặc server dev chưa được reload để nạp các kiểu dữ liệu mới.

### Khắc phục
1. Kiểm tra cấu trúc bảng `accounts` trong database Postgres và xác thực các cột `avatar_url` (text) và `phone` (varchar) đã tồn tại.
2. Chạy lệnh biên dịch lại Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Khởi động lại (reload) server backend bằng cách cập nhật ghi chú tại [app.js](file:///e:/Data/Owly/be/src/app.js) để trigger Nodemon nạp lại Prisma Client mới biên dịch vào bộ nhớ.

---

## Giải quyết lỗi Chạy yêu cầu Logout vô tận (Infinite Logout loop)

### Nguyên nhân lỗi
Khi đăng nhập thất bại với mã lỗi `401 Unauthorized` (ví dụ: sai mật khẩu hoặc tài khoản chưa kích hoạt), Response Interceptor trong [apiClient.js](file:///e:/Data/Owly/fe/src/services/apiClient.js) bắt được mã 401 và tự động gửi sự kiện `owly_unauthorized` để kích hoạt hàm `logout()`. Trong hàm `logout()`, hệ thống lại gọi API `/api/auth/logout` qua Axios. Do không có Token hợp lệ, API này tiếp tục trả về `401 Unauthorized`, tạo nên một vòng lặp gọi API đăng xuất vô hạn.

### Khắc phục
Cập nhật [apiClient.js](file:///e:/Data/Owly/fe/src/services/apiClient.js) để kiểm tra nếu đường dẫn API là `/api/auth/signin` hoặc `/api/auth/logout`:
- Tránh kích hoạt sự kiện `owly_unauthorized` khi các API này trả về lỗi 401.
- Không hiển thị thông báo lỗi chung "Yêu cầu không hợp lệ" từ Interceptor, để màn hình Signin/Logout tự xử lý thông tin lỗi phù hợp với người dùng.

---

## Kế hoạch kiểm thử & Xác thực

### 1. Kiểm thử tự động
- Đảm bảo dev server của cả backend (`be`) và frontend (`fe`) biên dịch thành công mà không gặp lỗi cú pháp hay cảnh báo ESLint nghiêm trọng.

### 2. Kiểm thử thủ công
- **Kịch bản 1: Đăng nhập Giáo viên**
  - Nhập tài khoản Giáo viên hợp lệ, chọn vai trò **Giáo viên** -> Đăng nhập thành công, chuyển hướng vào trang chủ, hiển thị đầy đủ menu Giáo viên và hiển thị mã số `GVxxx`.
  - Nhập tài khoản Giáo viên, chọn vai trò **Học sinh** -> Báo lỗi "Tài khoản này không đăng ký vai trò Học sinh", từ chối đăng nhập.
  - Các nút Google/Facebook OAuth hiển thị đầy đủ và hoạt động đồng bộ chính xác mà không gặp lỗi `avatarUrl`.
- **Kịch bản 2: Đăng nhập Học sinh**
  - Khi click chọn nút **Học sinh** -> Các nút đăng nhập Google/Facebook, vách ngăn chia và liên kết "Đăng ký ngay" sẽ biến mất khỏi màn hình.
  - Nhập tài khoản Học sinh hợp lệ -> Đăng nhập thành công, chuyển hướng vào trang chủ, hiển thị menu tối giản (không có menu quản lý Học viên & Kho lớp cũ) và mã số `HSxxx`.
  - Nhập tài khoản Học sinh, chọn vai trò **Giáo viên** -> Báo lỗi "Tài khoản này không đăng ký vai trò Giáo viên", từ chối đăng nhập.
