# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Agent Configuration Files

| Agent | File |
|-------|------|
| Claude Code | `CLAUDE.md` (this file) + `.claude/skills/` |
| Google Gemini CLI | `GEMINI.md` |
| OpenAI Codex / ChatGPT | `AGENTS.md` |
| Cursor | `.cursor/rules/architecture.mdc`, `.cursor/rules/conventions.mdc` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Windsurf | `.windsurfrules` |

## Available Skills

- `/new-resource` — scaffold a complete new API resource (validation → repository → service → controller → route → container → app mount → OpenAPI → tests)
- `/add-middleware` — add a new Express middleware and wire it up correctly
- `/add-test` — scaffold unit tests (service layer) and integration tests (HTTP routes) for an existing resource
- `/update-schema` — add a model or fields to `prisma/schema.prisma`, run migration, regenerate client, and update all affected layers

## Commands

```bash
# Development
pnpm dev                    # Start with hot reload (nodemon)
pnpm build                  # Compile TypeScript to dist/
pnpm start                  # Run compiled output

# Code quality (run before committing)
pnpm full-check             # format:check + lint:check + type-check
pnpm lint                   # ESLint with auto-fix
pnpm format                 # Prettier with auto-fix
pnpm type-check             # tsc --noEmit

# Prisma
pnpm prisma:migrate         # Run migrations (dev)
pnpm prisma:migrate:deploy  # Run migrations (production)
pnpm prisma:generate        # Regenerate Prisma client after schema changes
pnpm prisma:studio          # Open Prisma Studio
pnpm prisma:db:seed         # Seed the database
```

**Package manager:** pnpm (v10.28.0+). **Node:** >= 22.0.0.

# Testing

```bash
pnpm test                   # Run unit tests (Vitest)
pnpm test:watch             # Run unit tests in watch mode
pnpm test:coverage          # Unit tests with coverage report
pnpm test:integration       # Run integration tests (requires test DB)
pnpm test:all               # Run all test suites
pnpm db:test:up             # Start ephemeral test database (Docker, port 5434)
pnpm db:test:down           # Stop and remove test database
pnpm db:test:migrate        # Apply migrations to the test database
```

Unit tests live in `tests/unit/` and target the service layer in isolation (mocked repositories).
Integration tests live in `tests/integration/` and run full HTTP cycles via `supertest` against a real PostgreSQL instance.

## Architecture

Layered clean architecture: **Routes → Controllers → Services → Repositories → Prisma (PostgreSQL)**.

Each layer has a base class and interfaces for loose coupling:
- `BaseRoute` (abstract): initializes Router and the DI Container, enforces `initializeRoutes()` override
- `BaseController`: shared helpers (`sendResponse`, `sendPaginatedResponse`, cookie management, `handleError`)
- `BaseRepository`: common Prisma CRUD wrappers
- `Container` (Singleton in `src/container/`): wires `UserRepository/NoteRepository → AuthService/NoteService → AuthController/NoteController`; accessed via `Container.getInstance()`

**Entry points:**
- `src/index.ts` — binds the port (kept separate so tests can import `app` without binding)
- `src/app.ts` — Express setup: correlation → httpLogger → helmet → cors → json → cookie-parser → CSRF, then mounts `/api/v1/auth` and `/api/v1/note`

## Key Conventions

**Validation:** Zod v4 schemas live in `src/validations/`. Use the `validate` helper from `src/lib/validate.ts` to attach them as route middleware. `process.env` is never accessed directly — use the typed config object from `src/config/env.ts`.

**Error handling:** Throw custom error classes from `src/errors/` (`AppError`, `AuthenticationError`, `NotFoundError`, `ConflictError`, `ValidationError`, `AuthorizationError`). The global handler in `src/middleware/error.middleware.ts` converts them to JSON responses. Do not call `res.status(...).json(...)` directly in controllers for error paths.

**TypeScript:** Strict mode is on. ESLint enforces no `any`, type-only imports (`import type`), explicit return types, no floating promises, and prefer nullish coalescing. Run `pnpm lint` after changes.

**Authentication:** JWT stored in HttpOnly cookies. `protect` middleware (`src/middleware/auth.middleware.ts`) verifies access tokens. Refresh tokens are separate. CSRF uses double-submit cookie pattern — get a token from `GET /api/v1/auth/csrf-token` before any mutating request.

**Logging:** Pino via `src/config/logger.ts` (pretty in dev, JSON in prod). HTTP logging via pino-http (`src/middleware/httpLogger.middleware.ts`). Correlation IDs are injected per request.

**Prisma schema** (`prisma/schema.prisma`): `User` (id CUID, username unique, email unique, password, notes[]) and `Note` (id CUID, title, content, userId FK cascade-delete). Run `pnpm prisma:generate` whenever the schema changes.

## Environment Variables

Copy `.env.example` to `.env`. Required secrets must meet minimum lengths:
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — min 32 chars
- `COOKIE_SECRET` — min 32 chars
- `DATABASE_URL` — PostgreSQL connection string
- `CLIENT_URL` — allowed CORS origin
