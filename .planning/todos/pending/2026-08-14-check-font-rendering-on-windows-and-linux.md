---
created: 2026-08-14T12:24:30.822Z
title: Check font rendering on Windows and Linux
area: ui
files:
  - fonts/fonts.css
  - scripts/font-check.html
  - ACCESSIBILITY.md:86-88
---

## Problem

Everything about this theme has been verified on macOS only — ACCESSIBILITY.md
says so plainly. Font rendering is the part of that gap most likely to bite,
because it differs by platform in ways CSS cannot paper over: hinting,
subpixel antialiasing and stem darkening all differ, and Rajdhani is a
condensed, low-x-height face already noted as working hard at body size. What
reads as "tight but fine" on a Retina Mac can read as "thin and fuzzy" on a
1080p Windows display.

The 0.1.1 subset cut adds a second platform question. Extended Latin now falls
back to the system UI font, and that fallback is Segoe UI on Windows and
something distro-dependent on Linux — the mixed-face line looks different, and
possibly worse, than the macOS rendering that decision was judged against.

## Solution

Open `demo-vault/Kitchen Sink.md` on Windows and on a common Linux desktop,
both themes, and compare against the macOS reference. The Kitchen Sink already
carries the Latin, Cyrillic and Latin-ext lines needed for this, and
`scripts/font-check.html` gives the width measurements if a face is suspected
of not loading at all.

The likely outcomes are a body weight or letter-spacing adjustment, or an
explicit `-webkit-font-smoothing` decision. If the extended-Latin fallback
looks materially worse than it does on macOS, that is an argument for
re-adding `latin-ext` and finding the size elsewhere — record it either way,
because right now the trade-off is documented on the strength of one platform.
