#!/usr/bin/env bash
# Cut a release.
#
#   scripts/release.sh          release the version already in manifest.json
#   scripts/release.sh 0.2.0    open a PR bumping to that version, then release
#
# The tag is taken FROM manifest.json and carries no `v` prefix. Obsidian's
# community-theme bot installs assets from the release whose tag equals the
# manifest version exactly, so `v0.1.0` against a manifest saying `0.1.0` is
# rejected with "No release matches your manifest version". That is the whole
# reason this script exists: the sibling cyberpunk-ui repo uses `npm version`,
# which tags WITH a `v`, and carrying that habit across breaks the listing.
#
# THE BUMP GOES THROUGH A PULL REQUEST. An earlier version committed the new
# manifest.json straight to main and pushed. That works for a repository admin
# and only for an admin — the push is accepted, GitHub records "Bypassed rule
# violations for refs/heads/main", and the branch rule requiring a PR and two
# passing checks is silently skipped on the one commit that ships to users.
# So the bump is pushed to a release/<version> branch, merged by the normal
# rules with `--auto`, and the release is cut from main only once that merge
# has landed. Any contributor can run this now, and the release commit carries
# the same checks as every other commit.
#
# Two phases, and the second is resumable. If the merge is still waiting on
# checks when the wait window expires, nothing is lost: re-run the script with
# NO argument once the PR has merged and it picks up from the release step,
# because by then main already carries the version it needs.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPO="laddtnov/Neonflux"
die() { echo "error: $*" >&2; exit 1; }

# ── Repository preconditions ──────────────────────────────────────
# All of these run BEFORE the version bump, which edits manifest.json on a
# branch of its own. Checking for a dirty tree afterwards would flag the
# script's own edit and make the bump path impossible to use.
#
# The release notes are expected to be committed already — they belong in
# their own pull request, and an uncommitted docs/release-notes/<version>.md
# trips the dirty-tree check below rather than shipping unreviewed.
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

# ── Read the version, and refuse one that is already released ─────
read_version() {
  /usr/bin/sed -n 's/.*"version": "\([^"]*\)".*/\1/p' manifest.json | head -1
}

if [ $# -gt 0 ]; then
  VERSION="$1"
  [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
    die "version must be plain semver with no 'v': got '$VERSION'"
  BUMPED=1
  [ "$VERSION" != "$(read_version)" ] ||
    die "manifest.json already reads '$VERSION' — re-run with no argument to release it"
else
  VERSION="$(read_version)"
  BUMPED=0
  [ -n "$VERSION" ] || die "could not read version from manifest.json"
  [[ "$VERSION" != v* ]] || die "manifest version must not start with 'v': '$VERSION'"
fi

# Checked before the branch is created, so an already-released version costs
# nothing but an error message.
git rev-parse "$VERSION" >/dev/null 2>&1 &&
  die "tag '$VERSION' already exists locally — bump the version first"
if git ls-remote --exit-code --tags origin "refs/tags/$VERSION" >/dev/null 2>&1; then
  die "tag '$VERSION' already exists on origin — bump the version first"
fi

echo "Releasing $VERSION"

# ── Phase 1: bump the version through a pull request ──────────────
if [ "$BUMPED" -eq 1 ]; then
  BUMP_BRANCH="release/$VERSION"

  git rev-parse --verify -q "$BUMP_BRANCH" >/dev/null &&
    die "branch '$BUMP_BRANCH' already exists — delete it or re-run with no argument once merged"

  echo
  echo "This opens a pull request bumping manifest.json to $VERSION on $REPO,"
  echo "sets it to merge automatically once the checks pass, and then publishes"
  echo "tag $VERSION and a public release."
  read -r -p "Continue? [y/N] " reply
  [ "$reply" = "y" ] || [ "$reply" = "Y" ] || die "aborted"

  git checkout -q -b "$BUMP_BRANCH"

  # Leave no half-cut release behind: until the PR exists, any failure returns
  # the checkout to main and removes the branch. Dropped once the PR is open,
  # because from that point the branch is the thing being waited on.
  abandon_branch() {
    git checkout -q -- manifest.json 2>/dev/null || true
    git checkout -q main 2>/dev/null || true
    git branch -q -D "$BUMP_BRANCH" 2>/dev/null || true
    # The branch may already have been pushed — `gh pr create` failing after a
    # successful push is the common case here. Best-effort, because it has
    # usually not been pushed at all.
    git push -q origin --delete "$BUMP_BRANCH" 2>/dev/null || true
  }
  trap abandon_branch EXIT

  # A literal edit rather than a JSON tool, to keep the zero-dependency rule.
  /usr/bin/sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" manifest.json
  [ "$(read_version)" = "$VERSION" ] ||
    die "manifest.json still reads '$(read_version)' after the bump — check its format"

  git add manifest.json
  git commit -q -m "chore(release): $VERSION"
  git push -q -u origin "$BUMP_BRANCH"

  if [ -f "docs/release-notes/$VERSION.md" ]; then
    PR_BODY="Version bump for the $VERSION release. Notes are in \`docs/release-notes/$VERSION.md\`; the release is published from main once this merges."
  else
    PR_BODY="Version bump for the $VERSION release. No \`docs/release-notes/$VERSION.md\`, so the release notes will be generated from the commits since the last tag."
  fi

  gh pr create \
    --repo "$REPO" \
    --base main \
    --head "$BUMP_BRANCH" \
    --title "chore(release): $VERSION" \
    --body "$PR_BODY"

  trap - EXIT

  # --auto merges the moment the required checks pass, which is the whole
  # point: the release commit clears the same gate as every other commit
  # instead of an admin push stepping over it.
  #
  # It needs "Allow auto-merge" switched on in the repository settings. If it
  # is not, say so and keep waiting rather than failing — merging the PR by
  # hand from the web UI still goes through the branch rules, which is all
  # this script actually cares about.
  gh pr merge "$BUMP_BRANCH" --repo "$REPO" --squash --auto --delete-branch || {
    echo "  could not set auto-merge (is 'Allow auto-merge' enabled on the repo?)"
    echo "  merge the PR yourself — the wait below picks it up either way"
  }

  echo "  waiting for the bump PR to merge (checks must pass)"
  merged=0
  # ~10 minutes. CI here is a few seconds of Node; anything slower means a
  # check is failing or queued, and that is worth a human looking at it rather
  # than a script waiting all afternoon.
  for _ in $(seq 1 60); do
    state="$(gh pr view "$BUMP_BRANCH" --repo "$REPO" --json state --jq .state 2>/dev/null || echo UNKNOWN)"
    case "$state" in
      MERGED) merged=1; break ;;
      CLOSED) die "the bump PR was closed without merging — nothing was released" ;;
    esac
    sleep 10
  done

  git checkout -q main

  if [ "$merged" -eq 0 ]; then
    echo
    echo "The bump PR has not merged yet: $(gh pr view "$BUMP_BRANCH" --repo "$REPO" --json url --jq .url)"
    echo "Nothing has been released. Once it merges, finish with:"
    echo
    echo "  git pull && scripts/release.sh"
    exit 1
  fi

  git pull -q
  [ "$(read_version)" = "$VERSION" ] ||
    die "main does not carry version $VERSION after the merge — check the PR"
  # --delete-branch removed the remote one; this is its local counterpart.
  git branch -q -D "$BUMP_BRANCH" 2>/dev/null || true
  echo "  bump merged"
else
  # No bump to make, so the release is about to be published outright.
  echo
  echo "This publishes tag $VERSION and a public release on $REPO."
  read -r -p "Continue? [y/N] " reply
  [ "$reply" = "y" ] || [ "$reply" = "Y" ] || die "aborted"
fi

# ── Phase 2: publish ──────────────────────────────────────────────

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
