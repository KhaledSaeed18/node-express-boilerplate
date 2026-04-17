/*
 * src/middleware/error.middleware.ts
 * Middleware for handling errors in the Express application.
 * This middleware captures errors thrown in the application and formats them into a consistent response structure.
 */

import type { Request, Response, NextFunction } from 'express';
import { isHttpError } from 'http-errors';
import { ZodError } from 'zod';
import { config } from '../config/env';
import { AppError, ValidationError } from '../errors';

interface ValidationErrorDetail {
    field: string;
    message: string;
    value?: unknown;
}

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
    } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (isHttpError(err)) {
        statusCode = err.status;
        message = err.expose ? err.message : 'An error occurred';
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (err.name === 'MongoError' || err.name === 'PrismaClientKnownRequestError') {
        statusCode = 400;
        message = 'Database operation failed';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // req.log is a pino-http child logger pre-bound with the request's correlationId.
    // 5xx errors are genuine server faults; 4xx are operational/expected and logged
    // at warn level to avoid alert fatigue.
    if (statusCode >= 500) {
        req.log.error({ err, statusCode }, message);
    } else if (config.NODE_ENV !== 'production') {
        req.log.warn({ err: { name: err.name, message: err.message }, statusCode }, message);
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
