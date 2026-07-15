---
name: add-openapi-docs
description: Add or update OpenAPI 3.1 documentation for API endpoints in src/docs/. Use when the user asks to document endpoints, add Swagger/OpenAPI docs, or when a new resource or route was added without docs.
---

When the user asks to document an endpoint or resource, follow this sequence. The spec is assembled at import time in `src/docs/index.ts` and served by swagger-ui-express at `/api-docs`.

## Variables

- `<Name>` = PascalCase singular (e.g. `Note`)
- `<name>` = camelCase singular (e.g. `note`)
- `<names>` = camelCase plural (e.g. `notes`)

## Step 1 — Schemas (`src/docs/schemas.ts`)

Add component schemas for the resource:

- `<Name>` — the response entity shape (must match `<Name>ResponseDTO` in `src/types/`, never include password/token/internal fields)
- `Create<Name>Request` and `Update<Name>Request` — must match the Zod schemas in `src/validations/<name>.validation.ts` exactly (required fields, min/max lengths, formats)

Reuse the existing shared schemas: `ErrorResponse`, `PaginatedResponse`, `SuccessResponse`.

## Step 2 — Paths (`src/docs/paths/<name>.paths.ts`)

Copy the structure of `src/docs/paths/note.paths.ts`. It defines reusable local constants — keep the same ones:

- `csrfHeader` — required `x-csrf-token` header parameter on every mutating operation (POST/PUT/PATCH/DELETE)
- `rateLimitHeaders` — `X-RateLimit-*` response headers with the route group's actual limit
- `authErrors` — shared 401/403/429 responses referencing `#/components/schemas/ErrorResponse`
- `paginationParams` — `page`/`limit` query params on list endpoints

For every operation document:

- `tags`, `summary`, `description` (mention auth + rate limit)
- Request body referencing the component schema, with a realistic `example`
- All response codes actually produced: 200/201, 400 (validation), 401, 403 (CSRF or ownership), 404, 409 (conflict), 429
- `security: [{ bearerAuth: [] }, { cookieAuth: [] }]` on protected endpoints

Export `const <name>Paths = { ... }` keyed by path (e.g. `'/notes'`, `'/notes/{id}'` — no base URL prefix; `src/docs/index.ts` handles that).

## Step 3 — Register (`src/docs/index.ts`)

```ts
import { <name>Paths } from './paths/<name>.paths';
// merge into the paths object alongside authPaths, notePaths, healthPaths
```

If the resource introduces a new tag, add it to the `tags` array with a description.

## Step 4 — Verify

```bash
pnpm full-check
pnpm dev   # then open http://localhost:3000/api-docs and confirm the new endpoints render
```

Confirm every documented request/response matches the actual controller and validation behavior — docs that drift from code are worse than no docs.
