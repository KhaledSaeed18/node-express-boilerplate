/*
 * src/middleware/httpLogger.middleware.ts
 * HTTP request/response logger built on pino-http.
 * Replaces morgan; produces structured JSON in production and pretty-printed
 * lines in development (inheriting the transport from the base logger).
 *
 * pino-http attaches `req.log` — a child logger pre-bound with the request's
 * correlationId — so downstream middleware and controllers can call
 * `req.log.info(...)` and automatically get request context in every line.
 */

import pinoHttp from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'http';
import logger from '../config/logger';

export const httpLogger = pinoHttp({
    // Re-use the application logger so transport and redact config are shared.
    logger,

    // Use the correlation ID (set by correlationMiddleware) as the pino-http
    // request ID so it appears on every log line for this request.
    genReqId: (req) => req.correlationId,

    // Propagate correlationId as a top-level field on every log line.
    customProps: (req) => ({
        correlationId: req.correlationId,
    }),

    // Map HTTP status codes to appropriate log levels.
    customLogLevel: (_req, res, err) => {
        if (err ?? res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },

    // Human-readable success / error messages (used by pino-pretty in dev).
    customSuccessMessage: (req, res) =>
        `${req.method ?? 'UNKNOWN'} ${req.url ?? '/'} → ${String(res.statusCode)}`,
    customErrorMessage: (req, _res, err) =>
        `${req.method ?? 'UNKNOWN'} ${req.url ?? '/'} failed — ${err.message}`,

    // Minimal request serialisers — avoid logging request bodies which may
    // contain PII; sensitive headers are already covered by the base redact config.
    // pino's SerializerFn is typed as (value: any) => any; we cast to the correct
    // HTTP types so member accesses are checked by the compiler.
    serializers: {
        req: (rawReq: IncomingMessage) => ({
            id: rawReq.id,
            method: rawReq.method,
            url: rawReq.url,
            userAgent: rawReq.headers['user-agent'],
            remoteAddress: rawReq.socket.remoteAddress,
        }),
        res: (rawRes: ServerResponse) => ({
            statusCode: rawRes.statusCode,
        }),
    },
});
