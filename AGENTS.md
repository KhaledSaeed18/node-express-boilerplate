# AGENTS.md

This file provides guidance to AI coding agents (OpenAI Codex, ChatGPT, and others) working in this repository.

## Stack

Node.js 22+ · Express 5 · TypeScript 6 (strict) · Prisma 7 + PostgreSQL 16 · Zod v4 · Pino · JWT (HttpOnly cookies) · CSRF (double-submit cookie) · Vitest · pnpm

## Commands

```bash
# Development
pnpm dev                    # Start with hot reload (nodemon)
pnpm build                  # Compile TypeScript to dist/
pnpm start                  # Run compiled output
pnpm full-check             # format:check + lint:check + type-check — run before every commit
pnpm lint                   # ESLint with auto-fix
pnpm format                 # Prettier with auto-fix
pnpm type-check             # tsc --noEmit

# Prisma
pnpm prisma:migrate         # Create and apply a new migration
pnpm prisma:migrate:deploy  # Apply pending migrations (production / CI)
pnpm prisma:generate        # Regenerate Prisma client after schema changes
pnpm prisma:studio          # Open Prisma Studio
pnpm prisma:db:seed         # Seed the database

# Testing
pnpm test                   # Run unit tests
pnpm test:watch             # Run unit tests in watch mode
pnpm test:coverage          # Run unit tests with coverage report
pnpm test:integration       # Run integration tests (requires test DB)
pnpm test:all               # Run all test suites
pnpm db:test:up             # Start ephemeral test database (Docker, port 5434)
pnpm db:test:down           # Stop and remove test database
pnpm db:test:migrate        # Apply migrations to the test database
```

**Package manager:** pnpm only — never generate `package-lock.json` or `yarn.lock`. **Node:** >= 22.0.0.

## Architecture

Strict layered architecture — each layer communicates only with the one directly below it:

```text
Routes → Controllers → Services → Repositories → Prisma (PostgreSQL)
```

All layers are interface-driven. The **DI Container** (`src/container/index.ts`) is the only place where concrete classes are instantiated. Routes retrieve instances via `this.container.get<Name>Controller()`.

**Entry points:**

- `src/index.ts` — binds the port only (import `app` in tests without side effects)
- `src/app.ts` — all middleware registration and route mounting

**Key directories:**

| Path | Purpose |
| ---- | ------- |
| `src/config/` | Typed env config (`env.ts`) and Pino logger (`logger.ts`) |
| `src/errors/` | Custom error classes extending `AppError` |
| `src/lib/` | Shared helpers (`validate.ts`, etc.) |
| `src/middleware/` | Express middlewares (auth, error handler, rate limiter, CSRF, logging) |
| `src/validations/` | Zod v4 schemas per resource |
| `src/repository/` | Repository classes extending `BaseRepository` |
| `src/services/` | Service classes |
| `src/controllers/` | Controller classes extending `BaseController` |
| `src/routes/` | Route classes extending `BaseRoute` |
| `src/container/` | DI Container singleton |
| `src/types/` | Shared TypeScript types and DTOs |
| `src/docs/` | OpenAPI specification |
| `prisma/` | Schema, migrations, seed |
| `tests/unit/` | Vitest unit tests (services, mocked repositories) |
| `tests/integration/` | Vitest integration tests (HTTP routes via supertest) |

## Hard Rules

| Rule | Implementation |
| ---- | -------------- |
| No `process.env` | Use typed config from `src/config/env.ts` |
| No `console.*` | Use Pino logger from `src/config/logger.ts` |
| No direct error responses | Throw from `src/errors/`; global middleware handles it |
| No `any` type | Strict TypeScript throughout |
| Type-only imports | Always `import type` for types |
| Explicit return types | All public methods and class properties |
| No floating promises | Always `await` or handle rejection |
| Prefer `??` over `\|\|` | Use nullish coalescing for nullish checks |
| pnpm only | Never generate npm/yarn lock files |

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
throw new NotFoundError('Item not found');          // 404
throw new ConflictError('Item already exists');     // 409
throw new AuthorizationError('Access denied');      // 403
throw new AuthenticationError('Not logged in');     // 401
throw new ValidationError('Invalid input');         // 400
throw new AppError('Custom message', 422);          // any status
```

**Repository update/delete — always wrap in try/catch:**

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

Create files in this exact order:

1. Add model to `prisma/schema.prisma` → run `pnpm prisma:migrate && pnpm prisma:generate`
2. `src/types/<name>.types.ts` — Create/Update/Response DTOs
3. `src/validations/<name>.validation.ts` — Zod v4 schemas + `validateBody()` middleware exports
4. `src/repository/<name>.repository.ts` — `I<Name>Repository` interface + class extending `BaseRepository`
5. `src/services/<name>.service.ts` — `I<Name>Service` interface + class
6. `src/controllers/<name>.controller.ts` — `I<Name>Controller` interface + class extending `BaseController`
7. `src/routes/<name>.route.ts` — class extending `BaseRoute`, exports router
8. Register repository, service, and controller in `src/container/index.ts`
9. Mount in `src/app.ts` at `${config.BASE_URL}/${config.API_VERSION}/<names>`
10. Export from barrel `index.ts` files in each directory
11. Add OpenAPI paths and schemas to `src/docs/`
12. Run `pnpm full-check` — fix all errors before finishing

## Authentication & Security

- `protect` middleware (`src/middleware/auth.middleware.ts`) — verifies JWT from HttpOnly cookie; attaches user to `req.user`
- `doubleCsrfProtection` — required on all mutating routes (`POST`, `PUT`, `PATCH`, `DELETE`)
- CSRF token obtained via `GET /api/v1/auth/csrf-token`, sent as `x-csrf-token` header
- Rate-limit every route group with a dedicated limiter from `src/middleware/limiter.middleware.ts`
- Passwords hashed with bcrypt — never log or return password fields

## Testing

**Unit tests** (`tests/unit/`) — mock the repository with `vi.fn()`, test the service in isolation.

**Integration tests** (`tests/integration/`) — full HTTP cycle via `supertest` against a real test database.

Always test: valid request (201/200), invalid input (400), unauthenticated (401), missing CSRF (403), not found (404).

Before running integration tests:

```bash
pnpm db:test:up
pnpm db:test:migrate
pnpm test:integration
```

## Prisma

- Schema: `prisma/schema.prisma`; generated client: `src/generated/prisma/`
- Always run `pnpm prisma:generate` after every schema change
- Use `@@map("snake_case_table")` and `@map("snake_case_column")` for DB naming
- All IDs: `@id @default(cuid())`
- Timestamps: `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- Add `@@index` on all foreign key columns and commonly filtered fields
- Use `onDelete: Cascade` on child-side relations

## Environment Variables

Copy `.env.example` to `.env`. Secrets must meet minimum lengths:

| Variable | Constraint |
| -------- | ---------- |
| `JWT_SECRET` | min 32 characters |
| `JWT_REFRESH_SECRET` | min 32 characters, different from `JWT_SECRET` |
| `COOKIE_SECRET` | min 32 characters, different from both JWT secrets |
| `DATABASE_URL` | valid PostgreSQL connection string |
| `CLIENT_URL` | valid URL (CORS allowed origin) |
