---
name: add-middleware
description: Add a new Express middleware to this project. Use when the user asks to add middleware (rate limiting, validation, guards, logging enrichment, etc.).
---

When the user asks to add middleware, follow these steps.

## Step 1 — Create the file

Create `src/middleware/<name>.middleware.ts`.

Rules:
- Export named functions (not default exports), consistent with the existing middleware barrel.
- Use the Pino logger from `src/config/logger.ts` if logging is needed — never `console.*`.
- Use config values from `src/config/env.ts` — never `process.env` directly.
- Throw `AppError` subclasses from `src/errors/` for error conditions; call `next(error)`.
- No `any` — type `req`, `res`, `next` as `Request`, `Response`, `NextFunction` from `express`.

## Step 2 — Export from the barrel

Add the export to `src/middleware/index.ts`:
```ts
export { myMiddleware } from './<name>.middleware';
```

## Step 3 — Apply it

- **App-wide middleware**: add to the middleware chain in `src/app.ts` in the correct position (before routes).
- **Route-specific middleware**: import from `'../middleware'` in the relevant route file and add to the handler chain.

## Step 4 — Verify

Run `pnpm full-check` and fix any errors.
