---
name: team
description: |
  Compose dynamic team for any task. Auto-detect orchestration
  pattern (solo/fan-out/pipeline) based on agents selected.
  Triggers: 'team', 'spawn team', 'dynamic team'.
argument-hint: "<task description> [--agents agent1,agent2,...]"
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

# Team

Compose dynamic team for any task. Auto-detects orchestration
pattern based on agent roles.

## Instructions

### 1. Parse Arguments

Extract task description + optional `--agents agent1,agent2,...`

Valid agents (max 6): researcher, reviewer, architect,
implementer, tester, devil.

Auto-select if no `--agents`:

| Keywords | Agents |
|----------|--------|
| explore, research, find, understand | researcher, architect, devil |
| review, check, audit | reviewer, architect, devil |
| debug, fix, investigate | researcher x3 |
| build, implement, create, add | architect, implementer, tester, reviewer |
| *(fallback)* | researcher, architect |

### 2. Classify Pattern

All agents use subagent_type `general-purpose`. Role via prompt.

| Write-capable (mode: acceptEdits) | Read-only |
|---|---|
| implementer, tester | researcher, reviewer, architect, devil |

- **Solo**: 1 agent
- **Fan-out**: all read-only
- **Pipeline**: >=1 write-capable

### 3. Create Team

TeamCreate: `team-{HHMMSS}`. Report pattern + agents to user.

### 4. Execute Pattern

#### Solo

1. TaskCreate → spawn **solo-agent**
2. Wait for completion. Present output directly.
3. Save to `.jim/notes/team-{YYYYMMDD-HHMMSS}-{slug}.md`
4. Shutdown → TeamDelete

#### Fan-out

1. TaskCreate 1 per agent (independent)
   - Prompt framing by role: researcher (find code/deps),
     architect (evaluate structure/patterns), devil (find
     risks/edge cases), reviewer (assess quality/practices)
   - Duplicates: number them, differentiate by angle
   - Each reports: Findings, Assessment, Recommendations
2. Wait all. Report completions as they arrive.
3. Synthesize: combined analysis, agreements, disagreements,
   recommendations
4. Save to `.jim/notes/team-{YYYYMMDD-HHMMSS}-{slug}.md`
5. Present: brief summary, key findings per agent,
   recommendations
6. Shutdown all → TeamDelete

#### Pipeline

Classify agents into phases:
1. **Analysts** (read-only): researcher, architect, devil
2. **Builders** (write): implementer, tester
3. **Reviewers**: reviewer

Empty analysts → skip Phase 1. No reviewer → skip Phase 3.

**Phase 1 — Analysis**: Spawn analysts parallel (fan-out).
Compile summary for builders. Min 1 must succeed.

**Phase 2 — Build**: Spawn builders sequential if >1
(implementer → tester). Each gets task + Phase 1 summary.
Retry once on failure. Implementer failure blocks tester.

**Phase 3 — Review** (if reviewer): Spawn reviewer with task
+ Phase 1 summary + Phase 2 results. Failure → note "Review
skipped".

Save to `.jim/notes/team-{YYYYMMDD-HHMMSS}-{slug}.md`: task,
Phase 1 findings, Phase 2 results (files, implementation,
tests), Phase 3 review, failures, summary, recommendations.

Present: accomplishment per phase, files changed, review
findings, report path. Shutdown all → TeamDelete.

### 5. Failure Handling

- **Solo**: report failure + partial output, suggest re-run
- **Fan-out**: continue with remaining (min 1), note gap in
  synthesis
- **Pipeline**: retry builder once (fresh agent, same prompt +
  "Previous attempt failed. Start fresh."). If retry fails,
  proceed without. Implementer failure blocks tester.

Detecting failure: error message, idle without results after
2 prompts, reports cannot complete.

Always prefer partial results over total failure. Include
`## Failures` section in report.
