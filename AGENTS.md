# Git Commit Rules

When creating or suggesting Git commits, ALWAYS follow Conventional Commits.

Format:

<type>(<optional scope>): <description>

Allowed types:
- feat
- fix
- docs
- style
- refactor
- perf
- test
- build
- ci
- chore
- revert

Rules:
- Use lowercase for the type.
- Use imperative mood in the description.
- Keep the subject concise, preferably under 72 characters.
- Do not add a period at the end of the subject.
- Use a scope when it meaningfully identifies the affected component.
- For breaking changes, use `!` after the type/scope and explain the breaking change in the body.
- Never invent a commit type outside the allowed list.

Examples:
- feat(auth): add Google OAuth login
- fix(api): handle missing user ID
- refactor(db): simplify connection handling
- docs: update API authentication guide

Before suggesting a commit message, inspect the changes and choose the type based on what actually changed.