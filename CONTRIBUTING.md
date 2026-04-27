# Contributing

Thank you for taking the time to contribute. Please read this document fully before opening issues or submitting pull requests.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Database](#database)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Commit Message Rules](#commit-message-rules)
- [Branch Strategy](#branch-strategy)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 22.0.0 |
| pnpm | 10.0.0 |
| Docker + Docker Compose | any recent stable |
| PostgreSQL | 16 (via Docker or local) |

Install pnpm if you do not have it:

```bash
npm install -g pnpm
```

---

## Local Development Setup

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/node-express-boilerplate.git
cd node-express-boilerplate

# 2. Install dependencies (installs git hooks via husky automatically)
pnpm install

# 3. Copy the example environment file and fill in your values
cp .env.example .env
```

---

## Environment Variables

All required variables are documented in `.env.example`. Key constraints:

| Variable | Constraint |
|----------|-----------|
| `JWT_SECRET` | min 32 characters |
| `JWT_REFRESH_SECRET` | min 32 characters, different from `JWT_SECRET` |
| `COOKIE_SECRET` | min 32 characters, different from both JWT secrets |
| `DATABASE_URL` | valid PostgreSQL connection string |
| `CLIENT_URL` | valid URL (used as the allowed CORS origin) |

`process.env` is never accessed directly in source code — all config is read through the typed object in `src/config/env.ts`.

---

## Running the Application

### With Docker (recommended for a clean database)

The provided `docker-compose.yml` starts a PostgreSQL 16 instance on port **5433** (to avoid conflicting with any local Postgres running on 5432).

```bash
# Start the database container
docker compose up -d

# Run migrations
pnpm prisma:migrate

# Start the dev server with hot reload
pnpm dev
```

To stop and remove the container:

```bash
docker compose down          # keep the volume (data persists)
docker compose down -v       # also remove the volume (clean slate)
```

### Without Docker

Point `DATABASE_URL` in `.env` at your local PostgreSQL instance, then:

```bash
pnpm prisma:migrate
pnpm dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload (nodemon) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run the compiled output from `dist/` |
| `pnpm full-check` | Run format check + lint check + type check |
| `pnpm format` | Auto-fix formatting with Prettier |
| `pnpm lint` | Auto-fix lint issues with ESLint |
| `pnpm type-check` | Type-check without emitting files |

---

## Database

| Script | Description |
|--------|-------------|
| `pnpm prisma:migrate` | Create and apply a new migration (dev) |
| `pnpm prisma:migrate:deploy` | Apply pending migrations (production / CI) |
| `pnpm prisma:migrate:reset` | Reset the database and re-run all migrations |
| `pnpm prisma:generate` | Regenerate the Prisma client after schema changes |
| `pnpm prisma:db:seed` | Seed the database with initial data |
| `pnpm prisma:studio` | Open Prisma Studio in the browser |
| `pnpm prisma:validate` | Validate the Prisma schema |

**Always run `pnpm prisma:generate` after modifying `prisma/schema.prisma`.**

---

## Testing

The project has two test suites: **unit** and **integration**.

### Unit Tests

Unit tests live in `tests/unit/` and cover service-layer logic in isolation.

```bash
pnpm test              # run once
pnpm test:watch        # run in watch mode
pnpm test:coverage     # run with coverage report
```

Coverage thresholds (enforced):

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 85% |
| Branches | 75% |
| Statements | 80% |

### Integration Tests

Integration tests live in `tests/integration/` and run against a real PostgreSQL instance. A dedicated Docker Compose file is provided for this purpose — the database uses `tmpfs` so it is wiped on every run.

```bash
# 1. Create the test environment file
cp .env.example .env.test
# Edit .env.test — set DATABASE_URL to: postgresql://test_user:test_password@localhost:5434/express_test

# 2. Start the test database
pnpm db:test:up

# 3. Apply migrations to the test database
pnpm db:test:migrate

# 4. Run integration tests
pnpm test:integration

# 5. Stop and remove the test database when done
pnpm db:test:down
```

Coverage thresholds (enforced):

| Metric | Threshold |
|--------|-----------|
| Lines | 70% |
| Functions | 75% |
| Branches | 65% |
| Statements | 70% |

### Run All Tests

```bash
pnpm test:all
```

---

## Code Quality

All of the following are enforced automatically by git hooks (husky + lint-staged run on every commit). You can also run them manually:

```bash
pnpm full-check   # format:check + lint:check + type-check (non-destructive)
pnpm format       # auto-fix formatting
pnpm lint         # auto-fix lint issues
pnpm type-check   # TypeScript strict mode check
```

**Rules enforced by ESLint:**
- No `any` types
- Type-only imports must use `import type`
- Explicit return types on functions
- No floating promises
- Prefer nullish coalescing over `||`

**Do not bypass hooks** (`--no-verify`) in commits intended for review.

---

## Commit Message Rules

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) via `commitlint`. Every commit message must follow this format:

```
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

### Allowed Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting or whitespace — no logic change |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI configuration changes |
| `chore` | Maintenance tasks with no src/test changes |
| `revert` | Reverts a previous commit |

### Rules

- Type must be lowercase
- Subject must not be empty
- Subject must not end with a period
- Subject must not use title case, PascalCase, or UPPER CASE
- Header line (type + scope + subject) must not exceed **100 characters**
- A blank line is required between header and body
- Body lines must not exceed **300 characters**

### Examples

```
feat(auth): add refresh token rotation on each use

fix(notes): return 404 when note belongs to different user

docs: document CSRF flow in CONTRIBUTING

refactor(repository): extract pagination helper to BaseRepository
```

---

## Branch Strategy

### Protected Branches

| Branch | Rule |
|--------|------|
| `main` | Protected. No direct pushes. Merges only from `dev` via pull request after review. |
| `dev` | Integration branch. All feature/fix/chore branches are merged here first. |

**Never push directly to `main`.** Always target `dev` with your pull request.

### Branch Naming

Create your branch off `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b <type>/<short-description>
```

| Pattern | When to use |
|---------|-------------|
| `feat/<description>` | New feature |
| `fix/<description>` | Bug fix |
| `refactor/<description>` | Refactoring |
| `docs/<description>` | Documentation |
| `test/<description>` | Tests |
| `chore/<description>` | Maintenance |
| `ci/<description>` | CI/CD changes |

Use kebab-case for the description. Keep it short and descriptive.

```bash
# Good
feat/note-soft-delete
fix/refresh-token-expiry
refactor/base-repository-pagination

# Bad
feature1
my-changes
fix_thing
```

---

## Submitting a Pull Request

1. **Target `dev`**, not `main`.
2. Ensure `pnpm full-check` passes locally.
3. If you changed `prisma/schema.prisma`, include the generated migration file and confirm `pnpm prisma:generate` was run.
4. If you added new environment variables, update `.env.example` with the variable, its constraints, and a comment explaining its purpose.
5. Keep pull requests focused. One concern per PR.
