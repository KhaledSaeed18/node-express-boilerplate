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
import { authRoutes, noteRoutes } from './routes';
import docsRouter from './docs/setup';

const app = express();

const corsOptions = {
    origin: [config.CLIENT_URL],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
};

// Middleware setup - including security, parsing and logging
app.use(correlationMiddleware);
app.use(httpLogger);

// Helmet with relaxed CSP for the API docs UI (inline scripts/styles required
// by swagger-ui-express); all other routes keep the strict default policy.
app.use((req, res, next) => {
    if (req.path.startsWith('/api-docs')) {
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:'],
                },
            },
        })(req, res, next);
    } else {
        helmet()(req, res, next);
    }
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser(config.COOKIE_SECRET));

// API docs — mounted before CSRF so UI GET requests are not challenged.
// The UI itself does not mutate state; only "Try it out" calls reach the API and must still supply a valid x-csrf-token header.
app.use('/api-docs', docsRouter);

app.use(doubleCsrfProtection);

const baseUrl = `${config.BASE_URL}/${config.API_VERSION}`;

// Define routes
app.use(`${baseUrl}/auth`, authRoutes);
app.use(`${baseUrl}/note`, noteRoutes);

// Wildcard route for handling 404 errors
app.all(/.*/, (req, res) => {
    res.status(404).json({
        statusCode: 404,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});

// Error handling middleware
app.use(errorMiddleware);

export default app;
