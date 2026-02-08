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

Create a new skill with proper frontmatter and structure.

## Instructions

### 1. Parse Arguments

Extract from `<arguments>`:
- Skill name (kebab-case, e.g., `my-new-skill`)
- Brief description of what the skill does

If missing, ask user for both.

### 2. Gather Requirements

Ask the user (if not clear from description):
- What triggers the skill? (user phrases, situations)
- Is it user-invocable? (default: yes)
- Does it orchestrate (dispatch to subagents) or act
  directly (edit files itself)?
- What arguments does it accept?

### 3. Create Skill Directory and File

```bash
mkdir -p skills/{skill-name}
```

Write `skills/{skill-name}/SKILL.md` with this template:

```markdown
---
name: {skill-name}
description: "{triggers and description}"
argument-hint: "{args}"
user-invocable: true
allowed-tools:
  - {appropriate tools}
---

# {Skill Title}

{One-line summary of what the skill does.}

## Instructions

{Step-by-step instructions for Claude to follow.}
```

### 4. Checklist

Before finishing, verify:

- [ ] `name` matches directory name
- [ ] `description` includes trigger phrases
- [ ] `allowed-tools` is minimal and appropriate:
  - Orchestration: Task, Skill, AskUserQuestion, Read,
    Glob, Grep, Bash
  - Direct-action: Read, Edit, Write, Glob, Grep, Bash,
    AskUserQuestion
  - Team: add SendMessage, TaskCreate, TaskUpdate,
    TaskList, TaskGet, TeamCreate, TeamDelete
- [ ] Instructions are imperative and step-by-step
- [ ] No unnecessary comments or filler text
- [ ] Follows 80-char line wrapping for prose

### 5. Tool Selection Guide

| Skill Type | Tools |
|-----------|-------|
| Orchestration | Task, Skill, AskUserQuestion, Read, Glob, Grep, Bash |
| Direct-action | Read, Edit, Write, Glob, Grep, Bash, AskUserQuestion |
| Team orchestration | Above + SendMessage, TaskCreate, TaskUpdate, TaskList, TaskGet, TeamCreate, TeamDelete |
| Plan-mode | Above + EnterPlanMode, ExitPlanMode |
| Git operations | Bash (scoped: git, gt, gh) |
