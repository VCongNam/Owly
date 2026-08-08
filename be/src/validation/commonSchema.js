import { z } from 'zod';
import { paginationSchema } from './paginationSchema.js';

const uuidField = (name) => z.string().uuid(`${name} phải là UUID hợp lệ`);

// ── Single-param schemas ──────────────────────────────────────────────────────
export const idParamsSchema            = z.object({ id: uuidField('id') });
export const classIdParamsSchema       = z.object({ classId: uuidField('classId') });
export const assignmentIdParamsSchema  = z.object({ assignmentId: uuidField('assignmentId') });
export const submissionIdParamsSchema  = z.object({ submissionId: uuidField('submissionId') });
export const sessionIdParamsSchema     = z.object({ sessionId: uuidField('sessionId') });
export const transactionIdParamsSchema = z.object({ transactionId: uuidField('transactionId') });
export const invoiceIdParamsSchema     = z.object({ invoiceId: uuidField('invoiceId') });
export const postIdParamsSchema        = z.object({ postId: uuidField('postId') });

// ── Combined-param schemas (để không bị Zod strip mất key trong req.params) ───
export const classAndSessionIdParamsSchema = z.object({
  classId:   uuidField('classId'),
  sessionId: uuidField('sessionId'),
});

export const classAndStudentIdParamsSchema = z.object({
  classId:   uuidField('classId'),
  studentId: uuidField('studentId'),
});

export const classAndCategoryIdParamsSchema = z.object({
  classId: uuidField('classId'),
  id:      uuidField('id'),
});

// ── Query schemas (khớp đúng enum value của DB/Service và giữ lại filter) ─────
export const classListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(['active_only', 'Scheduled', 'OnGoing', 'Completed', 'Archived']).optional(),
});

export const memberListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const studentListQuerySchema = paginationSchema.extend({
  search:  z.string().optional(),
  classId: z.string().uuid('classId phải là UUID hợp lệ').optional(),
});

export const invoiceListQuerySchema = paginationSchema.extend({
  billingMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'billingMonth phải có định dạng YYYY-MM').optional(),
  status:       z.enum(['Unpaid', 'Pending', 'Paid']).optional(),
  search:       z.string().optional(),
});

export const studentScheduleQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate phải đúng định dạng YYYY-MM-DD').optional(),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate phải đúng định dạng YYYY-MM-DD').optional(),
  classId:   z.string().uuid('classId phải là UUID hợp lệ').optional(),
});

export const upcomingLimitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
});
