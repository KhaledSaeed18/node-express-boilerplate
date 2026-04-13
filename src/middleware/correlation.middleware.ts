/*
 * src/middleware/correlation.middleware.ts
 * Injects a correlation ID into every inbound request.
 *
 * - Reads the incoming `X-Correlation-ID` header when provided by an upstream
 *   gateway or client (useful for distributed tracing across services).
 * - Falls back to a new crypto.randomUUID() when the header is absent.
 * - Attaches the ID to `req.correlationId` so it is available to all
 *   downstream middleware and route handlers.
 * - Echoes the ID back on the response via `X-Correlation-ID` so callers
 *   can correlate their client-side logs with server logs.
 */

import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Augment Node's IncomingMessage (the base of Express Request) so TypeScript
// knows about correlationId in both Express middleware and pino-http callbacks,
// which receive raw IncomingMessage rather than the Express Request subtype.
declare module 'http' {
    interface IncomingMessage {
        correlationId: string;
    }
}

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.headers['x-correlation-id'];
    const correlationId =
        typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();

    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    next();
};
