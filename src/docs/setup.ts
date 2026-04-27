/*
 * src/docs/setup.ts
 * Express router that serves the Swagger UI and the raw OpenAPI JSON spec.
 * Mounted at /api-docs in src/app.ts (before the CSRF middleware so that
 * the UI's GET requests are not blocked by the CSRF protection).
 *
 * Routes:
 *   GET /api-docs       — interactive Swagger UI
 *   GET /api-docs/spec  — raw OpenAPI 3.1.0 JSON spec
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './index';

const docsRouter = Router();

const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    customSiteTitle: 'Node Express Boilerplate — Notes API — Docs',
    customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { font-size: 2rem; }
    `,
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        filter: true,
        deepLinking: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        syntaxHighlight: { activate: true, theme: 'monokai' },
    },
};

docsRouter.get('/spec', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
});

docsRouter.use('/', swaggerUi.serve);
docsRouter.get('/', swaggerUi.setup(openApiSpec, swaggerUiOptions));

export default docsRouter;
