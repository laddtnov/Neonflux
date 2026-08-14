---
created: 2026-08-14T12:24:30.822Z
title: Spot-check the popular community plugins
area: ui
files:
  - src/theme.css:77-377
  - README.md:100-120
milestone: 0.3.0
order: 4
---

## Problem

The README's central claim is that remapping Obsidian's design tokens "reaches
community plugins for free". That is the right bet and it is almost certainly
true in the main, but it has never been checked against a single plugin.

Plugins that draw their own surfaces — tables, boards, embedded editors — are
where the claim breaks: any plugin that hardcodes a colour, or that composes a
background from a token this theme repurposed, will look wrong in a way the
theme's own surfaces do not.

## Solution

Install the handful of plugins most likely to be in the same vault as this
theme — Dataview, Tasks, Kanban, Calendar, Excalidraw — put one of each into
the demo vault, and look at them in both themes.

The purpose is a verdict, not a rewrite: either the README's claim survives
first contact and can be stated with evidence, or it needs a specific
qualification and a small number of rules. If overrides turn out to be needed,
CONTRIBUTING.md requires a comment saying why a token could not do the job.

Keep the plugin fixtures out of the committed demo vault if they pull in
plugin config — the vault currently commits only `app.json`,
`core-plugins.json` and `appearance.json`, and that restraint is worth keeping.
