---
name: team-explore
description: Spawn a deep research team (researcher, architect, devil)
argument-hint: "<topic to explore>"
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

# Team Explore

Spawn three specialists to explore topic from multiple angles, synthesize findings into comprehensive document.

## Instructions

### 1. Parse Topic

Extract exploration topic from `$ARGUMENTS`. If missing, ask user what to explore + exit.

### 2. Create Team

Generate timestamp (HHMMSS format, e.g. `162345`). Create team named `deep-explore-{HHMMSS}` via TeamCreate to avoid collisions.

Report: "Exploration team created. 3 specialists investigating..."

### 3. Create Tasks

TaskCreate three tasks:

1. **Broad context gathering** → researcher: Find all relevant code, config, docs, dependencies
2. **Architecture analysis** → architect: Structural + design aspects
3. **Challenge assumptions** → devil: Risks, edge cases, hidden problems

### 4. Spawn Teammates

- **explorer** (general-purpose): Cast wide net. Search files (Glob+Grep), read docs, trace code paths, check dependencies. Report: files, patterns, implementations, docs organized by relevance
- **design-analyst** (general-purpose): Analyze architecture. Identify patterns, evaluate structure, map boundaries+interfaces, assess coupling/cohesion. Report: observations, pattern analysis, structural recommendations
- **challenger** (general-purpose): Think failure modes. Identify assumptions, edge cases, security/performance concerns, challenge obvious approaches. Report: specific concerns, alternatives, risks

Include in each prompt:
- Full exploration topic
- Reminder: others exploring different angles (avoid redundancy)
- Send findings via SendMessage

### 5. Coordinate + Collect

Wait for all three to report. Note connections between discoveries.

**Failure handling**: If a specialist fails (error message, idle
without results after 2 prompts, reports cannot complete):
1. Send status check: "Status update? What progress so far?"
2. If no substantive response after second prompt, mark as failed
3. Continue with remaining specialists (min 1 must succeed)
4. Note missing perspective in synthesis (e.g., "Architecture
   analysis unavailable due to agent failure")

Report agent completions as they arrive:
"{agent} complete ({done}/3)."

After all: "All specialists complete. Synthesizing exploration doc..."

### 6. Synthesize Document

Create comprehensive exploration doc:

```markdown
# Exploration: [topic]

Explored: [ISO timestamp]
Team: researcher, architect, devil

## Original Request

[Topic as provided]

## Context Gathered

[From researcher's findings]

### Relevant Files
- [path:line] - [description]

### Existing Implementations
[Code + patterns related to topic]

### Dependencies
[Configs, external factors]

## Architecture Analysis

[From architect's findings]

### Current Structure
[How current architecture relates]

### Design Patterns
[Patterns + fit assessment]

### Structural Considerations
[Coupling, cohesion, boundaries]

## Risks & Challenges

[From devil's findings]

### Assumptions to Validate
[Assumptions needing verification]

### Edge Cases
[Failure modes to consider]

### Security & Performance
[Concerns raised]

## Requirements Analysis

### Explicit Requirements
[Clearly needed]

### Implicit Requirements
[Hidden requirements discovered]

### Open Questions
[Questions needing answers]

## Potential Approaches

[2-3 approaches from all perspectives]

### Approach 1: [name]
- **Overview**: [description]
- **Pros**: [benefits, cite architecture analysis]
- **Cons**: [drawbacks, cite devil's concerns]
- **Complexity**: low/medium/high
- **Risks**: [specific risks]

### Approach 2: [name]
[Same structure]

## Recommendation

[Which approach + why, all perspectives]

## Next Steps

[Concrete actions, structured with phase markers if warranted]
```

Save to `.jim/plans/{timestamp}-{topic-slug}.md`.

### 7. Shut Down Team

Send shutdown requests to all teammates. After confirmed, call TeamDelete.

### 8. Present Results

Display to user:
- Brief summary (2-3 sentences, all perspectives)
- Recommendation (1 sentence)
- Count of open questions/risks
- Path to full document
- Suggest next: `/implement` to execute, or address open questions first
