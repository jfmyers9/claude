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

# Hooks: symlink individual files (directory is shared with rtk)
mkdir -p "$CLAUDE_DIR/hooks"
for hook in "$SCRIPT_DIR/hooks/"*; do
  [ -f "$hook" ] || continue
  dest="$CLAUDE_DIR/hooks/$(basename "$hook")"
  rm -f "$dest"
  ln -sf "$hook" "$dest"
  echo "Linked: $dest"
done

# CLI tools
mkdir -p "$HOME/.local/bin"
ln -sf "$SCRIPT_DIR/bin/blueprint" "$HOME/.local/bin/blueprint"
echo "Linked: ~/.local/bin/blueprint"

echo "Done"
