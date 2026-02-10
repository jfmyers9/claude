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

Three specialists explore topic from multiple angles → synthesize
into comprehensive exploration document.

## Instructions

### 1. Parse Topic

Extract from `$ARGUMENTS`. Missing → ask + exit.

### 2. Create Team + Tasks

TeamCreate: `deep-explore-{HHMMSS}`. TaskCreate 3 tasks:
1. Broad context gathering (researcher)
2. Architecture analysis (architect)
3. Challenge assumptions (devil)

### 3. Spawn Teammates

All general-purpose, spawned in parallel:

- **explorer**: Cast wide net. Glob+Grep for files, read docs,
  trace code paths, check deps. Report: relevant files (path:line),
  existing implementations, dependencies, key findings.

- **design-analyst**: Analyze architecture. Patterns, structure,
  boundaries, coupling/cohesion. Report: current structure, design
  patterns, structural considerations, recommendations.

- **challenger**: Think failure modes. Assumptions, edge cases,
  security/performance concerns, challenge obvious approaches.
  Report: assumptions to validate, edge cases, concerns,
  alternative approaches.

Each prompt includes: topic, note that others explore different
angles, SendMessage instructions.

**Failure handling**: Status check after 2 idle prompts. Failed →
note missing perspective. Continue with remaining (min 1). Report
completions as they arrive.

### 4. Synthesize Document

Save to `.jim/plans/team-explore-{YYYYMMDD-HHMMSS}-{slug}.md`:

Standard exploration doc structure: original request, context
gathered (from researcher), architecture analysis (from architect),
risks + challenges (from devil), requirements analysis (explicit,
implicit, open questions), 2-3 potential approaches (overview,
pros, cons, complexity, risks), recommendation, next steps with
phase markers if warranted.

### 5. Shutdown + Present

Shutdown all → TeamDelete. Show: brief summary (2-3 sentences),
recommendation, open questions/risks count, doc path. Suggest
`/implement` or address open questions first.
