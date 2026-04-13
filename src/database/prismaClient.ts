import { PrismaPg } from '@prisma/adapter-pg';
import { type Prisma, PrismaClient } from '../generated/prisma/client';
import { config } from '../config/env';

const adapter = new PrismaPg({ connectionString: config.DATABASE_URL });

const logger = console;

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
            `[Prisma Query] [${event.timestamp.toISOString()}] ${event.duration.toString()}ms ${event.query}`,
        );
        logger.debug(`[Prisma Query Params] ${event.params}`);
    });
}

prisma.$on('error', (event: LogEvent) => {
    logger.error(`[Prisma Error] [${event.timestamp.toISOString()}] ${event.message}`);
});

prisma.$on('warn', (event: LogEvent) => {
    logger.warn(`[Prisma Warning] [${event.timestamp.toISOString()}] ${event.message}`);
});

export { prisma };
