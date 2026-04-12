/*
 * src/controllers/base.controller.ts
 * This file contains the BaseController class which provides common methods for handling requests and responses.
 * It includes methods for validation error handling, error handling, sending responses, pagination, user ID retrieval, and cookie management.
 */

import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AppError, ValidationError } from '../errors';

export abstract class BaseController {
    /**
     * Handles validation errors from the request.
     * If there are validation errors, it formats them and passes them to the next middleware.
     */
    protected handleValidationErrors(req: Request, next: NextFunction): boolean {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map((err) => ({
                field: err.type === 'field' ? err.path : 'unknown',
                message: err.msg as string,
                value: err.type === 'field' ? (err.value as unknown) : undefined,
            }));

            const formattedMessage = errorMessages
                .map((err) => `${err.field}: ${err.message}`)
                .join(', ');

            next(new ValidationError(formattedMessage, errorMessages));
            return false;
        }
        return true;
    }

    /**
     * Handles errors by passing them to the next middleware.
     */
    protected handleError(error: unknown, next: NextFunction): void {
        next(error);
    }

    /**
     * Sends a response with the specified status code, message, and data.
     */
    protected sendResponse(
        res: Response,
        statusCode: number,
        message: string,
        data?: unknown,
    ): void {
        res.status(statusCode).json({
            statusCode,
            message,
            ...(data !== undefined && { data }),
        });
    }

    /**
     * Sends a paginated response with the specified status code, message, data, and pagination details.
     */
    protected sendPaginatedResponse(
        res: Response,
        statusCode: number,
        message: string,
        data: unknown,
        pagination: {
            currentPage?: number;
            totalPages?: number;
            totalItems?: number;
            itemsPerPage?: number;
            hasNext?: boolean;
            hasPrev?: boolean;
        },
    ): void {
        res.status(statusCode).json({
            statusCode,
            message,
            data,
            pagination,
        });
    }

    /**
     * Retrieves the user ID from the request object.
     * If the user ID is not found, it passes an error to the next middleware.
     */
    protected getUserId(req: Request, next: NextFunction): string | null {
        const { userId } = (req.user as { userId?: string } | undefined) ?? {};
        if (!userId) {
            next(new AppError('Unauthorized', 401));
            return null;
        }
        return userId;
    }

    /**
     * Sets a cookie with the specified name, value, and options.
     */
    protected setCookie(res: Response, name: string, value: string, maxAge: number): void {
        res.cookie(name, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge,
        });
    }

    /**
     * Clears a cookie with the specified name.
     */
    protected clearCookie(res: Response, name: string): void {
        res.clearCookie(name);
    }
}
