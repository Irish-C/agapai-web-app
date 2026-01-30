import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/index.js';

// 1. Setup the PG Pool
const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL 
});

// 2. Instantiate with the adapter (REQUIRED in Prisma 7)
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;