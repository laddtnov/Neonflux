---
created: 2026-08-14T12:24:30.822Z
title: Inspect Canvas and graph view
area: ui
files:
  - src/theme.css:77-377
  - ACCESSIBILITY.md:86-88
  - demo-vault/Kitchen Sink.md
milestone: 0.3.0
order: 3
---

## Problem

ACCESSIBILITY.md says Canvas and graph view are "token-mapped but were not
inspected". Token remapping is the theme's whole strategy and it usually works,
but these two surfaces are exactly where it is least likely to: both draw on a
canvas element with their own colour handling rather than composing ordinary
DOM, so a token that reads correctly everywhere else can land wrong here.

Graph view in particular renders node and link colours from accent tokens onto
its own background. A palette built for text on near-black has no guarantee
that a 2px node on a graph background clears anything.

## Solution

Open both in the demo vault, dark and light, and look. Specifically: node fill
versus graph background, link lines, the selected-node highlight, Canvas card
borders and their edges/arrows, and the Canvas selection handles.

The demo vault has no Canvas file and one note, so this needs a small Canvas
and a handful of linked notes added to `demo-vault/` first — worth committing,
since the next person to check this should not have to build the fixture again.

Any pair that turns out to be a real reading surface goes into `PAIRS` in
`scripts/check-contrast.js`; anything decorative gets recorded as decorative,
the way the pane divider and indent guide already are.
