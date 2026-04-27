/*
 * src/docs/paths/health.paths.ts
 * OpenAPI path definition for the infrastructure health endpoint.
 */

export const healthPaths = {
    '/health': {
        get: {
            tags: ['Health'],
            summary: 'Liveness and readiness probe',
            description:
                'Reports application runtime status and database connectivity. ' +
                'Returns `200` when the service is healthy and database checks pass, otherwise `503`.',
            operationId: 'getHealth',
            responses: {
                200: {
                    description: 'Application is healthy and database is reachable',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/HealthResponse' },
                            example: {
                                status: 'ok',
                                db: 'connected',
                                checks: {
                                    database: {
                                        status: 'connected',
                                        latencyMs: 7,
                                        timeoutMs: 1500,
                                    },
                                },
                                uptime: 1234.56,
                                timestamp: '2026-04-25T20:10:34.120Z',
                            },
                        },
                    },
                },
                503: {
                    description: 'Application is running but database is unavailable',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/HealthResponse' },
                            example: {
                                status: 'error',
                                db: 'disconnected',
                                checks: {
                                    database: {
                                        status: 'disconnected',
                                        latencyMs: 1501,
                                        timeoutMs: 1500,
                                    },
                                },
                                uptime: 1234.56,
                                timestamp: '2026-04-25T20:11:10.450Z',
                            },
                        },
                    },
                },
            },
        },
    },
} as const;
