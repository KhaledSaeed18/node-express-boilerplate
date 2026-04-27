/*
 * src/config/logger.ts
 * Application-wide Pino logger instance.
 *
 * Behaviour by environment:
 *   development  — pretty-printed, colourised output via pino-pretty transport;
 *                  level set to 'debug' so query/verbose logs are visible.
 *   production   — structured JSON written to stdout; level set to 'info'.
 *                  The raw JSON stream is intended for ingestion by a log
 *                  aggregator (Datadog, Loki, CloudWatch, etc.).
 *
 * Sensitive fields are redacted at the serialiser layer so they never reach
 * the transport, regardless of log level.
 */

import pino from 'pino';
import { config } from './env';

const isDev = config.NODE_ENV === 'development';

const logger = pino({
    level: isDev ? 'debug' : 'info',

    // Attach a static service label to every log line for log-aggregation filtering.
    base: { service: 'node-express-boilerplate' },

    // ISO-8601 timestamps (more aggregator-friendly than epoch milliseconds).
    timestamp: pino.stdTimeFunctions.isoTime,

    // Redact sensitive fields before they reach any transport.
    // Paths follow the shape of what pino-http serialises for req/res.
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'req.body.password',
            'req.body.token',
            'req.body.refreshToken',
            'req.body.accessToken',
        ],
        censor: '[REDACTED]',
    },

    // In development use pino-pretty for human-readable output.
    // The transport key is intentionally absent in production so that
    // pino-pretty is never loaded — it is a devDependency only.
    ...(isDev && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: false,
                messageFormat: '{msg}',
            },
        },
    }),
});

export default logger;
