---
name: team
description: Compose a dynamic team of agents for any task
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

# Team Skill

Compose dynamic team of agents for any task. Auto-detects orchestration
pattern based on agent capabilities.

## Instructions

### 1. Parse Arguments

Extract task description + agent list from `$ARGUMENTS`.

**`--agents` flag:**
- Look for `--agents` followed by comma-separated agent names (no spaces)
- Valid: `researcher`, `reviewer`, `architect`, `implementer`, `tester`, `devil`
- Strip `--agents ...` portion; remainder = task description
- Remove surrounding quotes from task description

**Auto-select if no `--agents`:**

| Keywords | Agents |
|----------|--------|
| explore, research, find, understand | researcher, architect, devil |
| review, check, audit | reviewer, architect, devil |
| debug, fix, investigate | researcher, researcher, researcher |
| build, implement, create, add | architect, implementer, tester, reviewer |
| *(fallback)* | researcher, architect |

Match first pattern. Use fallback if no keywords match.

**Validate:**
- Check names against valid set
- If unknown: warn "Unknown agent: {name}. Valid: researcher, reviewer, architect, implementer, tester, devil." + exit
- Max 6 agents; warn + exit if exceeded

Exit if no task description found; ask user to provide one.

### 2. Classify + Choose Pattern

| Agent | Write? |
|-------|--------|
| researcher | No |
| reviewer | No |
| architect | No |
| devil | No |
| implementer | Yes (acceptEdits) |
| tester | Yes (Write, Edit) |

Patterns:
- **Solo**: Exactly 1 agent
- **Fan-out**: All read-only (no write agents)
- **Pipeline**: ≥1 write-capable agent

### 3. Generate Team Name

Team name: `team-{HHMMSS}` (e.g., `team-143052`)

### 4. Execute Pattern

Follow instructions for pattern from step 2.

---

## Solo Pattern (1 agent)

Minimal overhead. Spawn one agent directly.

1. TeamCreate with team name from step 3
2. TaskCreate with full task description
3. Spawn mate **solo-agent** (subagent_type: agent type)
   - Give full task description
   - Instruct to work thoroughly + send findings via SendMessage
   - Wait for completion
4. Present agent output directly to user
5. Save to `.jim/notes/team-{HHMMSS}-{slug}.md`
   - `{slug}` = short kebab-case summary (max 5 words)
6. Shut down mate + cleanup team

---

## Fan-Out Pattern (all read-only)

Parallel analysis. All agents work same task, own perspective.
Synthesize into unified report.

1. TeamCreate with team name
2. TaskCreate: 1 task per agent (independent, no dependencies)
   - **researcher**: "Research + gather context for: {task}. Find relevant code,
     trace dependencies, report w/ file paths + line numbers."
   - **architect**: "Analyze architecture + design implications of: {task}.
     Evaluate structure, patterns, coupling, tradeoffs."
   - **devil**: "Challenge assumptions + find risks in: {task}. Identify
     edge cases, failure modes, hidden problems."
   - **reviewer**: "Review + assess quality aspects of: {task}. Focus:
     readability, error handling, best practices, security."
   - If duplicates (e.g. 3 researchers): differentiate by angle/area.
     Number: "researcher-1", "researcher-2", etc.
3. Spawn all mates parallel. Each:
   - Name: `{agent-type}-agent` or `{agent-type}-agent-{N}` (duplicates)
   - subagent_type: agent type
   - Prompt: task description + framing + SendMessage instructions
4. Wait for ALL to complete
5. Synthesize findings into report:
   ```markdown
   # Team Report: [task summary]
   Completed: [ISO timestamp]
   Team: [comma-separated agent types]
   Pattern: fan-out (parallel)
   ## Task
   [original task]
   ## Findings
   ### [Agent type]: [name]
   [findings]
   ## Synthesis
   [Combined analysis from all perspectives. Agreements, disagreements, key insights.]
   ## Recommendations
   [Actionable next steps]
   ```
6. Save to `.jim/notes/team-{HHMMSS}-{slug}.md`
7. Present user:
   - Brief summary (2-3 sentences)
   - Key findings ea. agent (1-2 bullets)
   - Recommendations + report path
8. Shutdown mates + cleanup

---

## Pipeline Pattern (mixed read/write)

Read-only analyze parallel, then write-capable act sequential (>1),
optional review pass after.

### Classify Agent List

Split into 3 groups:
1. **Analysts** (read-only): researcher, architect, devil
2. **Builders** (write-capable): implementer, tester
3. **Reviewers** (review-specific): reviewer

Reviewer → Reviewers group. Other read-only → Analysts.
No reviewer = skip review phase.
Empty Analysts = skip Phase 1, go to Phase 2.

### Create Team + Tasks

TeamCreate with team name.

**Phase 1 tasks** (1 per analyst, independent):
- Use fan-out framing + add: "Your analysis informs implementation.
  Focus on actionable insights."

**Phase 2 tasks** (1 per builder, sequential if >1):
- **implementer**: "Implement based on analysis: {task}.
  Follow analysts' guidance + recommendations."
- **tester**: "Write + run tests for: {task}. Use analysts'
  findings to cover edge cases."
- If both: tester task depends on implementer task

**Phase 3 task** (if reviewer):
- "Review implementation + tests for: {task}.
  Assess quality, correctness, completeness."
- Depends on all Phase 2 tasks

Dependencies:
- Phase 2 blocked by all Phase 1 tasks
- Phase 3 blocked by all Phase 2 tasks

### Phase 1: Analysis

1. Spawn all analysts parallel (same as fan-out)
2. Wait for ALL. Collect findings.
3. Compile analysis summary → pass to builders

### Phase 2: Build

1. If >1 builder: spawn sequential (implementer first → tester)
   to avoid conflicts. If 1 builder: just spawn.
2. Each builder prompt:
   - Full task description
   - Compiled Phase 1 analysis summary
   - Builder-specific framing
   - SendMessage instructions
3. Wait for ALL. Collect results.

### Phase 3: Review (if reviewer)

1. Spawn reviewer with:
   - Full task description
   - Phase 1 analysis summary
   - Phase 2 build results
   - Review for quality + correctness instructions
2. Wait. Collect findings.

### Synthesize + Report

```markdown
# Team Report: [task summary]

Completed: [ISO timestamp]
Team: [comma-separated agent types]
Pattern: pipeline (analysis → build → review)

## Task
[original task]

## Phase 1: Analysis
[Compiled analyst findings organized by agent]

## Phase 2: Build
[Builder results -- files created/modified, implementation summary, test results]

## Phase 3: Review
[Reviewer findings, or "No reviewer in team. Skipped."]

## Summary
[Overall outcome. What analyzed, built, reviewed. Issues + status.]

## Recommendations
[Next steps based on pipeline outcome]
```

1. Save to `.jim/notes/team-{HHMMSS}-{slug}.md`
2. Present user:
   - Accomplishment ea. phase (1-2 sentences)
   - Files created/modified
   - Review findings
   - Report path + suggested next steps
3. Shutdown mates + cleanup
