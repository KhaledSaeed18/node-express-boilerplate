/*
 * src/routes/health.routes.ts
 * Health check endpoint for liveness/readiness probes.
 * No authentication, CSRF, or rate limiting — intended for infrastructure use.
 *
 * GET /api/v1/health
 *   200 — application is running and database is reachable
 *   503 — application is running but database is unreachable
 */

import { Router } from 'express';
import { prisma } from '../database/prismaClient';

const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
    let dbStatus: 'connected' | 'disconnected' = 'connected';

    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch {
        dbStatus = 'disconnected';
    }

    const isHealthy = dbStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'error',
        db: dbStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

export { healthRouter };
