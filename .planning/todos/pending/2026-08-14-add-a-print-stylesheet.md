---
created: 2026-08-14T12:24:30.822Z
title: Add a print stylesheet
area: ui
files:
  - src/theme.css:77-236
  - ACCESSIBILITY.md:86-88
milestone: 0.2.0
order: 2
---

## Problem

The print stylesheet is listed under "Not tested" in ACCESSIBILITY.md, and the
theme ships no `@media print` block. Whatever Obsidian's Export to PDF produces
today is whatever the dark palette happens to do on paper.

Near-black backgrounds are the worst case for print: either the printer floods
the page with ink, or the driver drops the background and leaves near-white
body text on white paper — an unreadable export from a note-taking app whose
whole job is notes somebody keeps. The heading glow is a text-shadow, which
prints as a smear rather than a glow.

## Solution

Add an `@media print` block that stops trying to be a cyberpunk theme on paper:
white background, near-black text, no glow, no scanlines, no decorative
borders. Keep the type — the fonts are what make it recognisably Neonflux, and
they print fine.

Verify with Obsidian's own Export to PDF on `demo-vault/Kitchen Sink.md`, in
both themes, since the export follows the active colour scheme. Code blocks and
callouts are the two surfaces most likely to need explicit handling: both carry
a background that needs to become a border on paper.
