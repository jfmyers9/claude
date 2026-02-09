---
name: next-phase
description: Continue to next phase of multi-phase implementation
allowed-tools: Task
argument-hint: "[slug or blank for latest active]"
---

# Next Phase Skill

Continue next phase of multi-phase implementation by reading active tracking
file + executing next task set.

## Agent Prompt

Spawn general-purpose agent via Task:

```
Continue to next phase of multi-phase implementation.

## Parse Arguments

Extract from $ARGUMENTS:
- `--review` flag: if present, run code review after phase
- Slug: tracking file slug

## Find Active Tracking File

If slug provided:
- Look for `.jim/states/active-{slug}.md`
- If not found, error + suggest `/implement`

If no slug:
- Find most recent `active-*.md` in `.jim/states/`
- If none, error + suggest `/implement`

## Read Tracking File

Parse to determine:
- Source exploration document path
- Complete phases (marked [x])
- Next phase (first uncompleted)
- Current branch name

## Verify State + Load Source (parallel)

**a) Verify git state:**
1. Check current branch = tracking file branch
   - If different: warn + note in tracking file
2. Check all phases complete
   - If yes: report "All phases completed!" + exit
   - Suggest `/commit`
3. ID next phase
   - Find first [ ] phase
   - Extract name + number

**b) Read source exploration document** from tracking file path

Find "Next Steps" + locate next phase:
- Match `**Phase N: Name**` or `### Phase N: Name`
- Extract phase tasks
- If not found: error + suggest `/continue-explore`

## Execute Phase Tasks

TaskCreate for each task:
- Clear subject, description, activeForm
- Concrete + verifiable steps

For each task in order:
1. TaskUpdate -> in_progress
2. Execute (read files, write code, run commands)
3. Verify success (syntax, quick tests)
4. TaskUpdate -> completed
5. If fails: stop, report error, leave in_progress

## Write State Files (parallel)

Update tracking file + implementation state file simultaneously.

## Update Active Tracking File

Update YAML frontmatter fields:
```yaml
phase: {N}
status: in_progress  # or "completed" if last phase
updated: "{ISO timestamp}"
```

Mark completed phase:
```markdown
- [x] Phase N: Name (completed 2026-01-30T22:30:00Z)
```

Update "Current State":
```markdown
Current Phase: N
Status: completed
Next Phase: N+1 (or "all complete" if last)
```

Add to "Implementation History":
```markdown
### Phase N (completed {ISO timestamp})

{summary of phase work}

Files changed:
- {path} - {description}
- (etc)

Tasks completed:
1. {subject} - {outcome}
2. (etc)

Tasks failed/skipped: {list or "None"}

Notes: {context}
```

If all complete: update status -> "completed"

## Write Implementation State File

Extract slug from `active-{slug}.md`
Generate timestamp YYYYMMDD-HHMMSS
Create: `.jim/states/{timestamp}-implemented-phase{N}-{slug}.md`
Use standard implementation state format (see /implement skill),
including YAML frontmatter with `type: implementation-state`,
`phase: {N}`, and other standard fields.

## Optional Post-Implementation Review

If `--review` flag:
1. Spawn review agent via Task
2. Review implementation state file
3. Run /review-implementation {state-file-path}
4. Return concise summary:
   - Code quality assessment
   - High priority issues
   - Ready to commit verdict
5. Include review summary + path in return

## Guidelines

- Follow the plan: execute phase as specified
- Stay focused: only do what phase specifies
- Be thorough: complete each step fully
- Don't commit: leave for user review
- Report clearly: summarize phase + file changes

## Return Value

- Phase completed (e.g., "Phase 2: Core Features")
- Summary of implementation
- Created/modified files list
- Issues encountered
- Path to active tracking + state files
- If phases remain: suggest `/next-phase`
- If complete: note finished + need `/commit`
- If reviewed: summary + path + verdict
- If not reviewed: reminder `/review-implementation` + path
- Note user should review before `/commit`
```

## Output

Display: phase summary, what implemented, changed files, next steps, review
reminder.
