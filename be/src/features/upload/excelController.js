import XLSX from 'xlsx';

export const getStudentTemplate = async (req, res, next) => {
  try {
    // Dữ liệu mẫu hướng dẫn
    const data = [
      {
        'Họ và tên (*)': 'Nguyễn Văn An',
        'Ngày sinh (DD/MM/YYYY) (*)': '15/08/2012',
        'Số điện thoại phụ huynh (*)': '0912345678',
        'Số điện thoại học sinh': '0911223344',
        'Email học sinh': 'an.nguyen@gmail.com'
      },
      {
        'Họ và tên (*)': 'Trần Thị Bình',
        'Ngày sinh (DD/MM/YYYY) (*)': '20/10/2013',
        'Số điện thoại phụ huynh (*)': '0987654321',
        'Số điện thoại học sinh': '',
        'Email học sinh': ''
      }
    ];

    // Tạo workbook và worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sach hoc sinh');

    // Cài đặt độ rộng cột
    worksheet['!cols'] = [
      { wch: 25 }, // Họ và tên (*)
      { wch: 25 }, // Ngày sinh (*)
      { wch: 25 }, // Số điện thoại phụ huynh (*)
      { wch: 25 }, // Số điện thoại học sinh
      { wch: 25 }  // Email học sinh
    ];

    // Viết vào buffer dạng xlsx
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Trả về stream file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=owly_template_hoc_sinh.xlsx');
    res.end(buffer);
  } catch (error) {
    next(error);
  }
};
