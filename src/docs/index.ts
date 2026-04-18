/*
 * src/docs/index.ts
 * Assembles the full OpenAPI 3.1.0 specification from individual schema and
 * path modules.  The spec is built at import time so it can be served as JSON
 * and consumed by swagger-ui-express without any additional build step.
 */

import { config } from '../config/env';
import { schemas } from './schemas';
import { authPaths } from './paths/auth.paths';
import { notePaths } from './paths/note.paths';

const baseUrl = `${config.BASE_URL}/${config.API_VERSION}`;

export const openApiSpec = {
    openapi: '3.1.0',

    info: {
        title: 'Node Express Boilerplate API Documentation',
        version: config.API_VERSION,
        description: `
## Overview

A secure, production-ready REST API for managing personal notes.
Built with **Express 5**, **TypeScript**, **Prisma ORM** (PostgreSQL), and layered clean architecture.

## Authentication

This API uses **JWT tokens** delivered as signed **HttpOnly cookies**.

### Flow
1. \`GET  ${baseUrl}/auth/csrf-token\` — obtain a CSRF token (store it client-side)

2. \`POST ${baseUrl}/auth/signup\`     — create an account

3. \`POST ${baseUrl}/auth/signin\`     — receive \`accessToken\` + \`refreshToken\` cookies

4. Call protected endpoints — browser sends cookies automatically; or pass \`Authorization: Bearer <token>\`

5. \`POST ${baseUrl}/auth/refresh-token\` — renew an expired access token

6. \`POST ${baseUrl}/auth/logout\`    — clear session cookies

### CSRF Protection

All mutating requests (POST, PUT, DELETE) require an **\`x-csrf-token\` header** containing
the token obtained from step 1. This implements the **double-submit cookie** pattern.

## Rate Limiting

| Endpoint group | Limit        |
|----------------|--------------|
| Auth routes    | 5 / 15 min   |
| Note routes    | 30 / 15 min  |

Rate-limit status is communicated via \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`,
and \`X-RateLimit-Reset\` response headers.

## Error Responses

All errors follow a consistent envelope:

\`\`\`json
{
  "statusCode": 400,
  "message": "Human-readable description",
  "errors": [          // present only for validation errors (400)
    { "field": "email", "message": "Invalid email format", "value": "bad-input" }
  ]
}
\`\`\`
        `.trim(),
        contact: {
            name: 'API Support',
            url: 'https://github.com/KhaledSaeed18/node-express-boilerplate',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },

    servers: [
        {
            url: `http://localhost:${String(config.PORT)}${baseUrl}`,
            description: 'Local development server',
        },
        {
            url: `https://api.example.com${baseUrl}`,
            description: 'Production server (replace with actual URL)',
        },
    ],

    tags: [
        {
            name: 'Authentication',
            description:
                'User registration, login, token refresh, logout, and CSRF token issuance. ' +
                'Rate-limited to **5 requests / 15 minutes** per IP address.',
        },
        {
            name: 'Notes',
            description:
                'Create, read, update, delete, and search notes. ' +
                'All endpoints require a valid access token. ' +
                'Rate-limited to **30 requests / 15 minutes** per IP address.',
        },
    ],

    components: {
        schemas,

        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description:
                    'Access token obtained from `POST /auth/signin`. \n' +
                    ' \n ' +
                    'Pass as `Authorization: Bearer <token>` for non-browser clients. \n' +
                    ' \n ' +
                    'Expires after `JWT_EXPIRE_TIME` (default 15 min).',
            },
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'accessToken',
                description:
                    'Signed HttpOnly `accessToken` cookie set automatically by `POST /auth/signin`. \n' +
                    ' \n ' +
                    'Used by browser clients — no manual header required.',
            },
        },

        parameters: {
            PageParam: {
                in: 'query',
                name: 'page',
                schema: { type: 'integer', minimum: 1, default: 1 },
                description: 'Page number (1-based)',
            },
            LimitParam: {
                in: 'query',
                name: 'limit',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                description: 'Items per page',
            },
        },

        responses: {
            UnauthorizedError: {
                description: 'Missing or invalid access token',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: { statusCode: 401, message: 'Authentication failed' },
                    },
                },
            },
            ForbiddenError: {
                description: 'Access denied — token valid but insufficient permissions',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: { statusCode: 403, message: 'Access denied' },
                    },
                },
            },
            NotFoundError: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: { statusCode: 404, message: 'Resource not found' },
                    },
                },
            },
            RateLimitError: {
                description: 'Rate limit exceeded',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: {
                            statusCode: 429,
                            message: 'Too many requests, please try again later',
                        },
                    },
                },
            },
            InternalServerError: {
                description: 'Unexpected server error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: { statusCode: 500, message: 'Internal server error' },
                    },
                },
            },
        },
    },

    paths: {
        ...authPaths,
        ...notePaths,
    },
};
