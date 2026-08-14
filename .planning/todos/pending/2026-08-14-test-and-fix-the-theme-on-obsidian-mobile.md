---
created: 2026-08-14T12:24:30.822Z
title: Test and fix the theme on Obsidian mobile
area: ui
files:
  - src/theme.css:20-76
  - ACCESSIBILITY.md:86-88
milestone: 0.3.0
order: 1
---

## Problem

ACCESSIBILITY.md lists mobile under "Not tested", and the theme contains no
mobile-specific rules at all — no `.is-mobile` handling, no touch-target
sizing, no check that the type scale survives a phone width.

A large share of Obsidian users read on a phone, and the community theme
listing shows mobile compatibility, so this is both a correctness gap and a
discovery one. The specific risks are guessable but unverified: uppercase,
letter-spaced headings wrap badly in a narrow column; a condensed body face at
phone sizes reads worse than it does on a laptop; and the tighter tap targets
of the mobile UI meet a theme that only ever tuned borders for a mouse.

## Solution

Install the built theme on a phone — the demo vault syncs, or copy
`theme.css` and `manifest.json` into a mobile vault's
`.obsidian/themes/Neonflux/` directly — and walk the same surfaces
`demo-vault/Kitchen Sink.md` already covers.

Obsidian exposes `.is-mobile` on the body, so fixes have a clean hook. Expect
heading letter-spacing and the type scale to need a narrow-width adjustment,
and check the `>_` H1 prompt does not push the heading into a wrap.

Record the result in ACCESSIBILITY.md either way — "tested, these three things
changed" or "tested, nothing needed" are both worth more than the current
silence.
