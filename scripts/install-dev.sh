#!/usr/bin/env bash
# Copy the theme into a vault so Obsidian picks it up.
#
# Copies rather than symlinks: Obsidian caches theme files and does not always
# follow a symlinked theme directory, which produces the worst possible
# debugging experience — edits that silently do nothing.
#
# Usage: scripts/install-dev.sh [/path/to/vault]
#        defaults to the bundled demo vault.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAULT="${1:-$ROOT/demo-vault}"
NAME="Neonflux"
DEST="$VAULT/.obsidian/themes/$NAME"

if [ ! -d "$VAULT" ]; then
  echo "No such vault: $VAULT" >&2
  exit 1
fi

mkdir -p "$DEST"
cp "$ROOT/theme.css" "$ROOT/manifest.json" "$DEST/"

echo "Installed '$NAME' into $VAULT"
echo "In Obsidian: Settings -> Appearance -> Themes, or Cmd-R to reload."
