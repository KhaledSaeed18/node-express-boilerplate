---
name: security-audit
description: Run a project-specific security audit of this Express API — auth, CSRF, rate limiting, headers, validation, secrets, and dependencies. Use when the user asks for a security review, audit, hardening pass, or before a release.
---

Audit the codebase against this project's security architecture. Report findings ordered by severity with file:line references; do not change code unless asked.

## 1. Authentication & tokens

- JWT access/refresh tokens must be delivered as **signed HttpOnly cookies** (`src/services/auth.service.ts`, cookie options in the auth controller). Flag any token exposed in a JSON body or non-HttpOnly cookie.
- Cookie flags: `httpOnly: true`, `secure` in production, `sameSite` set, correct `maxAge` matching token expiry.
- Refresh-token rotation: refresh must invalidate/replace the old token, never extend it silently.
- `protect` middleware (`src/middleware/auth.middleware.ts`) applied to every non-public route; 401 for unauthenticated, 403 for authenticated-but-forbidden.
- Ownership checks in services: a user must never read/update/delete another user's records (check every repository query filters by `userId`).

## 2. CSRF

- `doubleCsrfProtection` applied to **all** mutating routes (POST/PUT/PATCH/DELETE) in every file in `src/routes/`.
- Token endpoint `GET /auth/csrf-token` must not itself be state-changing.

## 3. Rate limiting & headers

- Every route group attaches a limiter from `src/middleware/limiter.middleware.ts`; auth routes must have the strictest limit.
- `helmet` and CORS configured in `src/app.ts`; CORS origin must come from config, never `*` with credentials.
- `trust proxy` set correctly so limiters key on the real client IP.

## 4. Input validation & output shaping

- Every POST/PUT/PATCH route has a Zod validation middleware from `src/validations/`.
- Params/query used in queries (ids, pagination) are validated, not passed raw.
- Services map entities through `toResponseDTO()` — flag any handler returning a raw Prisma entity (risk: leaking `password`, token hashes, internal fields).
- Error responses come only from `src/errors/` + global error middleware; flag any `res.status().json()` on an error path (risk: inconsistent shape, stack leaks). Error middleware must not expose stack traces or Prisma error details in production.

## 5. Secrets & config

- No `process.env` outside `src/config/env.ts`; all secrets validated by the Zod env schema with no insecure defaults for `JWT_SECRET`/cookie secrets.
- `.env` gitignored; `.env.example` contains placeholders only. Scan the repo for hardcoded credentials, API keys, or connection strings.
- Logger (`src/config/logger.ts`) redacts sensitive fields (authorization headers, cookies, passwords).

## 6. Dependencies & platform

```bash
pnpm audit --prod
```

- Flag high/critical advisories with the upgrade path.
- Dockerfile: runs as non-root user, multi-stage build, no secrets baked into layers.
- CI: CodeQL/security workflows present in `.github/workflows/` and passing.

## Output format

For each finding: **severity (critical/high/medium/low) — title — file:line — why it matters — recommended fix.** End with a short summary of what was checked and found clean.
