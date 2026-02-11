#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

# Install beads (bd) CLI — required for issue tracking and swarm execution
if ! command -v bd &>/dev/null; then
  echo "Installing beads CLI..."
  if curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash; then
    # Re-check after install (installer may update PATH)
    export PATH="$HOME/.local/bin:$HOME/go/bin:$PATH"
    if ! command -v bd &>/dev/null; then
      echo "Error: bd not found on PATH after install. You may need to restart your shell."
      exit 1
    fi
  else
    echo ""
    echo "Error: automatic install failed. Install beads (bd) manually:"
    echo ""
    echo "  curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash"
    echo "  npm install -g @beads/bd"
    echo "  brew install beads        # macOS only"
    echo "  go install github.com/steveyegge/beads/cmd/bd@latest"
    echo ""
    echo "See: https://github.com/steveyegge/beads"
    exit 1
  fi
fi

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

echo "Done"
