---
paths:
  - "**/*.rs"
---

# Rust

## Toolchain

Latest nightly, latest edition (check project config).

## Zero Warnings

- `cargo clippy -- -W clippy::all` after EVERY implementation
- Zero warnings before complete — do not present code with known warnings
- Never write code that will obviously warn (empty enums making types uninhabited, unused variables, dead code) and rationalize it as "expected" or "will go away later"
- If a construct warns without content, use a simpler construct that doesn't (e.g. flat struct instead of struct+empty enum)
- Avoid `#[allow(...)]` unless DIRECTLY instructed by user

## Validation

1. `cargo fmt`
2. `cargo clippy -- -W clippy::all`
3. `cargo test`
4. `cargo build`

## Dead Code

Remove immediately. Use `#[cfg(test)]` for test-only.

## Imports

All `use` at file top. No inline imports.

## Dependencies

Never assume crate versions from training data. Run `cargo search <crate>` to verify the latest version before adding any dependency.

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
