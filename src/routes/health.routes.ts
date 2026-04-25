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

const DB_HEALTH_TIMEOUT_MS = 1500;

type HealthDbStatus = 'connected' | 'disconnected';

const createTimeoutPromise = (timeoutMs: number): Promise<never> =>
    new Promise((_resolve, reject) => {
        setTimeout(() => {
            reject(new Error('Database health check timed out'));
        }, timeoutMs);
    });

healthRouter.get('/', async (_req, res) => {
    const dbCheckStart = Date.now();
    let dbStatus: HealthDbStatus = 'connected';
    let dbLatencyMs: number | null = null;

    try {
        await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            createTimeoutPromise(DB_HEALTH_TIMEOUT_MS),
        ]);
        dbLatencyMs = Date.now() - dbCheckStart;
    } catch {
        dbStatus = 'disconnected';
        dbLatencyMs = Date.now() - dbCheckStart;
    }

    const isHealthy = dbStatus === 'connected';

    // Prevent caches/CDNs from serving stale health states.
    res.setHeader('Cache-Control', 'no-store');

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'error',
        db: dbStatus,
        checks: {
            database: {
                status: dbStatus,
                latencyMs: dbLatencyMs,
                timeoutMs: DB_HEALTH_TIMEOUT_MS,
            },
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

export { healthRouter };
