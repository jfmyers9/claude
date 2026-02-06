# Test Quality

Every test must answer: **"What bug would this catch?"**
If there's no realistic bug scenario, delete the test.

## Banned Patterns

- **Tautology tests** — testing that mocks return what you told
  them to return
- **Getter/setter tests** — testing that assignment works
- **Implementation mirroring** — duplicating the production
  formula in the test instead of using known-answer values
- **Happy-path-only** — only testing success when failure modes
  exist (empty input, invalid data, timeouts)
- **Coverage padding** — executing code without asserting
  meaningful outcomes

## What to Test

- Boundary conditions (empty, one, many, overflow)
- Error paths (invalid input, network failure, timeout,
  permission denied)
- State transitions (A->B allowed, A->C forbidden)
- Race conditions and ordering dependencies
- Integration between real components

## Mock Discipline

Mocks are a last resort:

- Mock external services (network, filesystem, clock,
  third-party APIs)
- Do NOT mock the thing you're testing
- Do NOT mock collaborators you own — use the real
  implementation
- 3+ mocks in one test means the design is too coupled —
  simplify first

## The Deletion Test

After writing a test, ask: "If I delete this test and introduce
a bug, will any other test catch it?" If yes, this test is
redundant — delete it.
