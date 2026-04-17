---
name: new-resource
description: Scaffold a complete new API resource (validation + repository + service + controller + route + container wiring + app mounting). Use when the user asks to add a new resource, entity, model, or endpoint group to the API.
---

When the user asks to add a new resource (e.g. "add a comments resource"), follow this exact sequence. Ask for the resource name if not provided.

## Variables
- `<Name>` = PascalCase (e.g. `Comment`)
- `<name>` = camelCase (e.g. `comment`)
- `<names>` = camelCase plural (e.g. `comments`)

## Step 1 — Validation (`src/validations/<name>.validation.ts`)

Create Zod v4 schemas for create and update. Use `validateBody()` from `../lib/validate`. Export both the schema type and the `RequestHandler`.

Pattern (copy from `src/validations/note.validation.ts` and adapt field names).

## Step 2 — Repository (`src/repository/<name>.repository.ts`)

1. Define `I<Name>Repository` interface with all methods.
2. Implement `<Name>Repository extends BaseRepository`.
3. Use `this.prisma.<model>` for queries.
4. Wrap `update`/`delete` in try/catch calling `this.handlePrismaError(error)`.
5. Use `this.findManyWithPagination()` and `this.count()` for list/count.

Pattern: copy `src/repository/note.repository.ts`.

Export from `src/repository/index.ts`.

## Step 3 — Service (`src/services/<name>.service.ts`)

1. Define `I<Name>Service` interface.
2. Implement `<Name>Service` injecting `I<Name>Repository` via constructor.
3. Throw from `src/errors/` (`NotFoundError`, `ConflictError`, `AuthorizationError`, `ValidationError`).
4. Map Prisma entities to response DTOs via a private `toResponseDTO()` method.

Add types (`Create<Name>DTO`, `Update<Name>DTO`, `<Name>ResponseDTO`) to `src/types/`.

Export from `src/services/index.ts`.

## Step 4 — Controller (`src/controllers/<name>.controller.ts`)

1. Define `I<Name>Controller` interface.
2. Implement `<Name>Controller extends BaseController`.
3. All methods are **arrow function properties** (not regular methods) for correct `this` binding.
4. Every method is wrapped in try/catch using `this.handleError(error, next)`.
5. Use `this.sendResponse()` or `this.sendPaginatedResponse()` — never `res.json()` directly.

Export from `src/controllers/index.ts`.

## Step 5 — Route (`src/routes/<name>.route.ts`)

1. Extend `BaseRoute`, implement `initializeRoutes()`.
2. Apply `protect` and a rate limiter to every route.
3. Apply validation middleware to POST/PUT routes.
4. Export router instance for mounting.

Pattern: copy `src/routes/note.route.ts`.

Export from `src/routes/index.ts` if a barrel exists.

## Step 6 — Container (`src/container/index.ts`)

Add to the container in order:
- Private fields: `private <name>Repository!: I<Name>Repository;` etc.
- `initializeRepositories()`: `this.<name>Repository = new <Name>Repository(this.prisma);`
- `initializeServices()`: `this.<name>Service = new <Name>Service(this.<name>Repository);`
- `initializeControllers()`: `this.<name>Controller = new <Name>Controller(this.<name>Service);`
- Public getter: `get<Name>Controller(): I<Name>Controller { return this.<name>Controller; }`
- Add getter to `IContainer` interface.

## Step 7 — App (`src/app.ts`)

Import the route and mount it:
```ts
import <name>Routes from './routes/<name>.route';
app.use(`${config.BASE_URL}/<names>`, <name>Routes);
```

## Step 8 — Prisma Schema (`prisma/schema.prisma`)

Add the new model with:
- `id String @id @default(cuid())`
- All fields with appropriate types
- Relations with `onDelete: Cascade` where appropriate
- `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- `@@index` on foreign keys and commonly queried fields
- `@@map("snake_case_table_name")`

Then run: `pnpm prisma:migrate` and `pnpm prisma:generate`.

## Step 9 — Verification

Run `pnpm full-check` and fix any TypeScript or lint errors before reporting done.
