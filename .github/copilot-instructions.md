# GitHub Copilot Instructions

Copilot-specific wrapper for this repository.

## Primary Source

Use [AGENTS.md](../AGENTS.md) as the canonical instructions for architecture, commands, hard rules, and scaffolding order.

## Copilot-Specific Notes

- Keep edits small and local. Avoid broad refactors unless explicitly requested.
- Follow the layered boundary contract exactly:
  - Routes -> Controllers -> Services -> Repositories -> Prisma.
- When changing request/response behavior, validate route middleware order in `src/routes/` and error flow in `src/controllers/base.controller.ts`.
- For schema changes, run both `pnpm prisma:migrate` and `pnpm prisma:generate`.
- Before finishing code changes, run `pnpm full-check` and the most relevant tests.

## References

- Shared agent guidance: [AGENTS.md](../AGENTS.md)
- Project overview: [README.md](../README.md)
- Contributor workflow: [CONTRIBUTING.md](../CONTRIBUTING.md)
