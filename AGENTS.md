# AGENTS.md

This file provides guidance to AI coding agents (OpenAI Codex, ChatGPT, and others) working in this repository.

## Commands

```bash
pnpm dev                    # Start with hot reload
pnpm build                  # Compile TypeScript to dist/
pnpm full-check             # format:check + lint:check + type-check (run before committing)
pnpm lint                   # ESLint with auto-fix
pnpm format                 # Prettier with auto-fix
pnpm prisma:migrate         # Create and apply a migration
pnpm prisma:generate        # Regenerate Prisma client after schema changes
```

**Package manager:** pnpm only — never generate `package-lock.json` or `yarn.lock`. **Node:** >= 22.0.0.

## Architecture

Strict layered architecture — each layer communicates only with the one directly below it:

```
Routes → Controllers → Services → Repositories → Prisma (PostgreSQL)
```

All layers are interface-driven. The **DI Container** (`src/container/index.ts`) is the only place where concrete classes are instantiated. Routes retrieve instances via `this.container.get<Name>Controller()`.

**Entry points:**
- `src/index.ts` — binds the port only (import `app` in tests without binding)
- `src/app.ts` — all middleware and route mounting

## Adding a New Resource

When adding a resource (e.g. `post`), create these files in order:

1. `src/validations/<name>.validation.ts` — Zod v4 schemas + `validateBody()` middleware exports
2. `src/repository/<name>.repository.ts` — `I<Name>Repository` interface + class extending `BaseRepository`
3. `src/services/<name>.service.ts` — `I<Name>Service` interface + class
4. `src/controllers/<name>.controller.ts` — `I<Name>Controller` interface + class extending `BaseController`
5. `src/routes/<name>.route.ts` — class extending `BaseRoute`, exports router
6. Register all in `src/container/index.ts`
7. Mount in `src/app.ts` at `/api/v1/<name>`
8. Export from barrel index files in each directory
9. Add Prisma model to `prisma/schema.prisma`, then run `pnpm prisma:migrate && pnpm prisma:generate`

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

## Key Patterns

**Controller methods** — arrow function properties, always try/catch:
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

**Validation** with Zod v4:
```ts
export const createItemSchema = z.object({
    name: z.string().trim().min(1).max(255),
});
export const createItemValidation: RequestHandler = validateBody(createItemSchema);
```

**Throwing errors:**
```ts
throw new NotFoundError('Item not found');       // 404
throw new ConflictError('Item already exists');  // 409
throw new AuthorizationError('Access denied');   // 403
throw new ValidationError('Invalid input');      // 400
```

## Environment Variables

Copy `.env.example` to `.env`. Required secrets:
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — min 32 chars
- `COOKIE_SECRET` — min 32 chars
- `DATABASE_URL` — PostgreSQL connection string
- `CLIENT_URL` — allowed CORS origin
