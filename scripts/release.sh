#!/usr/bin/env bash
# Cut a release.
#
#   scripts/release.sh          release the version already in manifest.json
#   scripts/release.sh 0.2.0    set that version first, commit, then release
#
# The tag is taken FROM manifest.json and carries no `v` prefix. Obsidian's
# community-theme bot installs assets from the release whose tag equals the
# manifest version exactly, so `v0.1.0` against a manifest saying `0.1.0` is
# rejected with "No release matches your manifest version". That is the whole
# reason this script exists: the sibling cyberpunk-ui repo uses `npm version`,
# which tags WITH a `v`, and carrying that habit across breaks the listing.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPO="laddtnov/Neonflux"
die() { echo "error: $*" >&2; exit 1; }

# ── Repository preconditions ──────────────────────────────────────
# All of these run BEFORE the version bump. The bump edits manifest.json, so
# checking for a dirty tree afterwards would flag the script's own edit and
# make the bump path impossible to use.
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" = "main" ] || die "on branch '$BRANCH'; releases are cut from main"

if [ -n "$(git status --porcelain)" ]; then
  git status --short
  die "working tree is dirty — commit or stash first"
fi

git fetch -q origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] ||
  die "local main and origin/main differ — push or pull first"

# ── Verify, and check the built file is not stale ─────────────────
node scripts/check-contrast.js >/dev/null || die "contrast check failed"
echo "  contrast ok"

node scripts/build.js >/dev/null
# theme.css is generated but committed, so it can drift from its sources. A
# release shipping a stale theme.css is the kind of bug nobody notices for
# weeks, so rebuild and refuse if that moved the tree.
if ! git diff --quiet -- theme.css fonts/fonts.css; then
  git checkout -- theme.css fonts/fonts.css
  die "theme.css is out of date with its sources — run 'npm run build' and commit"
fi
echo "  build up to date"

# ── Optional version bump ─────────────────────────────────────────
BUMPED=0
if [ $# -gt 0 ]; then
  NEW="$1"
  [[ "$NEW" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
    die "version must be plain semver with no 'v': got '$NEW'"
  # A literal edit rather than a JSON tool, to keep the zero-dependency rule.
  /usr/bin/sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW\"/" manifest.json
  BUMPED=1
fi

VERSION="$(/usr/bin/sed -n 's/.*"version": "\([^"]*\)".*/\1/p' manifest.json | head -1)"
[ -n "$VERSION" ] || die "could not read version from manifest.json"
[[ "$VERSION" != v* ]] || die "manifest version must not start with 'v': '$VERSION'"
[ "$BUMPED" -eq 0 ] || [ "$VERSION" = "$NEW" ] ||
  die "manifest.json still reads '$VERSION' after the bump — check its format"

echo "Releasing $VERSION"

# Undo the bump if anything below fails, so a refused release leaves no
# half-applied version behind.
restore_on_failure() {
  [ "$BUMPED" -eq 1 ] && git checkout -- manifest.json 2>/dev/null || true
}
trap restore_on_failure EXIT

git rev-parse "$VERSION" >/dev/null 2>&1 &&
  die "tag '$VERSION' already exists locally — bump the version first"
if git ls-remote --exit-code --tags origin "refs/tags/$VERSION" >/dev/null 2>&1; then
  die "tag '$VERSION' already exists on origin — bump the version first"
fi

# ── Confirm, then publish ─────────────────────────────────────────
echo
echo "This publishes tag $VERSION and a public release on $REPO."
read -r -p "Continue? [y/N] " reply
[ "$reply" = "y" ] || [ "$reply" = "Y" ] || die "aborted"

# Past this point the bump should survive, so drop the restore trap before
# committing it — otherwise the EXIT trap would revert the file after the
# commit and leave the tree dirty.
trap - EXIT

if [ "$BUMPED" -eq 1 ]; then
  git add manifest.json
  git commit -m "chore(release): $VERSION"
  git push
fi

# Notes come from docs/release-notes/<version>.md when it exists; otherwise
# GitHub generates them from the commits since the last tag. Never read from
# stdin here — the script is interactive already, and a blocked read halfway
# through a release is the worst place to stall.
NOTES_FILE="docs/release-notes/$VERSION.md"
if [ -f "$NOTES_FILE" ]; then
  NOTES_ARGS=(--notes-file "$NOTES_FILE")
  echo "  notes: $NOTES_FILE"
else
  NOTES_ARGS=(--generate-notes)
  echo "  notes: generated from commits ($NOTES_FILE not found)"
fi

# The tag is created by the release API rather than pushed separately: a plain
# `git push origin <tag>` has intermittently returned 500 from this repo, and
# letting the API create it keeps tag and release atomic.
gh release create "$VERSION" \
  --repo "$REPO" \
  --target main \
  --title "Neonflux $VERSION" \
  "${NOTES_ARGS[@]}" \
  theme.css manifest.json fonts/OFL.txt

echo
echo "Released: https://github.com/$REPO/releases/tag/$VERSION"
echo "Assets: theme.css, manifest.json, OFL.txt"
