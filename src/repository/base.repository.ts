/*
 * BaseRepository class for generic database operations
 * This class provides methods for checking existence, counting records,
 * and finding records with pagination.
 */

// Prisma model delegates are fully dynamic objects whose delegate type is an
// internal Prisma generic.  Typing them without `any` requires importing
// private Prisma internals, which couples this class to the generated client.
// Proper generic typing is tracked as a Phase 2 improvement.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */

import type { PrismaClient } from '../generated/prisma/client';
import type { PaginationParams } from '../types';

export abstract class BaseRepository {
    protected prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Generic method to check if a record exists
    protected async exists(model: any, where: any): Promise<boolean> {
        const record = await model.findFirst({
            where,
            select: { id: true },
        });
        return record !== null;
    }

    // Generic method to count records
    protected async count(model: any, where?: any): Promise<number> {
        return await model.count({ where });
    }

    // Generic method to find many with pagination
    protected async findManyWithPagination<T>(
        model: any,
        where?: any,
        orderBy?: any,
        pagination?: PaginationParams,
    ): Promise<T[]> {
        return await model.findMany({
            where,
            orderBy,
            skip: pagination?.skip,
            take: pagination?.take,
        });
    }
}
