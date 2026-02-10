---
name: writing-skills
description: >
  Create new skills with proper structure + frontmatter.
  Triggers: 'new skill', 'create a skill', 'write a skill',
  'add skill for'.
argument-hint: "<skill-name> <description>"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
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
- User-invocable? (default: yes)
- Orchestration (delegates to subagents) or direct (edits
  files itself)?
- Arguments accepted?

### 3. Create Skill File

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
argument-hint: "{args}"
user-invocable: true
allowed-tools:
  - {tool1}
  - {tool2}
---

# {Skill Title}

{One-line summary.}

## Steps

### 1. {First Step}

{Imperative instructions.}
```

### 4. Verify

- `name` matches directory name
- `description` includes trigger phrases
- `allowed-tools` minimal for the task
- Instructions use imperative voice
- Prose wrapped at 80 characters

### 5. Tool Selection Reference

Pick minimal tool set based on skill type:

| Type | Tools |
|------|-------|
| Orchestration | Task, Skill, AskUserQuestion, Read, Glob, Grep, Bash |
| Direct-action | Read, Edit, Write, Glob, Grep, Bash, AskUserQuestion |
| Team | + SendMessage, TaskCreate, TaskUpdate, TaskList, TaskGet, TeamCreate, TeamDelete |
| Plan-mode | + EnterPlanMode, ExitPlanMode |
| Git-only | Bash (git, gt, gh commands) |
