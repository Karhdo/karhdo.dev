---
name: pull-request
description: Create a draft GitHub pull request following the project template
user-invocable: true
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Grep
argument-hint: '[optional: PR title or target branch]'
---

# Create GitHub Pull Request

Create a draft pull request using `gh` CLI, following the project's pull_request_template.md format.

## Process

1. Run these commands in parallel to understand the current state:
   - `git status` to see all changes (never use `-uall` flag)
   - `git branch --show-current` to get current branch name
   - `git log origin/main..HEAD --oneline` to see commits that will be in the PR
   - `git diff origin/main...HEAD --stat` to see changed files summary

2. Read the PR template from `.github/pull_request_template.md`

3. Check if the current branch tracks a remote:
   - If not, push with `-u` flag: `git push -u origin <branch-name>`

4. Analyze all commits and changes, then fill in the template sections:
   - **Summary (Why/What/Solution)**: Based on commit messages and diffs
   - **Impact Area**: List affected features/components
   - **Types of Changes**: Mark `[x]` for applicable types based on commits
   - **Test Plan**: Suggest testing steps
   - **Checklist**: Pre-check applicable items
   - **Related Issues**: Leave empty or fill if mentioned in commits

5. Create the draft PR using HEREDOC format:

```bash
gh pr create --draft --title "type(scope): description" --body "$(cat <<'EOF'
<filled template content here>
EOF
)"
```

## PR Title Convention

Use Conventional Commits format:

| Type       | Description                                               |
| ---------- | --------------------------------------------------------- |
| `feat`     | A new feature                                             |
| `fix`      | A bug fix                                                 |
| `docs`     | Documentation only changes                                |
| `style`    | Changes that do not affect the meaning of the code        |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `perf`     | A code change that improves performance                   |
| `build`    | Changes that affect the build system or external deps     |
| `ci`       | Changes to CI configuration files and scripts             |
| `chore`    | Other changes that don't modify src or test files         |

## Mapping Commit Types to PR Types

When filling "Types of Changes" section:

- `feat` → 🚀 New feature
- `fix` → 🕷 Bug fix
- `perf` → 👏 Performance optimization
- `refactor` → 🛠 Refactor
- `docs` → 📝 Documentation
- `test` → ✅ Test
- `build`, `chore` with deps → 📗 Library update

## Arguments

If `$ARGUMENTS` is provided:

- If it looks like a PR title, use it directly
- If it looks like a branch name (e.g., `main`, `develop`), use it as base branch with `--base`

## Options

Common `gh pr create` options:

- `--base <branch>`: Target branch (default: main)
- `--assignee @me`: Assign to yourself
- `--label <name>`: Add labels
- `--reviewer <handle>`: Request reviewers

## Important

- ALWAYS read `.github/pull_request_template.md` first to get the current template format
- ALWAYS create PR as draft using `--draft` flag
- ALWAYS check that you're on the correct branch before creating PR
- NEVER create PR from `main` or `master` branch
- ALWAYS ensure changes are pushed to remote before creating PR
- Remove HTML comments (`<!-- -->`) from the filled template
- Return the PR URL when done so the user can review and publish when ready
