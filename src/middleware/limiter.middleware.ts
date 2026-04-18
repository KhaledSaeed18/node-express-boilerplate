/*
 * src/middleware/limiter.middleware.ts
 * Middleware for rate limiting API requests.
 * This middleware limits the number of requests to specific routes to prevent abuse.
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, RequestHandler } from 'express';

// Function to create a rate limiter
// Accepts parameters for the time window, maximum requests, and error message
// Returns a configured rate limiter middleware
export const createRateLimiter = (
    windowMs: number,
    limit: number,
    message: string,
): RequestHandler => {
    return rateLimit({
        windowMs,
        limit,
        message: {
            statusCode: 429,
            error: 'Too Many Requests',
            message,
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: Request) =>
            ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown'),
    }) as unknown as RequestHandler;
};

// Rate limiters for specific routes
// These limiters can be applied to authentication and note operations
// They define the time window and maximum number of requests allowed
export const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5,
    'Too many authentication attempts, please try again later.',
);

export const noteLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    30,
    'Too many note operations, please try again later.',
);
