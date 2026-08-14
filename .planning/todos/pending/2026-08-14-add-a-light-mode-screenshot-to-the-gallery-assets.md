---
created: 2026-08-14T12:24:30.822Z
title: Add a light-mode screenshot to the gallery assets
area: docs
files:
  - docs/screenshots/dark.png
  - docs/screenshots/README.md
  - README.md
milestone: 0.2.0
order: 4
---

## Problem

`docs/screenshots/` holds one image: `dark.png`. The README leads with the
theme's light mode being "not an afterthought", and then shows only the dark
one — the claim is asserted and never evidenced, to the exact audience deciding
whether to install.

The community themes gallery is a browsing surface. A theme with one screenshot
competes badly against one that shows what it looks like both ways.

## Solution

Capture a light-mode screenshot of `demo-vault/Kitchen Sink.md` framed like the
existing dark one — same note, same scroll position, same window size — so the
pair reads as a comparison rather than two unrelated images. Add it to the
README beside the dark shot.

While in there, check the gallery's own `screenshot.png` requirements: the
listing has strict size rules and submissions that ignore them get rejected by
the bot or the reviewer. Record whatever the current requirement is in
`docs/screenshots/README.md`, which is already the place this repo keeps that
kind of note.
