---
created: 2026-08-14T12:24:30.822Z
title: Support the Style Settings plugin
area: ui
files:
  - src/theme.css:20-76
  - src/theme.css:378-472
milestone: 0.2.0
order: 3
---

## Problem

Every choice this theme makes is currently take-it-or-leave-it, and two of them
are documented in ACCESSIBILITY.md as things a reader may legitimately reject:

- **Rajdhani is a display face doing a text face's job** — condensed, low
  x-height, measurably slower to read over a long note. The current advice is
  "override the text font in Settings → Appearance", which also throws away the
  theme's font stack for headings and code.
- **The `>_` before every H1** is announced by screen readers as "greater-than
  underscore". The only remedy offered is deleting a rule from `theme.css`,
  which a user loses on every theme update.

Style Settings is the standard answer in the Obsidian theme ecosystem and the
single biggest adoption lever available here — themes that support it get tried
and kept, because a reader can bend them instead of abandoning them.

## Solution

Add a `/* @settings */` YAML block to `src/theme.css`. Candidate toggles, each
one already a decision the theme makes silently:

- Accent hue (the palette is already built on `--accent-h`, so this is one
  variable)
- Heading glow on/off
- Uppercase + letter-spaced headings on/off
- The `>_` H1 prompt on/off
- Body font: Rajdhani (default) or the system reading font, keeping headings
  and code in the theme faces

Watch the size budget — the block is plain text and cheap, but it lands in the
same file Obsidian already flagged as large.

Every toggle must keep both themes inside the contrast floors, so
`scripts/check-contrast.js` needs to reason about the toggled states, not just
the defaults. That is the real work in this todo, not the YAML.
