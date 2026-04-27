# GEMINI.md

This file provides guidance to Google Gemini CLI when working in this repository.

## Stack

Node.js 22+ · Express 5 · TypeScript 6 (strict) · Prisma 7 + PostgreSQL 16 · Zod v4 · Pino · JWT (HttpOnly cookies) · CSRF (double-submit cookie) · pnpm

## Commands

```bash
pnpm dev                    # Start with hot reload (nodemon)
pnpm build                  # Compile TypeScript to dist/
pnpm start                  # Run compiled output
pnpm full-check             # format:check + lint:check + type-check — run before every commit
pnpm lint                   # ESLint with auto-fix
pnpm format                 # Prettier with auto-fix
pnpm type-check             # tsc --noEmit

pnpm prisma:migrate         # Create and apply a new migration
pnpm prisma:migrate:deploy  # Apply pending migrations (production / CI)
pnpm prisma:generate        # Regenerate Prisma client after schema changes
pnpm prisma:studio          # Open Prisma Studio
pnpm prisma:db:seed         # Seed the database

pnpm test                   # Run unit tests
pnpm test:integration       # Run integration tests (requires db:test:up)
pnpm test:all               # Run all tests
pnpm db:test:up             # Start ephemeral test database (Docker)
pnpm db:test:down           # Stop and remove test database
```

**Package manager:** pnpm only — never generate `package-lock.json` or `yarn.lock`. **Node:** >= 22.0.0.

## Architecture

Strict layered architecture — each layer communicates only with the one directly below it:

```
Routes → Controllers → Services → Repositories → Prisma (PostgreSQL)
```

All layers are interface-driven. The **DI Container** (`src/container/index.ts`) is the only place where concrete classes are instantiated. Routes retrieve instances via `this.container.get<Name>Controller()`.

**Entry points:**
- `src/index.ts` — binds the port only (import `app` in tests without side effects)
- `src/app.ts` — all middleware registration and route mounting

**Key directories:**

| Path | Purpose |
|------|---------|
| `src/config/` | Typed env config (`env.ts`) and Pino logger (`logger.ts`) |
| `src/errors/` | Custom error classes extending `AppError` |
| `src/lib/` | Shared helpers (e.g. `validate.ts`) |
| `src/middleware/` | Express middlewares (auth, error handler, rate limiter, CSRF, etc.) |
| `src/validations/` | Zod v4 schemas per resource |
| `src/repository/` | Repository classes extending `BaseRepository` |
| `src/services/` | Service classes |
| `src/controllers/` | Controller classes extending `BaseController` |
| `src/routes/` | Route classes extending `BaseRoute` |
| `src/container/` | DI Container singleton |
| `src/types/` | Shared TypeScript types and DTOs |
| `prisma/` | Schema, migrations, seed |
| `tests/unit/` | Vitest unit tests (services) |
| `tests/integration/` | Vitest integration tests (routes via supertest) |

## Hard Rules

| Rule | Implementation |
|------|---------------|
| No `process.env` | Use typed config from `src/config/env.ts` |
| No `console.*` | Use Pino logger from `src/config/logger.ts` |
| No direct error responses | Throw from `src/errors/`; global middleware handles it |
| No `any` type | Strict TypeScript throughout |
| Type-only imports | Always `import type` for types |
| Explicit return types | All public methods and class properties |
| No floating promises | Always `await` or handle rejection |
| Prefer nullish coalescing | Use `??` instead of `\|\|` for nullish checks |
| pnpm only | Never generate npm/yarn lockfiles |

## Key Patterns

**Controller methods** — arrow function properties (ensures correct `this` binding when passed as route handlers):

```ts
public createItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await this.itemService.create(req.body);
        this.sendResponse(res, 201, 'Item created', result);
    } catch (error) {
        this.handleError(error, next);
    }
};
```

**Zod v4 validation:**

```ts
import { z } from 'zod';
import { validateBody } from '../lib/validate';
import type { RequestHandler } from 'express';

export const createItemSchema = z.object({
    name: z.string().trim().min(1).max(255),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;
export const createItemValidation: RequestHandler = validateBody(createItemSchema);
```

**Throwing errors:**

```ts
throw new NotFoundError('Item not found');       // 404
throw new ConflictError('Item already exists');  // 409
throw new AuthorizationError('Access denied');   // 403
throw new AuthenticationError('Not logged in');  // 401
throw new ValidationError('Invalid input');      // 400
throw new AppError('Custom message', 422);       // custom status
```

**Repository update/delete:**

```ts
async update(id: string, data: UpdateItemDTO): Promise<Item> {
    try {
        return await this.prisma.item.update({ where: { id }, data });
    } catch (error) {
        this.handlePrismaError(error); // converts P2025 → NotFoundError, etc.
        throw error;
    }
}
```

## Adding a New Resource

Create these files in order, then wire them up:

1. `src/validations/<name>.validation.ts`
2. `src/repository/<name>.repository.ts`
3. `src/services/<name>.service.ts`
4. `src/controllers/<name>.controller.ts`
5. `src/routes/<name>.route.ts`
6. Register in `src/container/index.ts`
7. Mount in `src/app.ts` at `${config.BASE_URL}/<names>`
8. Export from barrel index files in each directory
9. Add model to `prisma/schema.prisma`, run `pnpm prisma:migrate && pnpm prisma:generate`
10. Run `pnpm full-check` — fix all errors before finishing

## Authentication & Security

- `protect` middleware (`src/middleware/auth.middleware.ts`) — verifies JWT from HttpOnly cookie; attaches user to `req.user`
- All mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require a valid CSRF token
- CSRF token obtained via `GET /api/v1/auth/csrf-token` — include it as `x-csrf-token` header
- Rate limit every route group with its own limiter from `src/middleware/limiter.middleware.ts`
- Passwords hashed with bcrypt — never log or return password fields

## Environment Variables

Copy `.env.example` to `.env`. Secrets must meet minimum lengths:

| Variable | Constraint |
|----------|-----------|
| `JWT_SECRET` | min 32 characters |
| `JWT_REFRESH_SECRET` | min 32 characters, different from `JWT_SECRET` |
| `COOKIE_SECRET` | min 32 characters, different from both JWT secrets |
| `DATABASE_URL` | valid PostgreSQL connection string |
| `CLIENT_URL` | valid URL (CORS allowed origin) |

## Prisma

- Schema: `prisma/schema.prisma`; generated client: `src/generated/prisma/`
- Always run `pnpm prisma:generate` after schema changes
- Use `@@map("snake_case_table")` and `@map("snake_case_column")` for DB naming
- All IDs: `@id @default(cuid())`
- Timestamps: `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- Add `@@index` on all foreign key columns and commonly filtered fields
- Use `onDelete: Cascade` on child-side relations
