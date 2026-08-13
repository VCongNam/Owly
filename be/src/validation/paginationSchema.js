// be/src/validation/paginationSchema.js
// Schema Zod tái sử dụng cho các endpoint phân trang (dùng với validate(schema, 'query'))
// Tuân thủ Owly Code Standard: page min 1, limit min 1 max 100
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int('page phải là số nguyên').min(1, 'page phải lớn hơn hoặc bằng 1').default(1),
  limit: z.coerce.number().int('limit phải là số nguyên').min(1, 'limit phải lớn hơn hoặc bằng 1').max(100, 'limit tối đa là 100').default(10)
});
