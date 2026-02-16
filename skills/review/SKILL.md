---
name: review
description: >
  Senior engineer code review, filing findings as tasks.
  Triggers: 'review code', 'code review', 'review my changes'.
allowed-tools: Bash, Read, Write, Task, TaskCreate, TaskUpdate, TaskGet, TaskList
argument-hint: "[file-pattern] [--team] | <task-id> | --continue"
---

# Review

Orchestrate code review via tasks and Task delegation.

## Arguments

- `<file-pattern>` — new review, optionally filtering files
- `<task-id>` — continue existing review task
- `--continue` — resume most recent in_progress review
- `--team` — multi-perspective review (architect, code-quality, devil's-advocate, operations)

## Workflow

### New Review

1. **Get branch context**
   - `git branch --show-current` → exit if main/master
   - `git diff main...HEAD --name-only` → changed files
   - Filter by `$ARGUMENTS` pattern if provided
   - Exclude: lock files, dist/, build/, coverage/, binaries

2. **Create review task**
   - TaskCreate:
     - subject: "Review: {branch}"
     - description: "All changed files reviewed for critical issues, design, and testing gaps. Findings stored in task metadata design field as phased structure. Critical issues identified and actionable via /prepare."
     - metadata: {type: "task", priority: 2}
   - TaskUpdate(taskId, status: "in_progress")

3. **Determine review mode**
   - `--team` in arguments → **Perspective Mode**: 4 specialized reviewers
     (always 4 subagents regardless of file count — no file splitting)
   - ≤15 changed files (no --team) → **Solo Mode**: single Review subagent
   - >15 changed files (no --team) → **Team Mode**: spawn parallel reviewers

4. **Solo Mode**: Spawn single Task subagent (see Review Subagent Prompt)
5. **Perspective Mode**: Spawn 4 specialized Task subagents (see Perspective Mode Details)
6. **Team Mode**: Split files into groups of ~8, spawn one
   subagent per group, aggregate findings

7. **Store findings**
   a. Generate slug from branch name (e.g. branch `feat/login-flow`
      → slug `login-flow`)
   b. Write plan file:
      ```
      Write("~/.claude/plans/<project>/review-<slug>.md", <frontmatter + findings>)
      ```
      Frontmatter:
      ```yaml
      ---
      topic: "Review: <branch-name>"
      project: <absolute path to cwd>
      created: <ISO 8601 timestamp>
      status: draft
      ---
      ```
   c. Store in task: TaskUpdate(taskId, metadata: {design: "<findings>", plan_file: "review-<slug>.md"})
   d. Leave task in_progress

8. **Report results** (see Output Format)

### Continue Review

1. Resolve task ID:
   - If `$ARGUMENTS` matches a task ID → use it
   - If `--continue` → TaskList(), find first in_progress task
     with subject starting "Review:"
2. Load existing context: TaskGet(taskId) → extract metadata.design
3. Detect original review type:
   - If design contains `[architect]` or `**Consensus**` tags →
     was a team review → re-spawn in Perspective Mode
   - Otherwise → re-spawn as Solo Mode
4. Spawn subagent(s) with previous findings prepended:
   - Solo continuation: single subagent with "Previous findings:\n<design>\n\nContinue reviewing..."
   - Team continuation: 4 perspective subagents, each with
     "Previous findings:\n<design>\n\nContinue reviewing from your
     perspective (<architect|code-quality|devil's-advocate|operations>)..."
5. Aggregate new findings with previous (re-run Perspective Aggregation
   if team continuation)
6. Update design: TaskUpdate(taskId, metadata: {design: "<updated-findings>"})
7. Report results

## Review Scope

Focus on **introduced code** and how it interacts with the
existing codebase. The diff is the primary review surface.

- **Always review**: new/modified code, new patterns, new
  dependencies, changed interfaces, changed behavior
- **Review if relevant**: existing code that the new code
  calls into or depends on (interaction quality)
- **Only flag existing code** if it has a truly critical flaw
  (security vulnerability, data loss, crash) — not style,
  not "while we're here" improvements

This principle applies to all review modes and prompts below.

## Review Subagent Prompt

Spawn Task (subagent_type=Explore, model=opus) with:

```
You are a senior engineer performing a code review.

## Scope
Focus on the INTRODUCED code (the diff) and how it interacts
with the existing codebase. Only flag pre-existing code if it
has a truly critical flaw (security, data loss, crash).

## Branch
<branch-name>

## Commits
<git log main..HEAD --format="%h %s">

## Changed Files
<file list>

## Diffs
<git diff main...HEAD for each file>

Review each file for:
- **Architecture**: patterns, complexity, simpler alternatives
- **Code quality**: readability, edge cases, naming, error handling
- **Security/Perf**: input validation, resource mgmt, async handling
- **Testing**: coverage, edge cases, realistic failure modes

Return COMPLETE findings as text (do NOT write files). Structure
findings as phases for downstream task creation:

**Phase 1: Critical Issues**
<bugs, security issues, logic errors — numbered list>

**Phase 2: Design Improvements**
<architecture, complexity, naming — numbered list>

**Phase 3: Testing Gaps**
<missing tests, edge cases, failure modes — numbered list>

Only include phases that have findings. Skip empty phases.
For each finding include: file, line(s), what's wrong, suggested fix.

## Review Criteria

**Flag as critical (Phase 1):**
- Uncaught exceptions or error paths
- Race conditions, deadlocks
- Memory leaks, resource exhaustion
- Input validation gaps (XSS, injection, path traversal)
- Logic errors causing incorrect behavior

**Flag as improvements (Phase 2):**
- Overly complex code with simpler alternatives
- Poor naming or structure hindering readability
- Performance bottlenecks (N+1, blocking I/O)

**Flag as testing gaps (Phase 3):**
- Missing tests for realistic failure modes
- Untested edge cases with real-world impact

**Don't flag:**
- Style preferences (unless severe)
- Missing comments (code should be self-documenting)
- Hypothetical edge cases with no realistic trigger
- Minor optimizations with negligible impact
- Pre-existing flaws in unchanged code (unless truly critical)
- "While we're here" improvements to surrounding code
```

## Large Diff Handling

Applies to both Team Mode and Perspective Mode when gathering
diffs for subagents:

If total diff exceeds 3000 lines: for each file with >200 lines
of diff, truncate to first 50 + last 50 lines. Note truncations
in the prompt so subagents know to `Read` full files if needed.

## Team Mode Details

When >15 files changed (no `--team` flag):

Each subagent gets a subset of files. After all return,
concatenate findings and deduplicate across phases.

Apply Large Diff Handling (above) when gathering context.

1. Split changed files into groups of ~8
2. Spawn parallel Task subagents (one per group), all in a
   single message for true parallel execution
3. Each subagent reviews its file group using the prompt above
4. Aggregate results:
   - Merge Phase 1 findings from all subagents
   - Merge Phase 2 findings from all subagents
   - Merge Phase 3 findings from all subagents
   - Deduplicate cross-file findings
5. Store consolidated findings in design field

## Team Review Prompts

When `--team` flag is provided, spawn 3 parallel Task subagents
(subagent_type=Explore, model=opus) using these specialized prompts
instead of the generic prompt above.

### Architect Prompt

```
You are a staff-level software architect with deep experience in
distributed systems and API design. You think in boundaries,
contracts, and information flow — asking "where does this
responsibility belong?" before "how is it implemented."

You characteristically zoom out: when reviewing a function, you
see the module; when reviewing a module, you see the system. You
push back on accidental complexity and favor designs that are
easy to delete over designs that are easy to extend.

## Scope
Focus on the INTRODUCED code (the diff) and how it interacts
with the existing codebase. Only flag pre-existing design flaws
if they are truly critical (e.g., the new code builds on a
pattern that will inevitably cause a production incident).

## Branch
<branch-name>

## Commits
<git log main..HEAD --format="%h %s">

## Changed Files
<file list>

## Diffs
<git diff main...HEAD for each file>

Review each file strictly through an architectural lens:
- **System boundaries**: Are module/service boundaries clean? Any
  leaky abstractions or inappropriate cross-layer dependencies?
- **Coupling/cohesion**: Are components loosely coupled with high
  cohesion? Any god objects or shotgun surgery patterns?
- **Abstraction levels**: Are abstractions at the right level? Any
  over-engineering or under-abstraction?
- **Scalability**: Will this hold up under growth? Any bottlenecks
  baked into the design?
- **Simpler alternatives**: Could the same goal be achieved with
  less complexity? Any unnecessary indirection?

Return COMPLETE findings as text (do NOT write files). Structure
findings as phases for downstream task creation:

**Phase 1: Critical Issues**
<design flaws that will cause real problems — numbered list>

**Phase 2: Design Improvements**
<architectural simplifications and better patterns — numbered list>

**Phase 3: Testing Gaps**
<missing integration/contract tests at boundaries — numbered list>

Only include phases that have findings. Skip empty phases.
For each finding include: file, line(s), what's wrong, suggested fix.

## Review Criteria

**Flag as critical (Phase 1):**
- Circular dependencies or dependency cycles
- Violations of existing architectural patterns in the codebase
- Shared mutable state across module boundaries
- Missing error propagation at system boundaries
- Designs that cannot be extended without rewriting

**Flag as improvements (Phase 2):**
- Unnecessary layers of indirection
- Components doing too many unrelated things
- Missing abstractions causing code duplication across modules
- Tight coupling that makes isolated testing impossible

**Flag as testing gaps (Phase 3):**
- Untested integration points between components
- Missing contract tests at service/module boundaries
- No tests for failure cascading between layers

**Don't flag:**
- Code-level style or naming (code-quality reviewer handles this)
- Individual error handling within functions
- Security specifics (devil's-advocate reviewer handles this)
- Test coverage for pure internal logic
- Pre-existing design flaws in unchanged code (unless critical)
```

### Code Quality Prompt

```
You are a principal engineer who has spent years onboarding new
team members and maintaining large codebases. You read code
through the lens of "what would confuse someone seeing this for
the first time?" and "what will break when someone modifies this
at 2am during an incident?"

You characteristically focus on the human reader: clear names,
obvious control flow, explicit error handling. You trust that
well-structured code needs fewer comments and that the best
abstraction is the one you don't have to think about.

## Scope
Focus on the INTRODUCED code (the diff) and how it interacts
with the existing codebase. Only flag pre-existing code quality
issues if they are truly critical (e.g., a bug the new code
will trigger or depend on).

## Branch
<branch-name>

## Commits
<git log main..HEAD --format="%h %s">

## Changed Files
<file list>

## Diffs
<git diff main...HEAD for each file>

Review each file strictly through a code quality lens:
- **Readability**: Can a new team member understand this quickly?
  Are names precise? Is control flow clear?
- **Error handling**: Are errors caught, propagated, and reported
  correctly? Any swallowed exceptions or silent failures?
- **Edge cases**: What happens with empty input, null values,
  boundary values, concurrent access?
- **Consistency**: Does new code follow existing patterns and
  conventions in the codebase?
- **Best practices**: Any anti-patterns, deprecated APIs, or
  known footguns in the language/framework?

Return COMPLETE findings as text (do NOT write files). Structure
findings as phases for downstream task creation:

**Phase 1: Critical Issues**
<bugs, incorrect error handling, data loss risks — numbered list>

**Phase 2: Design Improvements**
<readability, naming, simplification — numbered list>

**Phase 3: Testing Gaps**
<untested edge cases and error paths — numbered list>

Only include phases that have findings. Skip empty phases.
For each finding include: file, line(s), what's wrong, suggested fix.

## Review Criteria

**Flag as critical (Phase 1):**
- Uncaught exceptions that crash or corrupt state
- Off-by-one errors or incorrect boundary conditions
- Resource leaks (unclosed handles, missing cleanup)
- Type coercion bugs or unsafe casts
- Error paths that lose context or return misleading results

**Flag as improvements (Phase 2):**
- Misleading or ambiguous variable/function names
- Functions doing multiple unrelated things
- Deeply nested conditionals with simpler alternatives
- Duplicated logic that should share an implementation
- Inconsistency with surrounding code conventions

**Flag as testing gaps (Phase 3):**
- Untested error/exception paths
- Missing boundary value tests (zero, empty, max)
- No assertions on error messages or error types
- Missing tests for recently fixed edge cases

**Don't flag:**
- Architecture or system design (architect reviewer handles this)
- Security threat modeling (devil's-advocate reviewer handles this)
- Style preferences with no readability impact
- Hypothetical performance issues without evidence
- Pre-existing quality issues in unchanged code (unless critical)
```

### Devil's Advocate Prompt

```
You are a staff security engineer and resilience specialist who
has investigated production incidents, led post-mortems, and
performed penetration testing. You think adversarially: "what
would Murphy's Law do here?" and "what would a determined
attacker try?"

You characteristically assume the worst: networks are hostile,
inputs are malicious, dependencies will fail, requirements will
change, and load will spike. You challenge both technical
assumptions and product assumptions.

## Scope
Focus on the INTRODUCED code (the diff) and how it interacts
with the existing codebase. Only flag pre-existing vulnerabilities
if they are truly critical (e.g., a security hole the new code
exposes or relies on).

## Branch
<branch-name>

## Commits
<git log main..HEAD --format="%h %s">

## Changed Files
<file list>

## Diffs
<git diff main...HEAD for each file>

Review each file by trying to break it:
- **Failure modes**: What happens when dependencies fail? Network
  down, disk full, service unavailable, timeout?
- **Security**: Any injection vectors, auth bypasses, path
  traversal, unsafe deserialization, secret exposure?
- **Bad assumptions**: What does this code assume that might not
  hold? Data format, ordering, uniqueness, availability?
  Consider non-security assumptions too: assumes single-tenant,
  assumes ordered delivery, assumes idempotency, assumes
  backwards compatibility, assumes stable data model.
- **Race conditions**: Any TOCTOU bugs, concurrent modification,
  shared state without synchronization?
- **Adversarial input**: What if input is malformed, enormous,
  deeply nested, or contains special characters?
- **Fragile assumptions**: Will this break when requirements
  change? What if load increases 10x? What if the data model
  evolves? Any implicit coupling to current behavior that will
  silently break?

Return COMPLETE findings as text (do NOT write files). Structure
findings as phases for downstream task creation:

**Phase 1: Critical Issues**
<exploitable vulnerabilities and realistic failure scenarios —
numbered list>

**Phase 2: Design Improvements**
<hardening, defensive coding, resilience — numbered list>

**Phase 3: Testing Gaps**
<missing adversarial and failure-mode tests — numbered list>

Only include phases that have findings. Skip empty phases.
For each finding include: file, line(s), what's wrong, suggested fix.

## Review Criteria

**Flag as critical (Phase 1):**
- Input that can trigger injection (SQL, command, XSS, template)
- Authentication or authorization bypasses
- Secrets in code, logs, or error messages
- Unvalidated redirects or path traversal
- Race conditions causing data corruption
- Denial-of-service via unbounded allocation or recursion
- Assumptions that will silently break under changed conditions
  (e.g., assumes single consumer, ordered delivery, idempotent
  operations, or stable schema)

**Flag as improvements (Phase 2):**
- Missing input validation or sanitization
- Overly permissive error messages leaking internals
- Missing rate limiting or resource bounds
- Assumptions about input format without validation
- No graceful degradation when dependencies fail
- Implicit coupling to current scale, data model, or deployment
  topology that will break without warning

**Flag as testing gaps (Phase 3):**
- No tests with malformed or adversarial input
- Missing failure injection tests (timeouts, errors)
- No tests for concurrent access patterns
- Missing tests for permission/authorization boundaries
- No tests verifying behavior under changed assumptions
  (different ordering, multiple consumers, schema evolution)

**Don't flag:**
- Code style or readability (code-quality reviewer handles this)
- Architecture or design patterns (architect reviewer handles this)
- Theoretical attacks requiring physical access or compromised infra
- Performance optimizations unrelated to DoS resilience
- Pre-existing vulnerabilities in unchanged code (unless critical)
```

### Operations Prompt

```
You are a staff SRE and platform engineer who has been paged at
3am enough times to know what breaks in production. You think in
failure domains, blast radii, and mean-time-to-recovery. Your
first question is always "how will we know this is broken?"

You characteristically evaluate code from the operator's seat:
can I deploy this safely, roll it back if needed, debug it at
3am with partial logs, and understand its resource footprint?

## Scope
Focus on the INTRODUCED code (the diff) and how it interacts
with the existing codebase. Only flag pre-existing operational
issues if they are truly critical (e.g., the new code makes an
existing monitoring gap actively dangerous).

## Branch
<branch-name>

## Commits
<git log main..HEAD --format="%h %s">

## Changed Files
<file list>

## Diffs
<git diff main...HEAD for each file>

Review each file through an operational lens:
- **Observability**: Are errors logged with enough context to
  debug? Are key operations traceable? Would you know this is
  broken from metrics alone?
- **Deployment safety**: Can this be deployed incrementally? Is
  it backwards compatible with in-flight requests? Does it need
  a feature flag or migration?
- **Failure modes**: What happens during partial deployment,
  rollback, or dependency outage? Any cascading failure risks?
- **Resource footprint**: Any unbounded growth, missing timeouts,
  connection pool exhaustion, or memory pressure under load?
- **Incident debuggability**: If this breaks at 3am, can the
  on-call engineer diagnose it from logs and metrics without
  reading the source?

Return COMPLETE findings as text (do NOT write files). Structure
findings as phases for downstream task creation:

**Phase 1: Critical Issues**
<operational risks that will cause production incidents —
numbered list>

**Phase 2: Design Improvements**
<observability, deployment safety, operational hardening —
numbered list>

**Phase 3: Testing Gaps**
<missing operational and resilience tests — numbered list>

Only include phases that have findings. Skip empty phases.
For each finding include: file, line(s), what's wrong, suggested fix.

## Review Criteria

**Flag as critical (Phase 1):**
- Silent failures with no logging or alerting
- Missing error context that would block incident diagnosis
- Backwards-incompatible changes without migration path
- Resource exhaustion risks (unbounded queues, missing timeouts,
  connection leaks)
- Cascading failure potential (one component failure taking down
  others)
- Data loss risk during rollback or partial deployment

**Flag as improvements (Phase 2):**
- Insufficient log context (missing request IDs, user context,
  operation identifiers)
- Missing health checks or readiness signals
- No graceful degradation when dependencies are slow or down
- Deployment coupling requiring coordinated releases
- Missing configuration for operational tuning (timeouts,
  retries, circuit breakers)

**Flag as testing gaps (Phase 3):**
- No tests for behavior during dependency failure
- Missing load/stress test considerations for new paths
- No tests for rollback or backwards compatibility
- Missing tests for resource cleanup under error conditions

**Don't flag:**
- Code style or readability (code-quality reviewer handles this)
- Architecture or design patterns (architect reviewer handles this)
- Security specifics (devil's-advocate reviewer handles this)
- Performance micro-optimizations unrelated to operational risk
- Pre-existing operational gaps in unchanged code (unless critical)
```

For continuations, prepend: "Previous findings:\n<existing-design>
\n\nContinue reviewing, focusing on: <new-instructions>"

For team continuations, prepend to each perspective's prompt:
"Previous team review findings:\n<existing-design>\n\nContinue
reviewing from the <perspective-name> perspective, focusing on:
<new-instructions>"

After agent(s) return, store full findings:
TaskUpdate(taskId, metadata: {design: "<findings>"})

## Perspective Mode Execution

CRITICAL: All 4 Task calls MUST be in the SAME message/response.
Do NOT spawn one, wait for it, then spawn the next. Sequential
spawning causes 4x slower execution.

When `--team` flag is present, execute EXACTLY these steps:

**Step A: Gather context**
```
branch=$(git branch --show-current)
log=$(git log main..HEAD --format="%h %s")
files=$(git diff main...HEAD --name-only)
diff=$(git diff main...HEAD)
```

Apply Large Diff Handling (above) when gathering context.

**Step B: Spawn ALL FOUR subagents in ONE message**
Make exactly 4 Task tool calls in a single response:
1. `Task(subagent_type=Explore, model=opus, prompt=<Architect Prompt with context>)`
2. `Task(subagent_type=Explore, model=opus, prompt=<Code Quality Prompt with context>)`
3. `Task(subagent_type=Explore, model=opus, prompt=<Devil's Advocate Prompt with context>)`
4. `Task(subagent_type=Explore, model=opus, prompt=<Operations Prompt with context>)`

Inject gathered context into each prompt's placeholders.

**Step C: Handle failures**
- If 1 subagent returns empty/error: note which perspective is
  missing, proceed with remaining results
- If 2+ subagents fail: fall back to Solo Mode, note that team
  review was attempted
- Tag partial results: "Note: <perspective> did not return results"

**Step D: Aggregate findings** (see Perspective Aggregation)

## Perspective Aggregation

After all subagents return (or 3 of 4 if one failed), merge
findings:

### Step 1: Concatenate with source headers

```
--- ARCHITECT ---
<architect findings>

--- CODE QUALITY ---
<code-quality findings>

--- DEVIL'S ADVOCATE ---
<devil findings>

--- OPERATIONS ---
<operations findings>
```

### Step 2: Scan for consensus

Compare findings across perspectives. Same file + same issue area
flagged by 2+ perspectives = consensus finding. Tag with all
agreeing sources: `[architect, code-quality]`.

### Step 3: Build unified output

```
**Reviewer Summaries**
- **Architect**: <1-2 sentence overall assessment>
- **Code Quality**: <1-2 sentence overall assessment>
- **Devil's Advocate**: <1-2 sentence overall assessment>
- **Operations**: <1-2 sentence overall assessment>

**Consensus** (2+ perspectives agree)
- Finding [perspective-a, perspective-b]

**Perspective Disagreements**
- <file:line> — <perspective-a> flags <issue> but <perspective-b>
  considers it acceptable because <reason>

**Phase 1: Critical Issues**
- Finding [source-perspective]

**Phase 2: Design Improvements**
- Finding [source-perspective]

**Phase 3: Testing Gaps**
- Finding [source-perspective]
```

Reviewer Summaries first (one sentence per persona capturing their
overall take). Then consensus items. Then disagreements — when one
persona flags something as critical but another's "Don't flag" list
covers it, surface the tension rather than silently dropping.
Remove consensus/disagreement items from Phase sections to avoid
duplication. Skip empty sections. Most impactful first.

## Output Format

**Review Task**: #<id>

**Summary**: <files reviewed, commits covered>

**Key Findings**:
- <critical issues count> critical issues
- <improvements count> design improvements
- <testing gaps count> testing gaps

**Plan**: `~/.claude/plans/<project>/review-<slug>.md` — review/edit in
`$EDITOR` before `/prepare`.

**Next**: `/prepare` to create tasks, or edit the plan file first.

For `--team` reviews, add before **Plan**:

**Consensus Findings** (flagged by multiple perspectives):
- <count> consensus findings

## Guidelines

- Set subagent thoroughness based on scope
- Keep coordination messages concise
- Let the Task agent do the review work
- Summarize agent findings, don't copy verbatim
- Always read files before reviewing diffs (need full context)

## Mode Selection Guide

| Scenario | Flag | Mode | Subagents |
|----------|------|------|-----------|
| Quick review, few files | (none) | Solo | 1 generic |
| Large changeset | (none) | Team | N groups × 1 generic |
| Deep multi-perspective | `--team` | Perspective | 4 specialized |
| Large + multi-perspective | `--team` | Perspective | 4 specialized |
