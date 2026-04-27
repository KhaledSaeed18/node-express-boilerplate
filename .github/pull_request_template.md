# Pull Request

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Dependency update

## Summary

<!-- What does this PR do and why? Keep it concise. -->

## Related Issues

<!-- Link related issues. Use "Fixes #123" to auto-close on merge. -->

- Fixes #
- Related to #

## Implementation Notes

<!-- Any non-obvious decisions, trade-offs, or context a reviewer needs to understand the changes. -->

## Testing

<!-- Describe how these changes were tested. -->

- [ ] Manually tested against a local PostgreSQL instance
- [ ] Verified with Postman / curl — request/response examples attached if relevant
- [ ] Database migrations run cleanly (`pnpm prisma:migrate`)
- [ ] No regressions in existing endpoints

## Pre-merge Checklist

- [ ] `pnpm full-check` passes (format, lint, type-check)
- [ ] Prisma client regenerated if schema changed (`pnpm prisma:generate`)
- [ ] `.env.example` updated if new environment variables were added
- [ ] No secrets, tokens, or credentials committed
- [ ] Error paths throw the appropriate custom error class (not `res.status(...).json(...)`)
