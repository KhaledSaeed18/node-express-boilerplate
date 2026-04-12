/*
 * src/middleware/pagination.middleware.ts
 * Middleware for handling pagination in API responses.
 * This middleware extracts pagination parameters from the request and provides a method to fetch paginated results from a Prisma model.
 */

// Prisma model delegates and query objects are dynamically typed internals.
// Proper typing requires Prisma's private generic types — tracked for Phase 2.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

import type { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Request {
            pagination?: {
                page: number;
                limit: number;
                skip: number;
                getPaginationResult<T>(
                    prismaModel: any,
                    prismaQuery: any,
                ): Promise<PaginationResult<T>>;
            };
        }
    }
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
        hasNext: boolean;
        hasPrevious: boolean;
        nextPage: number | null;
        previousPage: number | null;
    };
}

// Middleware to handle pagination
// Extracts page and limit from query parameters
// Adds a method to the request object to fetch paginated results from a Prisma model
export const paginateResults = (req: Request, _res: Response, next: NextFunction): void => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    req.pagination = {
        page,
        limit,
        skip: (page - 1) * limit,
        async getPaginationResult<T>(
            prismaModel: any,
            prismaQuery: any,
        ): Promise<PaginationResult<T>> {
            const totalItems = await prismaModel.count({
                where: prismaQuery.where,
            });

            const totalPages = Math.ceil(totalItems / limit);

            const results = await prismaModel.findMany({
                ...prismaQuery,
                skip: (page - 1) * limit,
                take: limit,
            });

            return {
                data: results,
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    pageSize: limit,
                    hasNext: page < totalPages,
                    hasPrevious: page > 1,
                    nextPage: page < totalPages ? page + 1 : null,
                    previousPage: page > 1 ? page - 1 : null,
                },
            };
        },
    };

    next();
};
