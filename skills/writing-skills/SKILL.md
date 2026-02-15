---
name: writing-skills
description: >
  Create new skills with proper structure + frontmatter.
  Triggers: 'new skill', 'create a skill', 'write a skill',
  'add skill for'.
argument-hint: "<skill-name> <description>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Writing Skills

Create skill files with proper frontmatter + imperative
step-by-step instructions.

## Steps

### 1. Parse Arguments

Extract from `$ARGUMENTS`:

- Skill name (kebab-case)
- Brief description

Ask user if either is missing.

### 2. Gather Requirements

If unclear from description, ask:

- Trigger phrases for description field
- Orchestration (delegates to Task subagents) or direct
  (edits files itself)?
- Arguments accepted?

### 3. Reference Existing Skills

Read 2-3 existing skills for current conventions:

```
ls skills/*/SKILL.md
```

Match the frontmatter style, heading structure, and tool
lists used in the codebase.

### 4. Create Skill File

```bash
mkdir -p skills/{skill-name}
```

Write `skills/{skill-name}/SKILL.md` with this structure:

```markdown
---
name: {skill-name}
description: >
  {What it does + when to use.}
  Triggers: '{trigger1}', '{trigger2}'.
allowed-tools: {Tool1}, {Tool2}
argument-hint: "{args}"
---

# {Skill Title}

{One-line summary.}

## Arguments

- `<arg>` — description
- `--flag` — description

## Steps (or ## Workflow)

### 1. {First Step}

{Imperative instructions.}
```

### 5. Verify

- `name` matches directory name
- `description` includes trigger phrases
- `allowed-tools` is comma-separated on one line (current
  convention), minimal for the task
- Instructions use imperative voice
- Prose wrapped at 80 characters
- No `user-invocable` field (removed from convention)

### 6. Tool Selection Reference

Pick minimal tool set based on skill type:

| Type | Tools |
|------|-------|
| Orchestration | Bash, Read, Task |
| Direct-action | Bash, Read, Edit, Write, Glob, Grep |
| Team | + SendMessage, TaskCreate, TaskUpdate, TaskList, TaskGet, TeamCreate, TeamDelete |
| Plan-mode | + EnterPlanMode, ExitPlanMode |
| Git-only | Bash |

Notes:
- Orchestration skills use Task to spawn subagents for
  heavy work (see explore, review, implement)
- Direct-action skills edit files themselves
- Team tools only needed for multi-agent swarm coordination
- Most skills also include Glob and Grep for search

## Issues Integration

Skills that create or track work should use the `work` CLI
for state storage instead of filesystem documents.

### Common Patterns

- **Create a tracking issue**:
  `work create "<title>" --priority 2 --labels <type>`
  with `--description` containing acceptance criteria
- **Store findings**: `work edit <id> --description "<content>"`
  for plans, exploration results, or review findings
- **Store notes**: `work comment <id> "<content>"`
  for branch links, session notes, or metadata
- **Track status**: `work start <id>` and
  `work close <id>` when done
- **Read context**: `work show <id> --format=json`

### When to Integrate Issues

- Skill creates trackable work → create an issue
- Skill produces structured output → store in description
- Skill needs to resume across sessions → use issues as
  state store
- Skill is fire-and-forget (e.g., git-only) → skip issues

### Issue Description Format

Always include acceptance criteria in descriptions:

```
work create "Review: feature-branch" --priority 2 \
  --labels review \
  --description "$(cat <<'EOF'
## Acceptance Criteria
- Specific, testable outcomes
- Stored in issue description
EOF
)"
```
