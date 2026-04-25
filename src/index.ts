/*
 * src/index.ts
 * Server entry point — binds the Express app to a port.
 * All app configuration lives in src/app.ts.
 */

import type { Server } from 'http';
import app from './app';
import { config } from './config/env';
import logger from './config/logger';
import { prisma } from './database/prismaClient';

const shutdown = async (server: Server): Promise<void> => {
    logger.info('Shutting down server...');
    server.close(() => {
        logger.info('HTTP server closed');
    });
    await prisma.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
};

async function start(): Promise<void> {
    await prisma.$connect();
    logger.info('Database connected');

    const server = app.listen(config.PORT, () => {
        const base = `http://localhost:${String(config.PORT)}`;
        logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Server started');
        logger.info(`API:  ${base}${config.BASE_URL}/${config.API_VERSION}`);
        logger.info(`Docs: ${base}/api-docs`);
    });

    process.on('SIGTERM', () => void shutdown(server));
    process.on('SIGINT', () => void shutdown(server));
    process.on('unhandledRejection', (reason) => {
        logger.error({ reason }, 'Unhandled promise rejection');
        void shutdown(server);
    });
}

start().catch((err: unknown) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
});
