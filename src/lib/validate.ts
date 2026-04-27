/*
 * src/lib/validate.ts
 * Generic Zod validation middleware factories.
 * Each factory parses the specified part of the request against the provided schema.
 * On success, the parsed (and transformed) value replaces the original.
 * On failure, a ValidationError with per-field messages is forwarded to the error middleware.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { z } from 'zod';
import { ValidationError } from '../errors';

const buildValidationError = (error: z.ZodError): ValidationError => {
    const errorMessages = error.issues.map((issue) => ({
        field: issue.path.join('.') || 'unknown',
        message: issue.message,
    }));
    const formattedMessage = errorMessages.map((e) => `${e.field}: ${e.message}`).join(', ');
    return new ValidationError(formattedMessage, errorMessages);
};

export const validateBody = (schema: z.ZodType): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            next(buildValidationError(result.error));
            return;
        }
        req.body = result.data as Record<string, unknown>;
        next();
    };
};

export const validateQuery = (schema: z.ZodType): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            next(buildValidationError(result.error));
            return;
        }
        // req.query is a getter-only property in Express 5 / router@2 — must use defineProperty
        Object.defineProperty(req, 'query', {
            value: result.data,
            writable: true,
            configurable: true,
            enumerable: true,
        });
        next();
    };
};

export const validateParams = (schema: z.ZodType): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            next(buildValidationError(result.error));
            return;
        }
        req.params = result.data as Record<string, string>;
        next();
    };
};
