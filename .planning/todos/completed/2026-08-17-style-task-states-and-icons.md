---
created: 2026-08-17T18:40:00.000Z
title: Style task states and icons
area: ui
files:
  - src/theme.css
  - scripts/check-contrast.js:103-137
  - scripts/check-size.js:30-55
milestone: 0.2.0
order: 3
---

## Problem

A vault used for tracking wants more states than done/not-done, and the
community convention encodes them in the checkbox — `- [/]`, `- [>]`, `- [-]`.
Obsidian marks anything other than a space as checked, so every one of those
states rendered as the same cyan tick: a reviewing item and an adopted item
were indistinguishable.

Emoji status markers are the usual workaround, and they are wrong for this
theme twice over — they are colour the palette does not control, and they
break monospace alignment in a table.

The app's icons were a separate gap. Obsidian's callout defaults lean soft — a
pencil, a flame, a clipboard — against a theme whose whole vocabulary is
machined.

## Solution

Six states drawn as the literal character in the monospace face, coloured from
the existing named hues: `+` found, `?` reviewing, `/` testing, `x` adopted,
`>` waiting, `-` rejected. No SVG payload, and the marker is terminal output
rather than a picture of it. `x` keeps Obsidian's tick — every user of every
theme expects that — and takes only the green.

Waiting is the one state without an accent, because nothing is happening to
it. Rejected is pink rather than red, since `#ff4d4d` sits near the contrast
floor on this background.

Callout icons remapped by name to the machined end of the bundled lucide set.
App chrome icons are restyled through Obsidian's own icon tokens rather than
replaced: swapping the artwork means shipping a mask per icon, tens of KB
against a budgeted stylesheet, to redraw a set that is already geometric.

## Notes

Every lucide name was checked against the build Obsidian bundles — a name that
does not resolve renders no icon at all rather than falling back. The five new
glyph colours were added to `PAIRS`, as CONTRIBUTING requires; light "adopted"
is the tightest at 4.59.

This is the item that pushed `theme.css` past the 150KB ceiling, which was
raised to 165KB with the reasoning recorded in `scripts/check-size.js`.
