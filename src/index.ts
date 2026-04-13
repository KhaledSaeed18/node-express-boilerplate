/*
 * src/index.ts
 * Main entry point for the Express App server.
 * This file sets up the Express application, middleware, routes, and error handling.
 */

import { config } from './config/env';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middleware';
import { authRoutes, noteRoutes } from './routes';

const app = express();

const corsOptions = {
    origin: [config.CLIENT_URL],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
};

// Middleware setup - including security, parsing and logging
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Start the server
app.listen(config.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on port ${String(config.PORT)}`);
});

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
