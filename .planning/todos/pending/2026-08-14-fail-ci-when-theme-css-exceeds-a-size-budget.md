---
created: 2026-08-14T12:24:30.822Z
title: Fail CI when theme.css exceeds a size budget
area: tooling
files:
  - .github/workflows/ci.yml:20-45
  - scripts/build.js:30-33
---

## Problem

`theme.css` reached 189KB and Obsidian's review flagged it. Nothing in the repo
noticed. 0.1.1 cut it to 124KB, and nothing in the repo will notice if it grows
back — `scripts/build-fonts.js` prints the size, but only to a human running it
by hand, and the CI job checks freshness and contrast, not weight.

The failure mode is quiet and slow: a font weight gets added, the file grows
30KB, nobody looks, and it surfaces months later as a review rejection on a
release nobody wants to redo.

## Solution

Add a budget check to CI, and make it fail rather than warn. Two numbers rather
than one is worth it here, because the two halves fail differently:

- Whole `theme.css` — a hard ceiling somewhere above the current 124KB with
  enough headroom for the Style Settings block, but well under the ~189KB that
  drew the flag.
- Embedded font payload alone — this is what actually moves, and separating it
  means a genuine stylesheet addition is not mistaken for font bloat.

The check belongs next to the existing freshness step in `ci.yml`, using the
same zero-dependency Node the other scripts use. The error message should name
the budget, the actual size, and point at `scripts/build-fonts.js`, since the
fix is almost always a subset or a weight that crept back in.
