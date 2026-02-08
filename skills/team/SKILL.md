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

Compose a dynamic team of agents for any task. Automatically
detects the best orchestration pattern based on agent capabilities.

## Instructions

### 1. Parse Arguments

Parse `$ARGUMENTS` to extract the task description and agent list.

**Extract `--agents` flag:**
- Look for `--agents` followed by a comma-separated list of
  agent names (no spaces around commas)
- Valid agents: `researcher`, `reviewer`, `architect`,
  `implementer`, `tester`, `devil`
- Strip the `--agents ...` portion from the arguments; the
  remainder is the task description
- Remove surrounding quotes from the task description if present

**If no `--agents` flag**, auto-select agents based on task
keywords:

| Keywords in task | Agents |
|------------------|--------|
| explore, research, find, understand | researcher, architect, devil |
| review, check, audit | reviewer, architect, devil |
| debug, fix, investigate | researcher, researcher, researcher |
| build, implement, create, add | architect, implementer, tester, reviewer |
| *(fallback)* | researcher, architect |

Match the first keyword pattern that fits. Use the fallback
only if no keywords match.

**Validate agents:**
- Check each name against the valid set above
- If any name is unknown, warn the user ("Unknown agent:
  {name}. Valid agents: researcher, reviewer, architect,
  implementer, tester, devil.") and exit
- Enforce a maximum of 6 agents. If more than 6 are
  specified, warn and exit

If no task description is found after parsing, ask the user
to provide one and exit.

### 2. Classify Agents and Choose Pattern

Classify each agent by write capability:

| Agent | Write-capable? |
|-------|---------------|
| researcher | No |
| reviewer | No |
| architect | No |
| devil | No |
| implementer | Yes (acceptEdits) |
| tester | Yes (Write, Edit) |

Count the agents and determine the orchestration pattern:

- **Solo pattern**: Exactly 1 agent
- **Fan-out pattern**: All agents are read-only (no write-capable agents)
- **Pipeline pattern**: At least one agent is write-capable

### 3. Generate Team Name

Get the current time in `HHMMSS` format. The team name is
`team-{HHMMSS}` (e.g., `team-143052`).

### 4. Execute the Chosen Pattern

Follow the instructions for the pattern determined in step 2.

---

## Solo Pattern (1 agent)

No team overhead. Just spawn one agent directly.

### Solo: Create the Team

Use TeamCreate with the team name from step 3.

### Solo: Create Task and Spawn

Create one task with TaskCreate describing the full task.

Spawn one teammate:
- **solo-agent** (subagent_type: the agent's type): Give it
  the full task description. Tell it to work through the task
  thoroughly and send its findings or results back via
  SendMessage.

Wait for it to complete.

### Solo: Collect and Report

Take the agent's output and present it directly to the user.

Save to `.jim/notes/team-{timestamp}-{slug}.md` where
`{timestamp}` is `HHMMSS` and `{slug}` is a short
kebab-case summary of the task (max 5 words).

Shut down the teammate and clean up the team.

---

## Fan-Out Pattern (all read-only)

All agents work in parallel on the same task, each from their
own perspective. Results are synthesized into a unified report.

### Fan-out: Create the Team

Use TeamCreate with the team name from step 3.

### Fan-out: Create Tasks

Create one task per agent with TaskCreate. Each task is
independent (no dependencies). Frame each task around the
agent's specialty:

- **researcher**: "Research and gather context for: {task}.
  Find relevant code, trace dependencies, and report with
  file paths and line numbers."
- **architect**: "Analyze the architecture and design
  implications of: {task}. Evaluate structure, patterns,
  coupling, and tradeoffs."
- **devil**: "Challenge assumptions and find risks in: {task}.
  Identify edge cases, failure modes, and hidden problems."
- **reviewer**: "Review and assess quality aspects of: {task}.
  Focus on readability, error handling, best practices, and
  security."

If the same agent type appears multiple times (e.g., three
researchers), differentiate their tasks. For researchers,
assign each a different angle or area to investigate.
Number them: "researcher-1", "researcher-2", etc.

### Fan-out: Spawn All Agents in Parallel

Spawn all teammates at the same time. For each agent:
- Name: `{agent-type}-agent` (or `{agent-type}-agent-{N}`
  if duplicates)
- subagent_type: the agent's type
- Prompt: Include the full task description, their specific
  framing from above, and instructions to send findings via
  SendMessage

Wait for ALL agents to complete.

### Fan-out: Synthesize and Report

After all agents report back, synthesize their findings:

```markdown
# Team Report: [task summary]

Completed: [ISO timestamp]
Team: [comma-separated agent types]
Pattern: fan-out (parallel)

## Task

[The original task description]

## Findings

### [Agent 1 type]: [agent name]

[Synthesized findings from this agent]

### [Agent 2 type]: [agent name]

[Synthesized findings from this agent]

### [Agent N type]: [agent name]

[Synthesized findings from this agent]

## Synthesis

[Combined analysis drawing from all perspectives.
Highlight agreements, disagreements, and key insights
that emerge from cross-referencing the findings.]

## Recommendations

[Actionable next steps based on the combined findings.]
```

Save to `.jim/notes/team-{timestamp}-{slug}.md`.

Present to the user:
- Brief summary (2-3 sentences)
- Key findings from each agent (1-2 bullets each)
- Recommendations
- Path to the full report

Shut down all teammates and clean up the team.

---

## Pipeline Pattern (mixed read/write)

Read-only agents analyze first (in parallel), then
write-capable agents act (sequentially if >1), then an
optional review pass.

### Pipeline: Classify the Agent List

Split agents into three groups:

1. **Analysts** (read-only): researcher, architect, devil
2. **Builders** (write-capable): implementer, tester
3. **Reviewers** (read-only, review-specific): reviewer

A reviewer goes into the Reviewers group (for the final
review phase). All other read-only agents go into Analysts.
If no reviewer is in the agent list, the Reviewers group is
empty and the review phase is skipped.

If the Analysts group is empty (e.g., user only specified
implementer + tester), skip Phase 1 and go straight to
Phase 2.

### Pipeline: Create the Team

Use TeamCreate with the team name from step 3.

### Pipeline: Create Tasks

Create tasks for each phase:

**Phase 1 tasks** (one per analyst, all independent):
- Frame each analyst's task the same way as in the fan-out
  pattern, but add: "Your analysis will inform the
  implementation that follows. Focus on actionable insights."

**Phase 2 tasks** (one per builder, sequential dependencies
if >1 builder):
- **implementer**: "Implement the following based on the
  analysis provided: {task}. Follow the analysts' guidance
  and recommendations."
- **tester**: "Write and run tests for: {task}. Use the
  analysts' findings to ensure edge cases are covered."
- If both implementer and tester are present, make the
  tester's task depend on the implementer's task (the tester
  needs code to exist before testing it).

**Phase 3 task** (if reviewer is present):
- "Review the implementation and tests for: {task}. Assess
  quality, correctness, and completeness."
- Depends on all Phase 2 tasks.

Set up dependencies:
- Phase 2 tasks blocked by all Phase 1 tasks
- Phase 3 task blocked by all Phase 2 tasks

### Pipeline: Phase 1 -- Analysis

Spawn all analyst agents in parallel (same as fan-out).

Wait for ALL analysts to complete. Collect their findings.

Compile an analysis summary combining all analyst outputs.
This summary will be passed to builders.

### Pipeline: Phase 2 -- Build

Spawn builder agents. If there is more than one builder,
spawn them sequentially (implementer first, then tester)
to avoid file conflicts. If there is only one builder,
just spawn it.

Include in each builder's prompt:
- The full task description
- The compiled analysis summary from Phase 1
- Their specific builder framing
- Instructions to send results via SendMessage

Wait for ALL builders to complete. Collect their results.

### Pipeline: Phase 3 -- Review (if reviewer present)

Spawn the reviewer agent with:
- The full task description
- The analysis summary from Phase 1
- The build results from Phase 2
- Instructions to review for quality and correctness

Wait for the reviewer to complete. Collect review findings.

### Pipeline: Synthesize and Report

```markdown
# Team Report: [task summary]

Completed: [ISO timestamp]
Team: [comma-separated agent types]
Pattern: pipeline (analysis -> build -> review)

## Task

[The original task description]

## Phase 1: Analysis

[Compiled findings from all analyst agents, organized
by agent]

## Phase 2: Build

[Results from builder agents -- files created/modified,
implementation summary, test results]

## Phase 3: Review

[Review findings, if reviewer was present. Otherwise:
"No reviewer in team. Skipped."]

## Summary

[Overall outcome. What was analyzed, built, and reviewed.
Any issues found and their status.]

## Recommendations

[Next steps based on the pipeline outcome.]
```

Save to `.jim/notes/team-{timestamp}-{slug}.md`.

Present to the user:
- What was accomplished at each phase (1-2 sentences each)
- Files created/modified (if any)
- Review findings (if any)
- Path to the full report
- Suggested next steps

Shut down all teammates and clean up the team.
