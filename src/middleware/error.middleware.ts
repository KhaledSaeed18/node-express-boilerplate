/*
 * src/middleware/error.middleware.ts
 * Middleware for handling errors in the Express application.
 * This middleware captures errors thrown in the application and formats them into a consistent response structure.
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors';

interface ValidationErrorDetail {
    field: string;
    message: string;
    value?: unknown;
}

const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors: ValidationErrorDetail[] | undefined = undefined;

    if (err instanceof ValidationError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
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

    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Error:', err);
    }

    // Construct the response object
    // Include stack trace in non-production environments for debugging
    const response: Record<string, unknown> = {
        statusCode,
        message,
        ...(errors && { errors }),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    };

    res.status(statusCode).json(response);
};

export default errorMiddleware;
