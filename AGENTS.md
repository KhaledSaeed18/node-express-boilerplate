# AGENTS.md

Canonical instructions for AI coding agents working in this repository.

## Read First

- Project overview and architecture: [README.md](README.md)
- Setup and contributor workflow: [CONTRIBUTING.md](CONTRIBUTING.md)
- Copilot-specific wrapper: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Claude-specific wrapper and skills: [CLAUDE.md](CLAUDE.md)
- Gemini-specific wrapper: [GEMINI.md](GEMINI.md)

## Stack

Node.js 22+ · Express 5 · TypeScript 6 (strict) · Prisma 7 + PostgreSQL 16 · Zod v4 · Pino · JWT (HttpOnly cookies) · CSRF (double-submit cookie) · Vitest · pnpm

## Required Commands

```bash
# Development
pnpm dev
pnpm build
pnpm start

# Quality gate (run before finalizing changes)
pnpm full-check

# Focused checks
pnpm lint
pnpm format
pnpm type-check

# Prisma
pnpm prisma:migrate
pnpm prisma:migrate:deploy
pnpm prisma:generate
pnpm prisma:db:seed

# Tests
pnpm test
pnpm test:integration
pnpm test:all
pnpm db:test:up
pnpm db:test:migrate
pnpm db:test:down
```

Package manager is pnpm only. Never use npm or yarn.

## Architecture Contract

Layering is strict and one-directional:

```text
Routes → Controllers → Services → Repositories → Prisma
```

- The DI container in `src/container/index.ts` is the only place to instantiate concrete classes.
- Route classes resolve controllers via `this.container.get<Name>Controller()`.
- `src/index.ts` binds the port only; `src/app.ts` handles middleware and route mounting.

## Non-Negotiable Rules

- Never read `process.env` directly; use `src/config/env.ts`.
- Never use `console.*`; use `src/config/logger.ts`.
- Never send ad-hoc error responses from controllers; throw typed errors from `src/errors/` and let global middleware format responses.
- No `any`, no floating promises, and use `import type` for type-only imports.
- Public class methods and properties must have explicit return types.
- Prefer `??` over `||` for nullish handling.

## Implementation Patterns

- Controller handlers should be arrow-function properties to preserve `this` binding.
- Validation should be Zod v4 in `src/validations/` using helpers from `src/lib/validate.ts`.
- Repository `update`/`delete` operations must wrap Prisma calls in try/catch and pass errors through `handlePrismaError`.
- Apply `doubleCsrfProtection` on all mutating routes (`POST`, `PUT`, `PATCH`, `DELETE`).
- Attach route-group-specific limiters from `src/middleware/limiter.middleware.ts`.

## New Resource Order

1. Update `prisma/schema.prisma`, then run `pnpm prisma:migrate` and `pnpm prisma:generate`.
2. Add `src/types/<name>.types.ts`.
3. Add `src/validations/<name>.validation.ts`.
4. Add `src/repository/<name>.repository.ts`.
5. Add `src/services/<name>.service.ts`.
6. Add `src/controllers/<name>.controller.ts`.
7. Add `src/routes/<name>.route.ts`.
8. Register in `src/container/index.ts`.
9. Mount in `src/app.ts` at `${config.BASE_URL}/${config.API_VERSION}/<resource>`.
10. Update barrel exports.
11. Add OpenAPI docs in `src/docs/`.
12. Run `pnpm full-check` and relevant tests.

## Common Gotchas

- Run `pnpm prisma:generate` after every Prisma schema change.
- Integration tests require test DB setup (`pnpm db:test:up` and `pnpm db:test:migrate`).
- CSRF token comes from `GET /api/v1/auth/csrf-token` and must be sent as `x-csrf-token`.
