# CLAUDE.md

Claude-specific wrapper for this repository.

## Primary Source

Use [AGENTS.md](AGENTS.md) as the canonical instructions for architecture, coding rules, command usage, and scaffolding order.

## Claude-Specific Workflow

- Prefer skill-driven operations from `.claude/skills/` for repetitive multi-file tasks.
- Use a skill when request intent matches one of these workflows:
	- `/new-resource`
	- `/add-middleware`
	- `/add-test`
	- `/update-schema`
- When no skill matches, follow [AGENTS.md](AGENTS.md) directly.

## References

- Shared instructions: [AGENTS.md](AGENTS.md)
- Copilot wrapper: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Gemini wrapper: [GEMINI.md](GEMINI.md)
- Project documentation: [README.md](README.md)
