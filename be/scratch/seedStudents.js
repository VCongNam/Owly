// be/scratch/seedStudents.js
import { prisma } from '../src/config/db.js';
import { supabase } from '../src/config/supabase.js';
import { generateStudentCode } from '../src/features/students/studentService.js';

async function seed() {
  console.log('--- KHỞI TẠO HỌC SINH MẪU (SEEDING STUDENTS) ---');
  
  // 1. Tìm giáo viên đầu tiên trong database để gán làm người tạo
  const teacher = await prisma.teacher.findFirst();
  if (!teacher) {
    console.error('LỖI: Không tìm thấy giáo viên nào trong database! Vui lòng đăng ký/tạo 1 tài khoản giáo viên trước.');
    process.exit(1);
  }
  
  console.log(`Đã tìm thấy giáo viên: ${teacher.fullName} (ID: ${teacher.id})`);

  // Danh sách học sinh mẫu cần tạo
  const mockStudents = [
    { fullName: 'Nguyễn Văn Anh', dateOfBirth: '2010-05-15', parentPhone: '0912345678' },
    { fullName: 'Trần Thị Bình', dateOfBirth: '2011-08-20', parentPhone: '0987654321' },
    { fullName: 'Lê Hoàng Châu', dateOfBirth: '2010-12-01', parentPhone: '0905111222' }
  ];

  for (const studentData of mockStudents) {
    try {
      // Chạy transaction để tự sinh mã và lưu đồng bộ
      const result = await prisma.$transaction(async (tx) => {
        const studentCode = await generateStudentCode(tx);
        const email = `${studentCode.toLowerCase()}@owly.vn`;
        const password = 'Owly@123456'; // Mật khẩu mặc định

        console.log(`Đang tạo học sinh: ${studentData.fullName} (${studentCode})...`);

        // Tạo tài khoản trên Supabase Auth bằng Admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: 'student',
            full_name: studentData.fullName
          }
        });

        if (authError) {
          throw new Error(`Lỗi Supabase Auth: ${authError.message}`);
        }

        const studentId = authData.user.id;

        // Tạo Account trong database cục bộ
        await tx.account.create({
          data: {
            id: studentId,
            email,
            passwordHash: 'EXTERNAL_SUPABASE_AUTH',
            isActive: true
          }
        });

        // Tạo Student
        const student = await tx.student.create({
          data: {
            id: studentId,
            studentCode,
            fullName: studentData.fullName,
            dateOfBirth: new Date(studentData.dateOfBirth),
            parentPhone: studentData.parentPhone,
            createdById: teacher.id
          }
        });

        return { student, email, password };
      });

      console.log(`✅ Thành công: ${result.student.fullName}`);
      console.log(`   - Mã HS: ${result.student.studentCode}`);
      console.log(`   - Email: ${result.email}`);
      console.log(`   - Mật khẩu: ${result.password}`);
    } catch (error) {
      console.error(`❌ Thất bại khi tạo ${studentData.fullName}:`, error.message);
    }
  }

  console.log('--- HOÀN THÀNH SEED HỌC SINH ---');
  process.exit(0);
}

seed();
