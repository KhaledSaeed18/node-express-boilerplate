---
name: update-schema
description: Update the Prisma schema to add a new model, add fields to an existing model, or change relations — then run migration and regenerate the client. Use when the user asks to add a field, add a model, change a relation, or update the database schema.
---

When the user asks to modify the Prisma schema, follow this sequence.

## Step 1 — Edit `prisma/schema.prisma`

**Adding a new model:**

```prisma
model <Name> {
    id        String   @id @default(cuid())
    // required fields
    // optional fields (mark with ?)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // relations
    userId String
    user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId])
    @@index([/* other commonly filtered fields */])
    @@map("<snake_case_table_name>")
}
```

**Adding fields to an existing model:**

- Nullable new fields (safest for existing data): `fieldName Type?`
- Non-nullable with a default: `fieldName Type @default(value)`
- Non-nullable without a default: requires a migration with a `--create-only` step to backfill data before applying

**Changing relations:**

- Adding a one-to-many: add the array field on the "one" side and the FK field + scalar on the "many" side
- Always set `onDelete:` explicitly — use `Cascade` for child records that must not outlive the parent, `Restrict` or `SetNull` otherwise

**Naming conventions:**

- Table names: `@@map("snake_case")` on every model
- Column names: `@map("snake_case")` on every field that differs from the Prisma field name
- All IDs: `@id @default(cuid())`
- Always add `@@index` on foreign key columns

---

## Step 2 — Run the migration

```bash
pnpm prisma:migrate
```

This creates a new migration file in `prisma/migrations/` and applies it to the dev database.

If the migration involves a non-nullable column without a default (data backfill needed):

```bash
pnpm exec prisma migrate dev --create-only   # generate SQL without applying
# edit the generated SQL to add UPDATE statement for existing rows
pnpm exec prisma migrate deploy              # apply the edited migration
```

---

## Step 3 — Regenerate the Prisma client

```bash
pnpm prisma:generate
```

This must run after every schema change. The generated client lives in `src/generated/prisma/`.

---

## Step 4 — Update affected TypeScript code

After schema changes, update in order:

1. **Types** (`src/types/`) — update DTOs to reflect new/changed fields
2. **Repository** — update query `select` / `include` clauses, add new methods if needed
3. **Service** — update `toResponseDTO()` mapping, add validation/business logic for new fields
4. **Validation schemas** (`src/validations/`) — add Zod fields for new input fields
5. **Controller** — update any response shaping if needed
6. **OpenAPI spec** — update request/response schemas in `src/docs/`

---

## Step 5 — Verify

```bash
pnpm full-check
pnpm test
pnpm test:integration   # requires pnpm db:test:up + pnpm db:test:migrate
```

Fix every error before reporting done. If integration tests fail due to schema mismatch, run:

```bash
pnpm db:test:migrate    # apply the new migration to the test database
```
