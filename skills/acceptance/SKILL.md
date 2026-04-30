---
name: acceptance
description: >
  Validate implementation against acceptance criteria using a
  blueprint-backed verifier/breaker review. Triggers: 'accept',
  'acceptance check', 'verify implementation', 'did it work'.
argument-hint: "[blueprint-slug] [--auto]"
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - Write
---

# Acceptance

Verify an implementation against its blueprint criteria. Store the
verdict in a `review/` blueprint.

@rules/blueprints.md and @rules/harness-compat.md apply.

## Arguments

- `<blueprint-slug>` — spec/plan/review blueprint to verify
- `--auto` — create a fix plan for failures
- no args — verify the latest spec/plan blueprint

## Workflow

### 1. Resolve Target

Find the target blueprint:

```bash
blueprint find --type spec,plan,review [--match <slug>]
```

Read acceptance criteria from, in order:

- `## Plan` phase done signals
- `## Spec` recommendation/problem
- `## Feedback Analysis` findings
- `## Implementation Notes`

If criteria are unclear, ask what to verify.

### 2. Gather Changes

```bash
trunk=$(gt trunk 2>/dev/null || echo main)
git diff "$trunk"...HEAD --name-only
git diff "$trunk"...HEAD
```

If no branch diff exists, use staged/unstaged diff; if still empty,
stop with "Nothing to verify".

Summarize large diffs; read full files only for specific checks.

### 3. Verify

Run two passes sequentially in this session:

**Verifier pass**

For each criterion, mark:

- PASS — fully met with file/line evidence
- PARTIAL — partly met, gap explained
- FAIL — not met
- N/A — not applicable

**Breaker pass**

Hunt for:

1. implied requirements
2. edge cases
3. integration risks
4. technically-met-but-incomplete behavior
5. missing negative tests

Rate breaker findings HIGH/MEDIUM/LOW.

### 4. Reconcile

Verdict rules:

| Condition | Verdict |
|---|---|
| Any verifier FAIL | FAIL |
| Any verifier PARTIAL | PARTIAL |
| All PASS + breaker HIGH | PARTIAL |
| All PASS + no breaker HIGH | PASS |

Consensus findings are verifier PARTIAL/FAIL items that overlap with a
breaker HIGH/MEDIUM finding.

### 5. Store Review

Create an acceptance review blueprint:

```bash
file=$(blueprint create review "Acceptance: <target>" --status complete)
blueprint link "$file" "<source-slug>"
```

Write:

```markdown
## Acceptance Verdict
PASS | PARTIAL | FAIL

## Criteria Matrix
| Criterion | Verifier | Breaker Flags | Evidence |

## Consensus Findings

## Verifier Details

## Breaker Findings
```

Run `blueprint commit review <slug>`.

### 6. Act

- PASS: suggest `/skill:commit`.
- PARTIAL/FAIL with `--auto`: read `skills/fix/SKILL.md` and create a
  fix plan from consensus findings.
- PARTIAL/FAIL without `--auto`: report findings and suggest
  `/skill:fix`.
