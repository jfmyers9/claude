---
name: team-explore
description: |
  Spawn deep research team (researcher, architect, devil) for
  complex exploration. Triggers: 'team explore', 'deep research',
  'multi-angle exploration'.
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

Three specialists explore topic from multiple angles →
synthesized exploration document.

## Instructions

### 1. Parse Topic

Extract from `$ARGUMENTS`. Missing → AskUserQuestion + exit.

### 2. Create Team + Tasks

TeamCreate: `deep-explore-{HHMMSS}`. TaskCreate 3 tasks:
1. Broad context gathering
2. Architecture analysis
3. Challenge assumptions

### 3. Spawn Teammates

All general-purpose, spawned in parallel. Each prompt includes:
topic, note that others explore different angles, SendMessage
instructions for reporting back.

- **explorer**: Cast wide net. Glob+Grep for files, read docs,
  trace code paths, check deps. Report: relevant files
  (path:line), existing implementations, dependencies, key
  findings.

- **design-analyst**: Analyze architecture. Patterns, structure,
  boundaries, coupling/cohesion. Report: current structure,
  design patterns, structural considerations, recommendations.

- **challenger**: Think failure modes. Assumptions, edge cases,
  security/performance concerns, challenge obvious approaches.
  Report: assumptions to validate, edge cases, concerns,
  alternative approaches.

### 4. Failure Handling

Status check after 2 idle prompts. Failed agent → note missing
perspective in synthesis. Continue with remaining (min 1 must
succeed). Report completions as they arrive.

### 5. Synthesize Document

Save to `.jim/plans/team-explore-{YYYYMMDD-HHMMSS}-{slug}.md`:

- Original request
- Context gathered (from explorer)
- Architecture analysis (from design-analyst)
- Risks + challenges (from challenger)
- Requirements (explicit, implicit, open questions)
- 2-3 approaches (overview, pros, cons, complexity, risks)
- Recommendation
- Next steps with phase markers

### 6. Shutdown + Present

Shutdown all → TeamDelete. Present:
- Brief summary (2-3 sentences)
- Recommendation
- Open questions/risks count
- Document path

Suggest `/implement` or address open questions first.
