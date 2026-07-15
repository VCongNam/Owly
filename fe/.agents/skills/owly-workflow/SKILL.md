---
name: owly-workflow
description: Bắt buộc tuân thủ quy trình chuẩn hóa làm việc với dự án Owly, bao gồm việc đọc Kế hoạch đã duyệt (Approved Plans) và bảo trì bộ sưu tập Bruno API.
---

# Owly Workflow Skill

Kỹ năng này định nghĩa các quy tắc cốt lõi (Core Rules) bắt buộc AI phải tuân thủ khi thao tác trên hệ thống dự án Owly. Không được bỏ qua dưới mọi hình thức.

---

## 1. Bắt buộc đọc Code Standard và Kỹ năng (Skill) Frontend
**TRƯỚC KHI BẮT ĐẦU VIẾT BẤT KỲ DÒNG CODE NÀO**, bạn PHẢI:
- Tìm và đọc các file chứa tiêu chuẩn code (VD: `CODE_STANDARD.md` nếu có) nằm trong thư mục `fe`.
- Bắt buộc đọc và áp dụng các Kỹ năng thẩm mỹ/thiết kế được cấu hình tại các file `SKILL.md` trong thư mục `fe` (VD: `fe/.agents/skills/design-taste-frontend/SKILL.md`). Điều này đảm bảo tính nhất quán về UI/UX và kiến trúc mã nguồn.

## 2. Bắt buộc Đọc Kế Hoạch (Approved Plans)

**Trước khi đề xuất hoặc viết bất kỳ Kế hoạch triển khai (Implementation Plan) nào mới**, bạn PHẢI:
- Tìm và đọc file `APPROVED_PLANS.md` (nằm trong thư mục `E:\Data\Owly\approved_plans\APPROVED_PLANS.md`).
- Đảm bảo kế hoạch mới của bạn không xung đột với các quyết định kiến trúc, công nghệ hoặc UI/UX đã được chốt trong các kế hoạch trước đó.

## 3. Bắt buộc Cập nhật Bruno (API Documentation)

- Bruno là công cụ kiểm thử API chính của dự án (tương tự Postman), thư mục chứa nằm tại `be/bruno/`.
- **MỖI KHI** bạn viết thêm một Endpoint API mới (hoặc sửa đổi Request/Response của API cũ), bạn **BẮT BUỘC** phải tự động cập nhật hoặc tạo mới file `.bru` tương ứng trong thư mục `be/bruno/`.
- Không được yêu cầu người dùng nhắc nhở việc này. Đây là bước bắt buộc để kết thúc một tác vụ liên quan đến Backend API.

## 4. Quy trình Lưu trữ Kế Hoạch (Plan Archiving)

- Khi bạn đề xuất một Kế hoạch (thông qua Artifact `implementation_plan.md` với `request_feedback = true`) và được người dùng duyệt (Approve).
- **Ngay sau khi được duyệt**, bạn PHẢI sử dụng công cụ để ghi nối tiếp (append) tóm tắt của kế hoạch đó vào cuối file `APPROVED_PLANS.md` (tại `E:\Data\Owly\approved_plans\APPROVED_PLANS.md`).
- Ghi rõ Ngày tháng duyệt và gạch đầu dòng các tính năng/thay đổi cốt lõi. Không được để mất dấu vết các quyết định quan trọng.

---
*Lưu ý: Các quy tắc trên hoạt động song song với chuẩn Code (Code Standards) và các kỹ năng thẩm mỹ UI (vd: `design-taste-frontend`) đã được định nghĩa ở các file SKILL.md khác.*
