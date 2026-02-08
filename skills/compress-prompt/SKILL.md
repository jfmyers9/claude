---
name: compress-prompt
description: Use when compressing text for AI consumption - skill files, system prompts, agent instructions. Not for human docs.
allowed-tools: Bash, Read, Task, Glob
user-invocable: true
argument-hint: "<file or glob pattern>"
---

# Compress Prompt

Reduce tokens in AI-targeted text. Never compress on main thread.

## Process

For each file to compress, spawn a general-purpose agent via Task:

1. Read file, measure before-size (see Token Counting below)
2. Include the file content + compression rules in the Task prompt
3. Agent writes compressed output directly to the file
4. After Task completes, measure after-size and report delta

For multiple files: spawn all Tasks in a single message for
parallel compression.

## Token Counting

Measure token counts with:

```
./skills/compress-prompt/scripts/count-token <file>
```

If `count-token` fails (uv not installed), fall back to byte
count: `wc -c < <file>`. Report as bytes instead of tokens.

## Optional Setup

For accurate token counts, install uv (one-time):

```
brew install uv
```

Not required — skill works without it using byte-count fallback.

## Task Prompt Template

Pass this prompt to each Task agent:

```
Compress this text for AI consumption. Apply these rules:

COMPRESSION RULES:
- Drop articles when obvious ("the file" -> "file")
- Drop filler phrases ("In order to" -> delete, "Make sure to" -> delete)
- Imperative voice ("You should run" -> "Run")
- Use symbols where clear ("results in" -> "->", "and" -> "+")
- Condense repetitive lists (keep structure, merge similar items)
- Merge redundant examples (4 similar examples -> 1 representative + "etc")
- Keep headers but simplify ("## Step 1: Setup" -> "## Setup")

PRESERVE EXACTLY:
- Commands: syntax, flags, args
- Code blocks: unless clearly redundant
- File paths
- Keywords: errors, APIs, technical terms
- Distinct cases with different behavior

TEXT TO COMPRESS:
{text}

Write compressed version to: {output_path}
```
