---
name: writing-skills
description: "Create new skills with proper structure. Triggers: 'new skill', 'create a skill', 'write a skill', 'add skill for'."
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

Create skill with proper frontmatter + structure.

## Instructions

### 1. Parse Arguments

Extract from `<arguments>`:
- Skill name (kebab-case)
- Brief description

Ask user if missing.

### 2. Gather Requirements

If unclear from description, ask user:
- Trigger phrases?
- User-invocable? (default: yes)
- Orchestrate (subagents) or direct (edit files)?
- Arguments accepted?

### 3. Create Directory + File

```bash
mkdir -p skills/{skill-name}
```

Write `skills/{skill-name}/SKILL.md`:

```markdown
---
name: {skill-name}
description: "{triggers + description}"
argument-hint: "{args}"
user-invocable: true
allowed-tools:
  - {tools}
---

# {Skill Title}

{One-line summary.}

## Instructions

{Step-by-step instructions.}
```

### 4. Verify

- [ ] `name` matches directory
- [ ] `description` includes triggers
- [ ] `allowed-tools` minimal + appropriate
- [ ] Instructions imperative + step-by-step
- [ ] 80-char line wrapping for prose

### 5. Tool Selection

| Type | Tools |
|------|-------|
| Orchestration | Task, Skill, AskUserQuestion, Read, Glob, Grep, Bash |
| Direct-action | Read, Edit, Write, Glob, Grep, Bash, AskUserQuestion |
| Team | + SendMessage, TaskCreate, TaskUpdate, TaskList, TaskGet, TeamCreate, TeamDelete |
| Plan-mode | + EnterPlanMode, ExitPlanMode |
| Git | Bash (git, gt, gh only) |
