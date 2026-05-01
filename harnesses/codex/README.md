# Codex Adapter

Codex-specific settings for this workflow config.

Installed to `~/.codex/` and `~/.agents/` by:

```sh
./install.sh codex
```

Codex loads:

- `~/.codex/config.toml` for model, approvals, sandbox, and TUI defaults
- `AGENTS.md` from each repository as project instructions
- `$HOME/.agents/skills` for user-level Agent Skills
- `bin/blueprint` as a shared CLI

The installer links shared files:

- `harnesses/codex/config.toml` to `~/.codex/config.toml`
- `AGENTS.md` to `~/.codex/AGENTS.md` as a reference copy
- `rules/` to `~/.codex/rules-md` as reference Markdown
- `skills/` to `~/.agents/skills` for Codex discovery
- `rules/` to `~/.agents/rules` for shared skill references

If `~/.codex/config.toml` already exists as a real file, the installer
backs it up before linking the managed config.

Codex discovers skills by name with `$<skill-name>` mentions or by
matching the skill description. Use `/skills` in the Codex CLI to inspect
available skills.

For repository-local use, keep `AGENTS.md` in the repo root. Codex reads it
automatically when launched inside that repository.
