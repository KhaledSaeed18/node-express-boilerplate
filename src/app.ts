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

const app = express();

const corsOptions = {
    origin: [config.CLIENT_URL],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
};

// Middleware setup - including security, parsing and logging
app.use(correlationMiddleware);
app.use(httpLogger);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser(config.COOKIE_SECRET));
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
