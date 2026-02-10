---
name: compress-prompt
description: >
  Reduce tokens in AI-targeted text (skill files, system
  prompts, agent instructions). Not for human docs.
  Triggers: 'compress', 'reduce tokens', 'compress prompt'.
allowed-tools: Bash, Read, Task, Glob
user-invocable: true
argument-hint: "<file or glob pattern>"
---

# Compress Prompt

Reduce tokens in AI-targeted text. Delegate all compression
to Task agents -- never compress on main thread.

## Steps

### 1. Resolve Files

Expand `$ARGUMENTS` glob pattern → file list via Glob.

### 2. Measure Before

Per file, count tokens:

```bash
./skills/compress-prompt/scripts/count-token <file>
```

Fallback if count-token fails: `wc -c < <file>` (report as
bytes instead of tokens).

### 3. Spawn Compression Tasks

For each file, spawn a Task agent with file content +
compression rules (see template below). Agent writes
compressed output directly to file.

Multiple files → spawn all Tasks in single message for
parallel compression.

### 4. Measure After + Report

Re-measure each file. Report per-file delta + total.

## Task Prompt Template

```
Compress this text for AI consumption. Apply these rules:

COMPRESSION RULES:
- Drop articles when obvious ("the file" → "file")
- Drop filler ("In order to" → delete, "Make sure to" → delete)
- Imperative voice ("You should run" → "Run")
- Symbols where clear ("results in" → "→", "and" → "+")
- Condense repetitive lists (keep structure, merge similar)
- Merge redundant examples (4 similar → 1 representative)
- Simplify headers ("## Step 1: Setup" → "## Setup")

PRESERVE EXACTLY:
- Commands: syntax, flags, args
- Code blocks (unless clearly redundant)
- File paths
- Keywords: errors, APIs, technical terms
- Distinct cases with different behavior

TEXT TO COMPRESS:
{content}

Write compressed version to: {file_path}
```
