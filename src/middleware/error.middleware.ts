/*
 * src/middleware/error.middleware.ts
 * Middleware for handling errors in the Express application.
 * This middleware captures errors thrown in the application and formats them into a consistent response structure.
 */

import type { Request, Response, NextFunction } from 'express';
import { isHttpError } from 'http-errors';
import { ZodError } from 'zod';
import { config } from '../config/env';
import { AppError, ValidationError, ConflictError, NotFoundError } from '../errors';

interface ValidationErrorDetail {
    field: string;
    message: string;
    value?: unknown;
}

// Type guard for Prisma known request errors — avoids importing from internal paths
// that may break on version bumps.
const isPrismaKnownRequestError = (err: Error): err is Error & { code: string } =>
    err.name === 'PrismaClientKnownRequestError' && 'code' in err;

const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors: ValidationErrorDetail[] | undefined = undefined;

    if (err instanceof ValidationError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    } else if (err instanceof ZodError) {
        // Belt-and-suspenders: catch any ZodError that bypasses validateBody middleware
        statusCode = 400;
        message = 'Validation failed';
        errors = err.issues.map((issue) => ({
            field: issue.path.join('.') || 'unknown',
            message: issue.message,
        }));
    } else if (isPrismaKnownRequestError(err)) {
        switch (err.code) {
            case 'P2002':
                statusCode = new ConflictError('A record with this value already exists')
                    .statusCode;
                message = 'A record with this value already exists';
                break;
            case 'P2025':
                statusCode = new NotFoundError('Record not found').statusCode;
                message = 'Record not found';
                break;
            case 'P2003':
                statusCode = new ConflictError('Operation violates a foreign key constraint')
                    .statusCode;
                message = 'Operation violates a foreign key constraint';
                break;
            default:
                statusCode = 400;
                message = 'Database operation failed';
        }
    } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (isHttpError(err)) {
        statusCode = err.status;
        message = err.expose ? err.message : 'An error occurred';
    }

    // pino-http types req.log as always-defined, but it is absent when an error
    // is thrown before pino-http processes the request (e.g. the docs route).
    const log = req.log as typeof req.log | undefined;
    if (statusCode >= 500) {
        log?.error({ err, statusCode }, message);
    } else if (config.NODE_ENV !== 'production') {
        log?.warn({ err: { name: err.name, message: err.message }, statusCode }, message);
    }

    // Construct the response object
    // Include stack trace in non-production environments for debugging
    const response: Record<string, unknown> = {
        statusCode,
        message,
        ...(errors && { errors }),
        ...(config.NODE_ENV !== 'production' && { stack: err.stack }),
    };

    res.status(statusCode).json(response);
};

export default errorMiddleware;
