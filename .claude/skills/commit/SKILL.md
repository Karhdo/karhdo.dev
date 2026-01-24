---
name: commit
description: Create a git commit following Conventional Commits format
user-invocable: true
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Grep
argument-hint: '[optional: scope or message]'
---

# Git Commit with Conventional Commits

Create a well-structured git commit following the Conventional Commits specification.

## Conventional Commits Format

```
<type>(<scope>): <subject>

[optional body]
```

**Example**: `feat(auth): add OAuth2 login support`

## Commit Types

| Type       | Description                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| `feat`     | A new feature                                                                |
| `fix`      | A bug fix                                                                    |
| `docs`     | Documentation only changes                                                   |
| `style`    | Changes that do not affect the meaning of the code (white-space, formatting) |
| `refactor` | A code change that neither fixes a bug nor adds a feature                    |
| `perf`     | A code change that improves performance                                      |
| `test`     | Adding missing tests or correcting existing tests                            |
| `build`    | Changes that affect the build system or external dependencies                |
| `ci`       | Changes to CI configuration files and scripts                                |
| `chore`    | Other changes that don't modify src or test files                            |
| `revert`   | Reverts a previous commit                                                    |

## Rules

1. **Subject line**:
   - Use imperative mood ("add" not "added" or "adds")
   - Do not capitalize the first letter
   - No period at the end
   - Keep it concise but descriptive

2. **Body** (optional):
   - Separate from subject with a blank line
   - Wrap at 72 characters
   - Explain "what" and "why", not "how"

3. **Breaking Changes**:
   - Add exclamation mark after type/scope, e.g. `feat(api)!: remove deprecated endpoints`
   - Or add `BREAKING CHANGE:` in footer

## Process

1. Run `git status` to see all changes (never use `-uall` flag)
2. Run `git diff --staged` and `git diff` to understand the changes
3. Analyze the changes and determine:
   - The appropriate commit type
   - The scope (if applicable)
   - A concise subject describing the change
4. If there are untracked files that should be committed, stage them with `git add <specific-files>`
5. Create the commit with proper formatting
6. Show the result with `git log -1`

## Examples

```bash
# Feature
git commit -m "feat(auth): add OAuth2 login support"

# Bug fix
git commit -m "fix(api): resolve null pointer in user service"

# Breaking change
git commit -m "feat(api)!: change response format for /users endpoint"

# With body
git commit -m "refactor(components): extract common button styles

Move shared button styles to a dedicated module to reduce duplication
across multiple components."
```

## Arguments

If `$ARGUMENTS` is provided:

- If it looks like a commit message, use it directly (validate format first)
- If it's a scope hint, use it to focus the analysis

## Important

- NEVER use `git add -A` or `git add .` - always add specific files
- NEVER commit sensitive files (.env, credentials, secrets)
- NEVER amend previous commits unless explicitly requested
- ALWAYS create a NEW commit, not amend existing ones
- Use HEREDOC format for multi-line commit messages:

```bash
git commit -m "$(cat <<'EOF'
type(scope): subject

body text here
EOF
)"
```
