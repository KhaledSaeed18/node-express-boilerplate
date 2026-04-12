/*
 * src/database/prismaClient.ts
 * This file initializes the Prisma Client and connects to the database.
 * It exports the Prisma Client instance for use in other parts of the application.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connectPrisma(): Promise<void> {
    try {
        await prisma.$connect();
        console.log('Prisma connected to database successfully');
    } catch (error) {
        console.error('Prisma failed to connect:', error);
    }
}

void connectPrisma();

export default prisma;
