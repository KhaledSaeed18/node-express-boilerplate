/*
 * src/lib/validate.ts
 * Generic Zod body-validation middleware factory.
 * Parses req.body against the provided schema. On success, req.body is
 * replaced with the fully parsed and transformed output (trimmed strings,
 * coerced types, etc.) and next() is called. On failure, a ValidationError
 * with per-field messages is forwarded to the error middleware.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { z } from 'zod';
import { ValidationError } from '../errors';

export const validateBody = (schema: z.ZodType): RequestHandler => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errorMessages = result.error.issues.map((issue) => ({
                field: issue.path.join('.') || 'unknown',
                message: issue.message,
            }));

            const formattedMessage = errorMessages
                .map((err) => `${err.field}: ${err.message}`)
                .join(', ');

            next(new ValidationError(formattedMessage, errorMessages));
            return;
        }

        // Replace req.body with the schema-parsed output so downstream
        // handlers receive trimmed, coerced, and fully typed data.
        req.body = result.data as Record<string, unknown>;
        next();
    };
};
