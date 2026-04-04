---
paths:
  - "**/*.rs"
---

# Rust

## Test Organization

Extract inline `mod tests {}` to separate files. Never add inline
test modules to `.rs` files.

- **Single-file module** — use `#[path]` sibling file:
  ```rust
  #[cfg(test)]
  #[path = "foo_tests.rs"]
  mod tests;
  ```
- **Directory module** (`foo/mod.rs`) — use `foo/tests.rs`

Pick one convention per crate. `#[path]` is less disruptive.

### Migration

- Split incrementally as you touch files
- Proactively split files where tests exceed ~200 lines
- `use super::*` at top of new file for private access
- Move test helpers with the tests; keep `#[cfg(test)]` helpers
  that live outside the test module in the source file
- Explicitly add test-only deps (`use pretty_assertions::assert_eq`, etc.)
