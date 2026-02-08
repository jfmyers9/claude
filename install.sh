#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

mkdir -p "$CLAUDE_DIR"

# Files and directories to symlink
items=(
  "CLAUDE.md"
  "settings.json"
  "statusline.py"
  "skills"
  "rules"
  "agents"
)

for item in "${items[@]}"; do
  src="$SCRIPT_DIR/$item"
  dest="$CLAUDE_DIR/$item"

  if [ -e "$src" ]; then
    rm -rf "$dest"
    ln -sf "$src" "$dest"
    echo "Linked: $dest"
  fi
done

echo "Done"
