/*
 * src/app.ts
 * Express application setup — middleware, routes, and error handling.
 * Exported without starting the server so it can be imported by integration
 * tests (supertest) without binding to a port.
 */

import { config } from './config/env';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {
    errorMiddleware,
    correlationMiddleware,
    httpLogger,
    doubleCsrfProtection,
} from './middleware';
import { authRoutes, noteRoutes, healthRouter } from './routes';
import docsRouter from './docs/setup';
import { NotFoundError } from './errors';

const app = express();

// Trust the first proxy hop so req.ip reflects the real client IP behind
// Nginx, ELB, Cloudflare, etc. Required for correct rate-limit key generation and CSRF session binding.
app.set('trust proxy', 1);

const corsOptions = {
    origin: [config.CLIENT_URL],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
};

// Two module-level helmet instances avoid creating a new instance on every request.
// The docs variant relaxes CSP so swagger-ui-express inline scripts/styles work.
const helmetDefault = helmet();
const helmetDocs = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
        },
    },
});

// Middleware setup — security, parsing, logging
app.use(correlationMiddleware);
app.use(httpLogger);
app.use((req, res, next) => {
    if (req.path.startsWith('/api-docs')) {
        helmetDocs(req, res, next);
    } else {
        helmetDefault(req, res, next);
    }
});
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser(config.COOKIE_SECRET));

// API docs — mounted before CSRF so UI GET requests are not challenged.
app.use('/api-docs', docsRouter);

app.use(doubleCsrfProtection);

const baseUrl = `${config.BASE_URL}/${config.API_VERSION}`;

// Define routes
app.use(`${baseUrl}/auth`, authRoutes);
app.use(`${baseUrl}/note`, noteRoutes);
app.use(`${baseUrl}/health`, healthRouter);

// Catch-all for unmatched routes
app.all(/.*/, (req, _res, next) => {
    next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
