# GitHub Copilot Instructions

## Project Overview

Node.js + Express + TypeScript REST API boilerplate. Uses Prisma ORM with PostgreSQL, Zod v4 for validation, Pino for logging, JWT in HttpOnly cookies for auth, CSRF double-submit protection.

## Architecture

Strict layered architecture — each layer communicates only with the layer directly below it:

```
Routes → Controllers → Services → Repositories → Prisma
```

All layers are interface-driven. The DI container (`src/container/index.ts`) is the only place that instantiates concrete classes. Routes retrieve instances via `this.container.get<Name>Controller()`.

## Non-Negotiable Rules

| Rule | Detail |
|------|--------|
| No `process.env` | Use `src/config/env.ts` typed config object |
| No `console.*` | Use Pino logger from `src/config/logger.ts` |
| No direct `res.json()` on errors | Throw from `src/errors/`, caught by global error middleware |
| No `any` type | Strict TypeScript throughout |
| `import type` for types | All type-only imports must use `import type` |
| Explicit return types | All public methods and class properties |
| No floating promises | Always `await` or handle rejection |
| pnpm only | Never generate npm/yarn lockfiles |

## Scaffolding a New Resource

When adding a resource (e.g. `post`), create files in this order:

1. `src/validations/post.validation.ts` — Zod v4 schema + `validateBody()` middleware exports
2. `src/repository/post.repository.ts` — `IPostRepository` interface + `PostRepository extends BaseRepository`
3. `src/services/post.service.ts` — `IPostService` interface + `PostService`
4. `src/controllers/post.controller.ts` — `IPostController` interface + `PostController extends BaseController`
5. `src/routes/post.route.ts` — `PostRoute extends BaseRoute`
6. Register all in `src/container/index.ts`
7. Mount in `src/app.ts` at `/api/v1/post`
8. Export from barrel index files

## Key Patterns

**Controller methods** — arrow function properties, always try/catch with `this.handleError(error, next)`:
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

**Zod validation** — use `validateBody()` factory:
```ts
export const createItemSchema = z.object({ name: z.string().trim().min(1).max(100) });
export const createItemValidation: RequestHandler = validateBody(createItemSchema);
```

**Error throwing**:
```ts
throw new NotFoundError('Item not found');       // 404
throw new ConflictError('Item already exists');  // 409
throw new AuthorizationError('Access denied');   // 403
throw new ValidationError('Bad input');          // 400
```

## Prisma

- Schema lives in `prisma/schema.prisma`; generated client in `src/generated/prisma/`
- Run `pnpm prisma:generate` after every schema change
- Run `pnpm prisma:migrate` to create and apply a migration
- Use `@@map("snake_case_table")` and `@map("snake_case_column")` for DB naming
- All IDs use `@default(cuid())`
