---
name: respond
description: >
  Triage PR review feedback — analyze validity, recommend actions.
  Triggers: /respond, "respond to PR", "address feedback".
allowed-tools: Bash, Read, Write, Task, TaskCreate, TaskUpdate, TaskGet, TaskList
argument-hint: "[pr-number] | <task-id> | --continue"
---

# Respond

Triage PR review feedback and recommend actions.

## Arguments

- `<pr-number>` — new respond session for specific PR
- `<task-id>` — continue existing respond task
- `--continue` — resume most recent in_progress respond task
- (no args) — new respond session for current branch's PR

### New Respond Session

1. **Get PR context**
   - If PR number provided: `gh pr view <number> --json number,title,url`
   - Else: `gh pr view --json number,title,url` (current branch)
   - Exit if no PR found — suggest `/submit` first

2. **Fetch comments** (parallel)
   ```bash
   # Repo identifier
   REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
   PR_NUM=<number>

   # Inline review comments (on code lines)
   gh api "repos/$REPO/pulls/$PR_NUM/comments" \
     --jq '.[] | {id, path, line, original_line, body,
       user: .user.login, in_reply_to_id, created_at,
       diff_hunk, subject_type}'

   # Top-level review comments + review decisions
   gh pr view $PR_NUM --json reviews,comments,reviewDecision

   # Current diff (what's under review)
   git diff main...HEAD

   # Commit history
   git log main..HEAD --format="%h %s"
   ```

3. **Filter comments**
   - Only top-level comments (`in_reply_to_id == null`) — these
     are unresolved threads
   - Exclude bot comments (dependabot, github-actions, etc.)
   - Exclude the PR author's own comments
   - Group by file path

4. **Create respond task**
   - TaskCreate:
     - subject: "Respond: PR #$PR_NUM"
     - description: "All PR comments triaged with agree/disagree/question/already-done. Rationale provided for each classification. Findings stored in task metadata for user review."
     - metadata: {type: "task", priority: 2}
   - TaskUpdate(taskId, status: "in_progress")

5. **Spawn analysis subagent** (see Triage Subagent Prompt)

6. **Store findings**
   - Triage → design: TaskUpdate(taskId, metadata: {design: "<triage>"})
   - PR reply drafts → notes: TaskUpdate(taskId, metadata: {notes: "<replies>"})
   - Write plan file (after finalization, not first pass):
     ```
     Write("~/.claude/plans/<project>/respond-pr-<number>.md", <frontmatter + phased findings>)
     ```
     Or use: `Bash("tools/bin/planfile create --topic 'Respond: PR #<number>' --project $(pwd) --slug 'respond-pr-<number>' --body '<body>'")`
     Frontmatter:
     ```yaml
     ---
     topic: "Respond: PR #<number>"
     project: <absolute path to cwd>
     created: <ISO 8601 timestamp>
     status: draft
     ---
     ```

7. **Report results** (see Output Format — First Pass)

### Continue Respond Session

1. Resolve task ID:
   - If `$ARGUMENTS` matches a task ID → use it
   - If `--continue` → TaskList(), find first in_progress task
     with subject starting "Respond:"
2. Load existing context: TaskGet(taskId) → extract metadata.design
3. **Detect state** from design field content:
   - Contains `**Agree**` / `**Disagree**` sections → raw triage
     (first pass complete, user may have edited)
   - Contains `**Phase N:**` sections → already finalized
4. **If raw triage** → Finalize:
   - Read user's edits (they may have flipped classifications)
   - Rewrite agreed items into /prepare-compatible phase format
   - Draft PR reply text for disagree/already-done items
   - Update design with phase format
   - Update notes with PR reply drafts
5. **If already finalized** → Spawn subagent with previous findings
   prepended: "Previous findings:\n<design>\n\nContinue..."
6. Report results (see Output Format — Continuation)

## Triage Subagent Prompt

Spawn Task (subagent_type=Explore, model=opus) with:

```
You are a senior engineer triaging PR review feedback. Your job is
to analyze each reviewer comment, check whether it's valid against
the actual code, and recommend an action.

## PR
<pr-title> (#<pr-number>)

## Commits
<git log main..HEAD --format="%h %s">

## Reviewer Comments
<for each comment: author, file, line, body, diff_hunk>

## Full Diff
<git diff main...HEAD>

For EACH reviewer comment, read the relevant code and analyze:
1. What is the reviewer asking for?
2. Is the feedback valid given the actual code?
3. Is this concern already addressed elsewhere in the code?
4. What's the right action?

Classify each comment into exactly one category:

- **agree** — feedback is valid, code should change
- **disagree** — feedback is incorrect or misguided
- **question** — ambiguous, need clarification from reviewer
- **already-done** — concern is already handled in the code

Return COMPLETE findings as text (do NOT write files). Structure:

**Agree** (valid feedback — should action)
1. [file:line] @reviewer — <what they asked for>
   Rationale: <why it's valid>
   Suggested fix: <concrete change>

**Disagree** (push back on reviewer)
1. [file:line] @reviewer — <what they asked for>
   Rationale: <why it's incorrect/misguided>
   Suggested reply: <what to tell the reviewer>

**Question** (need clarification)
1. [file:line] @reviewer — <what they asked for>
   What's unclear: <the ambiguity>
   Question to ask: <specific question>

**Already Done** (resolved in current code)
1. [file:line] @reviewer — <what they asked for>
   Where it's handled: <file:line or explanation>
   Suggested reply: <point reviewer to existing handling>

## Important

- Read the actual code, not just the diff — context matters
- Check if the reviewer might be looking at stale code
- For style/preference comments with no correctness impact,
  lean toward "agree" (not worth the argument)
- For architectural suggestions, evaluate carefully against
  the broader codebase
- Be specific in rationale — cite code, not generalities
```

## Finalization Logic

When continuing a task that has raw triage (agree/disagree
sections), convert agreed items to /prepare-compatible format:

```
**Phase 1: PR Feedback Fixes**
1. <fix description> (file:line — from @reviewer comment)
2. <fix description> (file:line — from @reviewer comment)
```

Group related fixes into a single phase. If fixes span multiple
unrelated areas, use multiple phases.

Store PR reply drafts in notes field:

```
## PR Replies

### Disagree
- Re: @reviewer on file:line — <reply text>

### Already Done
- Re: @reviewer on file:line — <reply text>

### Questions
- Re: @reviewer on file:line — <question text>
```

## Output Format — First Pass

```
**Respond Task**: #<id>
**PR**: #<number> — <title>

**Triage Summary**:
- N agree (should action)
- N disagree (push back)
- N question (need clarification)
- N already-done (resolved)

**Agree**:
- [file:line] description of needed change

**Disagree**:
- [file:line] reason to push back

**Next**: `TaskGet(<id>)` to review triage in-session,
then `/respond --continue` to finalize for `/prepare`.
```

## Output Format — Continuation

```
**Respond Task**: #<id>

**Finalized**: N items to action, N replies drafted

**Plan**: `~/.claude/plans/<project>/respond-pr-<N>.md` — review/edit
in `$EDITOR` before `/prepare`.

**Next**: `/prepare` to create tasks, or edit the plan file first.
Notes field has PR reply drafts — review with `TaskGet(<id>)`.
```

## Guidelines

- Review-family skill: agent analyzes → recommends → user decides
- Let the subagent do the analysis — don't pre-judge
- Subagent type: Explore, model: opus
- Keep coordination messages concise
- Summarize subagent findings, don't copy verbatim
- The user is the final arbiter — the triage is a recommendation
