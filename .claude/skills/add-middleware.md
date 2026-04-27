---
name: add-middleware
description: Add a new Express middleware to this project and wire it up correctly. Use when the user asks to add middleware — rate limiting, request guards, validation, logging enrichment, custom auth checks, etc.
---

When the user asks to add middleware, follow these steps.

## Step 1 — Create the file (`src/middleware/<name>.middleware.ts`)

Rules:
- Export named functions, not default exports — consistent with the barrel pattern.
- Type `req`, `res`, `next` as `Request`, `Response`, `NextFunction` from `express`. No `any`.
- Use the Pino logger from `src/config/logger.ts` if logging is needed — never `console.*`.
- Use config values from `src/config/env.ts` — never `process.env` directly.
- Throw from `src/errors/` for error conditions and call `next(error)` — never `res.status().json()` directly.
- No floating promises — always `await` or `.catch()`.

**Auth guard pattern:**
```ts
import type { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../errors';

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'admin') {
        return next(new AuthenticationError('Admin access required'));
    }
    next();
};
```

**Async middleware pattern:**
```ts
import type { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors';
import logger from '../config/logger';

export const someAsyncGuard = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
        // async work
        next();
    } catch (error) {
        logger.error(error, 'someAsyncGuard failed');
        next(error);
    }
};
```

**Rate limiter pattern** (if adding a new limiter):
```ts
import rateLimit from 'express-rate-limit';

export const myLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests' },
});
```

---

## Step 2 — Export from the barrel (`src/middleware/index.ts`)

```ts
export { myMiddleware } from './<name>.middleware';
```

---

## Step 3 — Apply it

**App-wide** (applies to every request) — add to `src/app.ts` in the correct position in the middleware chain. Order matters:

```
correlation → httpLogger → helmet → cors → json → cookie-parser → CSRF → [your middleware] → routes
```

**Route-group-wide** — add to the route constructor in `src/routes/<name>.route.ts`:

```ts
protected initializeRoutes(): void {
    this.router.use(myMiddleware);
    // then individual route definitions
}
```

**Per-endpoint** — add inline in the route definition:

```ts
this.router.post('/', limiter, protect, myMiddleware, createValidation, this.controller.createItem);
```

---

## Step 4 — Verify

```bash
pnpm full-check
```

Fix every TypeScript and lint error before reporting done.
