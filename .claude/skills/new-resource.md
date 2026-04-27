---
name: new-resource
description: Scaffold a complete new API resource (validation → repository → service → controller → route → container → app mount → OpenAPI → tests). Use when the user asks to add a new resource, entity, model, or endpoint group to the API.
---

When the user asks to add a new resource (e.g. "add a comments resource"), follow this exact sequence. Ask for the resource name if not provided.

## Variables

- `<Name>` = PascalCase singular (e.g. `Comment`)
- `<name>` = camelCase singular (e.g. `comment`)
- `<names>` = camelCase plural (e.g. `comments`)

---

## Step 1 — Prisma Schema (`prisma/schema.prisma`)

Add the new model first so TypeScript types are available for every subsequent step.

Requirements:
- `id String @id @default(cuid())`
- All fields with appropriate types and nullability
- Foreign key relations with `onDelete: Cascade` on the child side
- `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- `@@index` on every foreign key column and commonly filtered fields
- `@@map("snake_case_table_name")`

Then immediately run:
```bash
pnpm prisma:migrate
pnpm prisma:generate
```

---

## Step 2 — Types (`src/types/<name>.types.ts`)

Define DTOs before writing any other layer:

```ts
export interface Create<Name>DTO { /* fields */ }
export interface Update<Name>DTO { /* partial fields */ }
export interface <Name>ResponseDTO { /* safe fields to return, no password etc. */ }
```

Export from `src/types/index.ts`.

---

## Step 3 — Validation (`src/validations/<name>.validation.ts`)

Create Zod v4 schemas. Pattern from `src/validations/note.validation.ts`:

```ts
import { z } from 'zod';
import { validateBody } from '../lib/validate';
import type { RequestHandler } from 'express';

export const create<Name>Schema = z.object({ /* fields */ });
export type Create<Name>Input = z.infer<typeof create<Name>Schema>;
export const create<Name>Validation: RequestHandler = validateBody(create<Name>Schema);

export const update<Name>Schema = z.object({ /* fields, all optional for PATCH */ });
export type Update<Name>Input = z.infer<typeof update<Name>Schema>;
export const update<Name>Validation: RequestHandler = validateBody(update<Name>Schema);
```

---

## Step 4 — Repository (`src/repository/<name>.repository.ts`)

1. Define `I<Name>Repository` interface with all method signatures.
2. Implement `<Name>Repository extends BaseRepository`.
3. Use `this.prisma.<model>` for all queries.
4. Wrap `update` and `delete` in try/catch calling `this.handlePrismaError(error)`.
5. Use `this.findManyWithPagination()` and `this.count()` for paginated list operations.

Pattern: copy `src/repository/note.repository.ts` and adapt.

Export from `src/repository/index.ts`.

---

## Step 5 — Service (`src/services/<name>.service.ts`)

1. Define `I<Name>Service` interface.
2. Implement `<Name>Service` — inject `I<Name>Repository` via constructor.
3. Throw from `src/errors/` only — never return raw Prisma errors.
4. Map entities to `<Name>ResponseDTO` via a private `toResponseDTO()` method.
5. Never return password, token, or internal fields.

Export from `src/services/index.ts`.

---

## Step 6 — Controller (`src/controllers/<name>.controller.ts`)

1. Define `I<Name>Controller` interface.
2. Implement `<Name>Controller extends BaseController`.
3. All methods are **arrow function properties** — never regular methods.
4. Every method is wrapped in try/catch using `this.handleError(error, next)`.
5. Use `this.sendResponse()` for single items and `this.sendPaginatedResponse()` for lists.
6. Never call `res.status().json()` directly on error paths.

Export from `src/controllers/index.ts`.

---

## Step 7 — Route (`src/routes/<name>.route.ts`)

1. Extend `BaseRoute`, implement `initializeRoutes()`.
2. Apply a dedicated rate limiter to the entire route group.
3. Apply `protect` to every authenticated endpoint.
4. Apply `doubleCsrfProtection` (imported from `src/app.ts` or middleware) to all mutating routes.
5. Apply validation middleware to every POST / PUT / PATCH route.

Pattern: copy `src/routes/note.route.ts` and adapt.

Export from `src/routes/index.ts` if a barrel exists.

---

## Step 8 — Container (`src/container/index.ts`)

Add in order:

```ts
// Private fields
private <name>Repository!: I<Name>Repository;
private <name>Service!: I<Name>Service;
private <name>Controller!: I<Name>Controller;

// initializeRepositories()
this.<name>Repository = new <Name>Repository(this.prisma);

// initializeServices()
this.<name>Service = new <Name>Service(this.<name>Repository);

// initializeControllers()
this.<name>Controller = new <Name>Controller(this.<name>Service);

// Public getter
get<Name>Controller(): I<Name>Controller { return this.<name>Controller; }
```

Add the getter signature to the `IContainer` interface.

---

## Step 9 — App (`src/app.ts`)

```ts
import <name>Routes from './routes/<name>.route';
app.use(`${config.BASE_URL}/${config.API_VERSION}/<names>`, <name>Routes);
```

---

## Step 10 — OpenAPI (`src/docs/`)

Add or update the OpenAPI spec for the new resource:
- Define request body schemas
- Define response schemas
- Document all endpoints with path, method, summary, request, and response examples
- Reference the `<Name>` schema in the paths object

---

## Step 11 — Tests

**Unit test** (`tests/unit/services/<name>.service.test.ts`):
- Mock `I<Name>Repository` using `vi.fn()`
- Test every service method: happy path, not-found, conflict, authorization failure

**Integration test** (`tests/integration/<names>.test.ts`):
- Use `supertest` against the real app
- Test full HTTP cycle: correct status codes, response shape, auth enforcement, CSRF enforcement, validation rejection

---

## Step 12 — Verification

```bash
pnpm full-check      # format + lint + type-check
pnpm test            # unit tests
pnpm test:integration  # integration tests (if db:test:up is running)
```

Fix every error before reporting the task as done.
