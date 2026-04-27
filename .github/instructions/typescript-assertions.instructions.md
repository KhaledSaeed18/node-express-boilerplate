---
description: "Use when editing TypeScript in src to avoid assertion-related lint/type regressions after merges. Prefer narrowing, type guards, satisfies, and as const/typeof over unsafe casts."
applyTo: "src/**/*.ts"
---
# TypeScript Assertion Safety

Follow this file when touching TypeScript in `src/` where merges can introduce assertion-heavy fixes.

## Rule

- Treat type assertions as a last resort.
- Prefer control-flow narrowing, user-defined type guards, `satisfies`, and `as const` + `typeof` derivation.
- Do not use double assertions (`as unknown as T`) unless there is no safe alternative and the boundary is documented.

## Preferred Patterns

- Runtime-to-type derivation:
  - Define constants with `as const`.
  - Derive unions with `typeof Obj[keyof typeof Obj]`.
- External input handling:
  - Validate and narrow first, then use strongly typed values.
- Framework interop edge cases (Express/Node APIs):
  - Use narrow casts on the smallest expression, not on wide objects.

## Merge-Fix Checklist

- Remove newly added broad casts and replace with narrowing where possible.
- Keep assertions local to integration boundaries.
- Ensure final code passes the project quality gate in [AGENTS.md](../../AGENTS.md).

## References

- Project-wide standards: [AGENTS.md](../../AGENTS.md)
- Copilot wrapper: [.github/copilot-instructions.md](../copilot-instructions.md)
- Assertion derivation examples: [.agents/skills/typescript-magician/rules/as-const-typeof.md](../../.agents/skills/typescript-magician/rules/as-const-typeof.md)
