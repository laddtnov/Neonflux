---
created: 2026-08-14T12:24:30.822Z
title: Honour forced-colors and contrast preferences
area: ui
files:
  - src/theme.css:378-472
  - ACCESSIBILITY.md:86-88
---

## Problem

High-contrast / forced-colors mode is listed under "Not tested". The theme
already does the right thing for `prefers-reduced-motion` — every animation it
adds is dropped — so the pattern exists; the contrast preferences simply were
not covered.

In forced-colors mode the OS replaces colours wholesale, and a theme that draws
affordances with `box-shadow`, `text-shadow` or `background` rather than
`border` loses them silently: the focus ring, the control borders that
ACCESSIBILITY.md went out of its way to raise above 3:1, and the callout tints
all become invisible or indistinguishable. This is precisely the user least
able to absorb that.

## Solution

Add a `@media (forced-colors: active)` block that redraws affordances with
system colours and real borders — focus ring, control and checkbox borders,
callout edges, tag chips — and drops the glow, which carries no information.

While in there, consider `prefers-contrast: more`, which is cheaper: the
palette already has higher-contrast values in the light theme's tighter pairs,
so bumping muted text and the decorative borders is mostly reusing numbers
`scripts/check-contrast.js` already knows.

Add any new pairs to `PAIRS` in that script, as CONTRIBUTING.md requires.
