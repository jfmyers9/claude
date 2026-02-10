---
name: review
description: Senior engineer code review with mentoring feedback
allowed-tools: Bash, Read, Write, Glob, Grep
argument-hint: "[optional: file-pattern]"
---

# Code Review Skill

Senior engineer review with mentoring tone. Explains "why" behind
recommendations, balances critique with encouragement.

## Instructions

1. **Identify scope**:
   - Branch: `git branch --show-current` (exit if main/master)
   - Changed files: `git diff main...HEAD --name-only`
   - Filter by `$ARGUMENTS` pattern if provided
   - Exclude: lock files, generated (dist/, build/, coverage/), binaries
   - No files → inform + exit

2. **Gather context** (parallel):
   - Git: `git log main..HEAD --format="%h %s"`, `git diff main...HEAD --shortstat`, `gh pr view --json number,title 2>/dev/null`
   - Each file: read entirely + read diff (`git diff main...HEAD -- <file>`)

3. **Review each file** across these dimensions:
   - Architecture: follows patterns? complexity justified? simpler possible?
   - Code quality: readable? edge cases? meaningful names? focused functions?
   - Standards: project style? comments explain why? code smells?
   - Security/Performance: input validated? resource management? bottlenecks?
   - Testing: tests for new functionality? edge cases tested?
   - Cross-file: consistency? reuse opportunities? changes complete?

4. **Generate review** at `.jim/notes/review-{YYYYMMDD-HHMMSS}-{sanitized-branch}.md`:

   ```markdown
   # Code Review: [branch]

   Reviewed: [ISO timestamp]
   Branch: [branch]
   Files Changed: N files, +X -Y lines

   ## Summary
   (2-3 sentences: what's accomplished, overall quality)

   ## What's Working Well
   - [Specific observation with file:line]

   ## Areas for Improvement
   (Group by: Architecture, Code Quality, Standards, Security/Perf.
   Only include sections with feedback. Each issue: file:line,
   concern, WHY it matters, actionable fix.)

   ## Recommendations
   | Priority | Item | Action |
   |----------|------|--------|

   ## Final Thoughts
   (Encouragement + next steps)
   ```

   **Persona**: "I notice..." not "You did wrong...".
   "Consider..." not "Change to...". Explain WHY. Celebrate wins.

   Large changesets (>20 files): group by area, focus high-impact.

5. **Present**: branch, file count, 1-2 sentence assessment,
   priority counts, review path, high items briefly, next steps
   (/refine, /commit).

## Triage

20+ files or multiple subsystems → suggest `/team-review`.
