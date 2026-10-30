---
name: update-cv
description: Update the LaTeX resume (cv/resume.tex) and rebuild public/static/resume.pdf. Use when asked to update, edit, refresh or tailor the CV/resume, add a role, project, skill or achievement to it, or when career data in src/config/experiences.ts changes.
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
argument-hint: '[what to change, e.g. "add the new role at X"]'
---

# Update the CV

The resume on karhdo.dev (nav → Resume, `/static/resume.pdf`) is built from **`cv/resume.tex`**. The PDF is a
committed build artifact: Vercel can't run LaTeX, so always rebuild and commit both files together.

## Steps

1. Read `cv/resume.tex` in full. Use its macros only:
   - `\role{Company}{Title}{Dates}{note}` for an employer;
   - `\project{Name}{one-line description}{Dates}` + `\stack{tools}` + `itemize` for a product under a role;
   - `\skill{Label}{items}` for skills and the projects/certificates lines.
2. Make the change. House rules:
   - Reverse-chronological. Dates as `Mon YYYY -- Mon YYYY` (or `-- Present`), matching `src/config/experiences.ts`.
     If they disagree, ask which one is right and fix both.
   - Bullets start with a past-tense verb, say what was built and why it mattered, and bold one key phrase at most.
     Keep numbers only if a source backs them (PRs, git history, the user).
   - **It's public.** No client-internal names (partners, people, Jira keys, internal repo or service names),
     incident counts, secrets or security weaknesses. Name the client product only if it's already on the site.
   - Escape `& % # _ $` as `\& \% \# \_ \$`; use `$\rightarrow$` for arrows and `$\sim$` for "about".
   - Colours stay the two Tokyonight Day tokens defined at the top (`accent`, `soft`).
3. Build: `bun run cv:build`. It uses `tectonic` from PATH, or downloads a pinned release into
   `node_modules/.cache/tectonic` (needs network the first time; packages are cached afterwards).
   Fix any LaTeX errors; `Overfull \hbox` under ~2pt is fine.
4. Check the result visually: `pdftoppm -r 80 -png public/static/resume.pdf <scratch>/cv` and read the PNGs.
   Aim for 2 pages at most, with no orphaned heading at a page break and no widowed one-word lines.
5. If the change is a role or product, offer to mirror it in `src/config/experiences.ts` and
   `src/components/career/experiences/*.astro` (the /career page), and vice versa.
6. Commit `cv/resume.tex` and `public/static/resume.pdf` together: `docs(cv): …`.
