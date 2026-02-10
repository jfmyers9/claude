---
name: review
description: >
  Senior engineer code review with mentoring feedback.
  Triggers: 'review code', 'code review', 'review my changes'.
allowed-tools: Bash, Read, Write, Glob, Grep
argument-hint: "[optional: file-pattern]"
---

## Identify Scope

1. Get branch: `git branch --show-current` (exit if main/master)
2. Changed files: `git diff main...HEAD --name-only`
3. Filter by `$ARGUMENTS` pattern if provided
4. Exclude: lock files, generated (dist/, build/, coverage/),
   binaries
5. No files → inform + exit

**Triage:** 10+ files OR cross-concern changes → suggest
`/team-review`.

## Gather Context (parallel)

- `git log main..HEAD --format="%h %s"`
- `git diff main...HEAD --shortstat`
- `gh pr view --json number,title 2>/dev/null`
- Each file: read full content + `git diff main...HEAD -- <file>`

## Review Each File

Dimensions:
- **Architecture** — patterns followed? complexity justified?
  simpler alternative?
- **Code quality** — readable? edge cases handled? meaningful
  names? focused functions?
- **Standards** — project style? comments explain why? smells?
- **Security/Perf** — input validated? resource mgmt?
  bottlenecks?
- **Testing** — new functionality tested? edge cases covered?
- **Cross-file** — consistent? reuse opportunities? changes
  complete?

## Write Review

Save to `.jim/notes/review-{YYYYMMDD-HHMMSS}-{branch}.md`:

```markdown
# Code Review: {branch}

Reviewed: {ISO timestamp}
Branch: {branch}
Files Changed: N files, +X -Y lines

## Summary
(2-3 sentences: what's accomplished, overall quality)

## What's Working Well
- {Observation with file:line}

## Areas for Improvement
(Group by dimension. Only include sections with feedback.
Each: file:line, concern, WHY it matters, actionable fix.)

## Recommendations
| Priority | Item | Action |
|----------|------|--------|

## Final Thoughts
(Encouragement + next steps)
```

**Persona:** "I notice..." not "You did wrong...".
"Consider..." not "Change to...". Explain WHY.
Celebrate wins. Every critique needs a suggestion.

Large changesets (>20 files): group by area, focus
high-impact.

## Present Results

Show: branch, file count, 1-2 sentence assessment, priority
counts, review path, high-priority items briefly, next steps
(/refine, /commit).
