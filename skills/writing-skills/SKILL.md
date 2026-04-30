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

Create portable Agent Skills that use blueprints for durable workflow
state.

@rules/harness-compat.md applies.

## Arguments

- `<skill-name>` — kebab-case skill name
- `<description>` — what the skill does

## Steps

### 1. Parse Arguments

Extract skill name and brief description. Ask if either is missing.

### 2. Gather Requirements

If unclear, ask:

- trigger phrases for `description`
- arguments / flags
- whether the skill creates blueprint state
- expected output format

### 3. Reference Existing Skills

Read 2-3 nearby skills for conventions:

```bash
ls skills/*/SKILL.md
```

Match frontmatter style, heading structure, and concise imperative
instructions.

### 4. Create Skill File

```bash
mkdir -p skills/{skill-name}
```

Write `skills/{skill-name}/SKILL.md`:

```markdown
---
name: {skill-name}
description: >
  {What it does + when to use.}
  Triggers: '{trigger1}', '{trigger2}'.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: "{args}"
---

# {Skill Title}

{One-line imperative summary.}

@rules/harness-compat.md applies.

## Arguments

- `<arg>` — description
- `--flag` — description

## Workflow

### 1. {First Step}

{Imperative instructions.}
```

### 5. Verify

- `name` matches directory
- name is lowercase kebab-case
- description uses folded scalar `>` and includes triggers
- `allowed-tools` is minimal and portable
- title is the skill name only, no suffixes
- `## Arguments` exists when `argument-hint` exists
- instructions use imperative voice
- prose wraps near 80 chars

### 6. Tool Selection

Use portable tools only:

| Need | Tools |
|------|-------|
| inspect repo | Bash, Read, Glob, Grep |
| edit files | Bash, Read, Edit, Write, Glob, Grep |
| git-only | Bash |
| blueprint workflow | Bash, Read, Write, Edit |

Do not add harness-native task/team/subagent tools to shared skills.

## Blueprint Integration

Skills that create durable work should use blueprints.

Common patterns:

```bash
file=$(blueprint create spec "<topic>" --status draft)
file=$(blueprint create plan "<topic>" --status draft)
file=$(blueprint create review "<topic>" --status draft)
file=$(blueprint create report "<topic>" --status complete)
blueprint link "$file" "<source-slug>"
blueprint status "$file" complete
blueprint commit <type> <slug>
```

Use blueprint body sections for design, findings, notes, and resume
state. Use frontmatter `status:` for progress.
