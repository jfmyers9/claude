---
name: review-implementation
description: Review code from recent implementation with clean context
allowed-tools: Task
argument-hint: "[state-file or slug]"
---

# Review Implementation Skill

Reviews code from `/implement` or `/next-phase` with clean context.
Reads state files to compare plan vs. actual.

## Find State File

Parse `$ARGUMENTS`:
- Path ending `.md` -> use directly
- Otherwise -> slug, find most recent
  `.jim/states/*-implemented-*{slug}*.md`
- No args -> most recent `.jim/states/*-implemented-*.md` by
  timestamp

## Extract Context

From state file: source exploration doc, files changed, what was
planned, what was implemented, tasks completed/failed, branch.

Spawn via Task:

```
Review implementation against plan.

## Context

State file: [insert absolute path to state file]
Source document: [insert absolute path to exploration doc]
Files changed: [insert list from state file]
Plan summary: [insert what was planned]
Implementation summary: [insert what was implemented]
Branch: [insert branch name]

## Read Source + Changed Files (parallel)

Read exploration doc + all files from "Files Changed". Note deleted
files.

## Review

Analyze each file:
- **Plan adherence**: matches plan? deviations justified? all features done?
- **Architecture**: follows patterns? complexity justified? simpler possible?
- **Code quality**: readable? edge cases? meaningful names? focused functions?
- **Standards**: style consistent? comments valuable? code smells?
- **Security/Performance**: issues? input validated? resource management?
- **Testing**: tests needed? edge cases tested?
- **Cross-file**: consistency, reuse, completeness

## Generate Review

Save to `.jim/notes/review-impl-{YYYYMMDD-HHMMSS}-{slug}.md`:

```markdown
# Implementation Review: {topic}

Reviewed: {ISO timestamp}
Implementation: {state file path}
Files Reviewed: {count}
Branch: {branch}

## Implementation Summary
**Planned:** {brief}  **Implemented:** {brief}  **Adherence:** {assessment}

## What's Working Well
- {Observation with file:line}

## Areas for Improvement
(Sections: Plan Adherence, Architecture, Code Quality, Standards,
Security/Perf. Each issue: file:line, description, WHY, suggestion.)

## Recommendations
| Priority | Item | Action |

## Ready to Commit?
**Assessment:** {Yes/No + reasoning}
```

**Persona**: Senior engineer mentoring. "I notice..." not "You did
wrong...". Explain WHY. Celebrate wins. Every critique needs
a suggestion. Respect project style: simple > clever.

## Return Value

Files reviewed, review path, overall assessment, priority counts,
ready-to-commit verdict, next steps.
```
