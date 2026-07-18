import { z } from 'zod';

export const upsertAttendanceSchema = z.object({
  attendances: z.array(
    z.object({
      studentId: z.string().uuid('ID Học sinh không hợp lệ'),
      status: z.enum(['Present', 'Absent', 'Late', 'Excused'], {
        errorMap: () => ({ message: 'Trạng thái điểm danh không hợp lệ' })
      }),
      notes: z.string().optional().nullable()
    })
  ).min(1, 'Danh sách điểm danh không được để trống')
});
