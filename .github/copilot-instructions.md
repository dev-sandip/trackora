# Git Commit Message Rules

When generating a Git commit message, ALWAYS follow Conventional Commits.

Format:
<type>(optional-scope): <description>

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

- Use lowercase type names.
- Use an optional scope in parentheses.
- Add a colon followed by one space.
- Write a concise description after the colon.
- Use the ! suffix before the colon for breaking changes.
- Generate only the commit subject line.
- Do not include Markdown, quotes, or explanations.
- Never generate a message that violates this format.

Valid examples:
feat: add user authentication
fix(api): handle invalid token
docs: update README
refactor(database): simplify connection
feat(auth)!: remove legacy authentication
