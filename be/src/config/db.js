// be/src/config/db.js
import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { PrismaClient } = pkg;
const connectionString = process.env.DATABASE_URL;

let prisma;

if (process.env.NODE_ENV === 'production') {
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Tránh việc hot-reloading của nodemon tạo ra quá nhiều client kết nối gây tràn pool ở môi trường dev
  if (!global.prisma) {
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export { prisma };
