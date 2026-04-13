/*
 * src/middleware/auth.middleware.ts
 * Middleware for protecting routes by verifying JWT tokens.
 * This middleware checks for a valid JWT token in the request headers or cookies.
 */

import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { config } from '../config/env';
import { createError } from '../utils';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// Middleware to protect routes
// Checks for a JWT token in the request cookies or Authorization header
// If the token is valid, it decodes the user information and attaches it to the request object
// If the token is missing or invalid, it returns an error response
export const protect = (req: Request, _res: Response, next: NextFunction): void => {
    const cookieToken = req.cookies.accessToken as string | undefined;
    const authHeader = req.headers.authorization;

    let token: string | undefined;
    if (cookieToken) {
        token = cookieToken;
    } else if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
    }

    if (!token) {
        next(createError(403, 'Access denied: No token provided'));
        return;
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            next(createError(401, 'Unauthorized: Token has expired'));
            return;
        }
        next(createError(401, 'Unauthorized: Invalid token'));
    }
};
