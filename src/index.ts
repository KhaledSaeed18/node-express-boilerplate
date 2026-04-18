/*
 * src/index.ts
 * Server entry point — binds the Express app to a port.
 * All app configuration lives in src/app.ts.
 */

import app from './app';
import { config } from './config/env';
import logger from './config/logger';
import { prisma } from './database/prismaClient';

async function start(): Promise<void> {
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(config.PORT, () => {
        const base = `http://localhost:${String(config.PORT)}`;
        logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Server started');
        logger.info(`API:  ${base}${config.BASE_URL}/${config.API_VERSION}`);
        logger.info(`Docs: ${base}/api-docs`);
    });
}

start().catch((err: unknown) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
});
