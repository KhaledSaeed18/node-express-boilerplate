import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

// DATABASE_URL is injected from .env.test by Vitest before this module is imported
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const testPrisma = new PrismaClient({ adapter });

export async function cleanDatabase(): Promise<void> {
    // Delete in FK dependency order: notes reference users
    await testPrisma.note.deleteMany();
    await testPrisma.user.deleteMany();
}
