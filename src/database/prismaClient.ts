import { PrismaPg } from '@prisma/adapter-pg';
import { type Prisma, PrismaClient } from '../generated/prisma/client';
import { config } from '../config/env';
import logger from '../config/logger';

const adapter = new PrismaPg({ connectionString: config.DATABASE_URL });

const prisma = new PrismaClient({
    adapter: adapter,
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
    ],
});

type QueryEvent = Prisma.QueryEvent;
type LogEvent = Prisma.LogEvent;

if (config.NODE_ENV === 'development') {
    prisma.$on('query', (event: QueryEvent) => {
        logger.debug(
            { duration: event.duration, params: event.params, timestamp: event.timestamp },
            event.query,
        );
    });
}

prisma.$on('error', (event: LogEvent) => {
    logger.error({ timestamp: event.timestamp }, event.message);
});

prisma.$on('warn', (event: LogEvent) => {
    logger.warn({ timestamp: event.timestamp }, event.message);
});

export { prisma };
