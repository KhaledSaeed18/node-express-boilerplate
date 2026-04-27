# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Revival] — 2026-04-12 to 2026-04-27

This entry covers the full resumption of active development after approximately one year of inactivity.
The project was refactored extensively: the architecture was restructured, the validation layer was replaced,
security hardening was applied, observability was improved, and a complete CI/CD pipeline was established.

### Added

- **OpenAPI / Swagger UI** — full API documentation served at `/api/v1/docs` via `swagger-ui-express`
- **CSRF protection** — double-submit cookie pattern using `csrf-csrf`; CSRF token endpoint at `GET /api/v1/auth/csrf-token`
- **Environment validation** — typed configuration object in `src/config/env.ts`; `process.env` is no longer accessed directly anywhere in source code
- **Zod v4 validation** — validation schemas for all auth routes and environment variables; `validate` middleware helper in `src/lib/validate.ts`
- **Pino HTTP logging** — structured request/response logging via `pino-http` with per-request correlation IDs
- **Custom error classes** — `AppError`, `AuthenticationError`, `NotFoundError`, `ConflictError`, `ValidationError`, `AuthorizationError` in `src/errors/`; global error handler converts them to consistent JSON responses
- **Containerization** — `Dockerfile` and `docker-compose.yml` for local development (PostgreSQL 16 on port 5433)
- **Integration test infrastructure** — dedicated Docker Compose file with an ephemeral in-memory database on port 5434, Vitest config, and enforced coverage thresholds
- **Database seed script** — `pnpm prisma:db:seed` with initial data via `tsx`
- **CI pipeline** — GitHub Actions workflow covering lint, type-check, build, and test on every push and pull request
- **Security workflows** — CodeQL static analysis and dependency review action on pull requests
- **Dependabot** — automated updates for npm packages and GitHub Actions with non-breaking-only policy
- **AI agent instruction files** — per-agent context files so all major AI coding tools share the same architectural understanding of the codebase:
  - `CLAUDE.md` — Claude Code (commands, architecture, conventions, available skills)
  - `GEMINI.md` — Google Gemini CLI
  - `AGENTS.md` — OpenAI Codex / ChatGPT
  - `.cursor/rules/architecture.mdc` — Cursor architecture rules
  - `.cursor/rules/conventions.mdc` — Cursor coding conventions
  - `.github/copilot-instructions.md` — GitHub Copilot
  - `.windsurfrules` — Windsurf IDE
- **Claude Code skills** — reusable slash-command workflows in `.claude/skills/`:
  - `/new-resource` — scaffold a full resource across all layers including OpenAPI and tests
  - `/add-middleware` — create and wire up an Express middleware
  - `/add-test` — scaffold unit tests (service layer) and integration tests (HTTP routes)
  - `/update-schema` — update Prisma schema, run migration, regenerate client, and update all affected layers
- **Contributor documentation** — `CONTRIBUTING.md`, PR template, and issue templates (bug report, feature request)

### Changed

- **App / entry-point separation** — Express setup moved entirely to `src/app.ts`; `src/index.ts` only binds the port, making the app importable in tests without side effects
- **Validation layer** — replaced `express-validator` with Zod v4 across all routes
- **Prisma client** — refactored database client initialization; migrated to `@prisma/adapter-pg` for connection pooling
- **Error semantics** — corrected 401 vs 403 distinctions; authentication failures return 401, authorization failures return 403
- **Pagination** — pagination logic corrected in `NoteController` and extracted to `BaseRepository`
- **Cookie configuration** — `COOKIE_SECRET` is now a separate variable (distinct from JWT secrets) used for both cookie signing and CSRF key

### Fixed

- Token generation failure in `signIn` was silently swallowed; now surfaces as a proper `AppError`
- Note ID could arrive as an array from Express params; now explicitly coerced to string
- Rate limiter type import resolved to avoid TypeScript errors under strict mode
- Username generation logic corrected in auth service

### Security

- CSRF protection added for all state-mutating endpoints
- `helmet` middleware hardening confirmed across all routes
- `HttpOnly` signed cookies for all auth tokens
- CodeQL analysis integrated into CI to catch injection and other vulnerability classes
- Dependency review blocks pull requests that introduce packages with known vulnerabilities
- Custom CodeQL suppression config to eliminate false positives on the CSRF token endpoint

### Infrastructure

- GitHub Actions: `ci.yml` — lint, type-check, build, test
- GitHub Actions: `codeql.yml` — CodeQL static analysis (JavaScript/TypeScript)
- GitHub Actions: `security.yml` — dependency review on pull requests
- Dependabot: weekly npm updates (non-breaking), weekly GitHub Actions updates (major excluded)
- All CI actions updated to latest stable versions (checkout v6, setup-node v6, pnpm action-setup v4)

### Dependencies

Breaking major-version upgrades are noted in the table.

#### New packages

| Package | Version | Notes |
| ------- | ------- | ----- |
| `zod` | v4 | Replaces `express-validator` for all validation |
| `csrf-csrf` | v4 | CSRF double-submit cookie protection |
| `pino` + `pino-http` | latest | Replaces `morgan` for structured JSON logging |
| `swagger-ui-express` | latest | Serves OpenAPI docs at `/api/v1/docs` |
| `@prisma/adapter-pg` | v7 | Connection pooling adapter, required by Prisma v7 |
| `http-errors` | latest | Standard HTTP error factory used by the error middleware |
| `husky` + `lint-staged` | latest | Git hooks for pre-commit quality enforcement |
| `prettier` + `eslint-config-prettier` | latest | Code formatting |
| `typescript-eslint` | latest | TypeScript-aware ESLint rules |
| `@commitlint/cli` + `@commitlint/config-conventional` | latest | Enforces Conventional Commits on every commit |
| `vitest` + `@vitest/coverage-v8` | latest | Test runner and coverage provider |
| `supertest` | latest | HTTP integration test client |
| `tsx` | latest | TypeScript execution for seed scripts and test setup |
| `pino-pretty` | latest | Human-readable log output in development |

#### Upgraded (breaking)

| Package | Before | After | Notes |
| ------- | ------ | ----- | ----- |
| `prisma` + `@prisma/client` | v6 | **v7** | Breaking — new driver adapter model required adding `@prisma/adapter-pg`; client initialization updated |
| `express` | v4 | **v5** | Breaking — updated error handling and route signatures |
| `typescript` | v5 | **v6** | Breaking — stricter type checking; all type errors resolved |
| `dotenv` | v16 | v17 | Major bump; API compatible |
| `bcryptjs` | v2 | v3 | Major bump; API compatible |
| `express-rate-limit` | v7 | v8 | Major bump; updated type imports |
| `@types/node` | v22 | v25 | Aligned to Node.js 22+ runtime target |

#### Removed

| Package | Reason |
| ------- | ------ |
| `express-validator` | Replaced by Zod v4 |
| `morgan` | Replaced by `pino-http` |

---

[Revival]: https://github.com/KhaledSaeed18/node-express-boilerplate/compare/c2992159...HEAD
