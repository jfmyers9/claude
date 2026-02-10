---
name: team-build
description: |
  Spawn feature build team (architect, implementer, tester,
  reviewer). Pipeline: validate → build+spec → test → review →
  fix. Triggers: 'team build', 'build with team',
  'team implement'.
argument-hint: "<feature description or exploration doc path>"
allowed-tools:
  - Task
  - Skill
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - SendMessage
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - TeamCreate
  - TeamDelete
---

# Team Build

Pipeline: architect validates → builder + spec-writer parallel
→ tester fills + runs → reviewer → fix loop (max 1).

## Instructions

### 1. Parse Feature

- `$ARGUMENTS` is `.md` path → read exploration doc
- `$ARGUMENTS` is text → feature description
- No args → check `.jim/plans/` for most recent doc

### 2. Prepare Build Plan

From doc: extract Recommendation + Next Steps. From
description: break into steps, identify files, note tests
needed.

### 3. Create Team + Tasks

TeamCreate: `feature-build-{HHMMSS}`. TaskCreate 5 tasks
(all general-purpose subagent_type):

1. **Architecture sanity check** — design review before code
2. **Implement feature** — build following plan
3. **Write test specs** — stubs from plan (not implementation)
4. **Fill tests + run** — complete bodies + run suite
5. **Review implementation** — quality + correctness

Dependencies: 2←1, 3←1, 4←2+3, 5←4

### 4. Architect

Spawn **arch-check** (general-purpose): 2-min sanity check.
Report "APPROVED" (with notes) or "CRITICAL CONCERN" (with
details).

- Critical concern → pause, present to user
  (continue/adjust/abort)
- Architect fails → warn user, ask proceed or abort

### 5. Builder + Spec-Writer (parallel)

After approval, spawn both with `mode: "acceptEdits"`:

**builder** (general-purpose): Full plan + architect notes.
Report: implementation summary, files created/modified,
remaining concerns.

**spec-writer** (general-purpose): Feature description + plan
(NOT implementation). Create test files with signatures,
placeholder assertions, happy paths + edge cases + errors.
Report: test files, scenarios covered.

Track active agent names (`active_builder`,
`active_spec_writer`). On failure → retry once with fresh
agent (append `-retry`, update active name).
- Builder retry fails → abort pipeline
- Spec-writer retry fails → tester writes from scratch in
  step 6

### 6. Tester Fills Tests

Message `{active_spec_writer}`: read implementation, replace
placeholders, add tests from implementation, run suite,
report results.

Fails → retry once, then note "Tests incomplete".

### 7. Reviewer

Spawn **code-reviewer** (general-purpose): review quality,
error handling, test coverage, conventions, security. Report
issues table (severity: Critical/High/Medium/Low + file +
suggestion).

Fails → note "Review skipped", suggest manual review.

### 8. Fix Loop (max 1)

If critical/high issues: message `{active_builder}` to fix →
`{active_spec_writer}` to re-run → **code-reviewer** to
re-review. Issues remain after 1 fix → note in report.

### 9. Synthesize

Save to `.jim/notes/team-build-{YYYYMMDD-HHMMSS}-{slug}.md`:

- Feature description
- Architecture result
- Implementation summary + files
- Test summary + results
- Review findings (priority table)
- Iteration summary
- Failures (if any)
- Status (ready/needs fixes)

### 10. Shutdown + Present

Shutdown all → TeamDelete. Present:
- What was built
- Architecture result
- Files changed
- Test results
- Review summary
- Report path
- Next steps
