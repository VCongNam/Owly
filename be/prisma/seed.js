// be/prisma/seed.js
import { prisma } from '../src/config/db.js';

const initialSubjects = [
  { name: 'Toán học', code: 'MATH' },
  { name: 'Vật lý', code: 'PHYSICS' },
  { name: 'Hóa học', code: 'CHEMISTRY' },
  { name: 'Sinh học', code: 'BIOLOGY' },
  { name: 'Ngữ văn', code: 'LITERATURE' },
  { name: 'Lịch sử', code: 'HISTORY' },
  { name: 'Địa lý', code: 'GEOGRAPHY' },
  { name: 'Tiếng Anh', code: 'ENGLISH' },
  { name: 'Tin học', code: 'COMPUTER_SCIENCE' },
  { name: 'Mỹ thuật', code: 'FINE_ARTS' },
  { name: 'Âm nhạc', code: 'MUSIC' },
  { name: 'Khác', code: 'OTHER' }
];

async function main() {
  console.log('Bắt đầu khởi tạo danh mục môn học (seeding)...');
  
  for (const sub of initialSubjects) {
    const existing = await prisma.subject.findUnique({
      where: { code: sub.code }
    });
    
    if (!existing) {
      const created = await prisma.subject.create({
        data: sub
      });
      console.log(`- Đã tạo: ${created.name} (${created.code}) - ID: ${created.id}`);
    } else {
      console.log(`- Bỏ qua (Đã tồn tại): ${existing.name} (${existing.code}) - ID: ${existing.id}`);
    }
  }
  
  console.log('Hoàn thành khởi tạo danh mục môn học!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi chạy seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Không cần đóng vì module export chia sẻ instance
  });
