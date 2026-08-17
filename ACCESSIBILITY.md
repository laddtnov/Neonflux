# Accessibility review

State of the theme before publishing. Written after a pass in Obsidian 1.13.7
on macOS, dark and light, Reading view and Live Preview.

## Verified

`npm run check:contrast` passes. It resolves the tokens out of
`src/theme.css` and measures every pair a reader's eye lands on — 35 pairs
across four schemes: dark, light, and each of those again with the
`prefers-contrast: more` overrides applied on top.

The floors are role-aware, and stricter than the ones the sibling CSS kit
uses. A note-taking app is read for hours, so **muted text and syntax-highlight
colours are held to the 4.5:1 text floor**, not the 3.0 non-text floor. A code
comment is text somebody parses, not decoration.

Tightest passing margins, worth watching if the palette is ever retuned:

| Pair | Theme | Ratio |
| --- | --- | --- |
| success text | light | 4.59 |
| tag on tag background | light | 5.03 |
| H2 / links / accent | light | 5.10 |
| control border | light | 3.24 |
| checkbox border | dark | 3.37 |

## Fixed during the review

**A cyan rectangle around the whole note.** The focus ring started as a
blanket `*:focus-visible`. CodeMirror's editor element is focusable, so
clicking into a note drew a 2px ring around the entire editing surface. The
rule now excludes the editor and preview surfaces by name — their focus is
already shown by the text caret.

**Headings changed shape when you clicked into them.** Uppercase and letter
spacing were applied only to `.markdown-rendered`, which is Reading view.
Live Preview is a different DOM (`.HyperMD-header-*`), so a heading rendered
one way until you put the cursor in it. Both DOMs are styled now.

**Control borders were invisible.** `--background-modifier-border` measured
1.39:1 in dark. That token draws both decorative edges (table rules, callout
seams) and the border of a text field or checkbox — and on a form control the
border *is* the affordance, which puts it under WCAG 1.4.11's 3:1 floor.
Raising the shared token would have put a visible seam on every table in the
vault to fix a checkbox, so controls now take a separate
`--cyber-control-border` (3.37 dark / 3.24 light) and decorative edges stay
subtle.

**No Cyrillic.** Orbitron, Rajdhani and Share Tech Mono are all Latin-only, so
a note mixing Latin and Ukrainian rendered in two visibly different faces
mid-paragraph. Each face now has a Cyrillic companion in its stack — Exo 2
behind Rajdhani, Unbounded behind Orbitron, JetBrains Mono behind Share Tech
Mono — chosen to match the primary's character. Font fallback is per-glyph, so
no `unicode-range` rules are needed: the browser takes each character from the
first face in the stack that has it.

Verified by measuring rendered text width against the generic fallback, since
`document.fonts.check()` reports true for a fallback and cannot answer this:

| Stack | Cyrillic width | Reading |
| --- | --- | --- |
| `serif` (baseline) | 143.65 | — |
| `Rajdhani, serif` | 143.99 | Rajdhani has no Cyrillic |
| `Exo 2, serif` | 159.26 | Exo 2 does |
| `Rajdhani, Exo 2, serif` | 159.60 | the stack picks Exo 2 per glyph |
| `Exo 2, serif` on **Latin** | 121.08 = serif | no Latin shipped, as intended |

`scripts/font-check.html` reruns this against the built `theme.css`.

## Known and unresolved

Several of these now have a switch. With the [Style Settings][ss] plugin
installed, the glow, the uppercase headings, the `>_` prefix, the condensed
body face and the task-state colours can each be turned off. That does not
make the trade-offs below go away — the defaults are still the defaults, and
most users will never open that panel — so they are documented here as
honestly as before, with a note where a toggle exists.

Every setting is an opt-*out*, which is a deliberate constraint rather than a
phrasing preference: a toggle that defaulted to on would have to apply its
class by default, and the feature would then only work for people who have the
plugin. Phrased this way the theme is identical without it.

[ss]: https://github.com/mgmeyers/obsidian-style-settings

**The `>_` before every H1 is announced by screen readers.** It is CSS
generated content, and there is no reliable way to hide that from assistive
tech — `speak: never` is implemented nowhere that matters. A screen-reader
user hears "greater-than underscore" before every top-level heading in their
vault. Kept because it is the theme's signature and it is one short token.
**Turn off the `>_` prefix** in Style Settings, or delete the
`.markdown-rendered h1::before` rule, which removes it cleanly.

**Rajdhani is a display face doing a text face's job.** It is condensed with a
low x-height, which costs measurable reading speed over a long note. This was
a deliberate choice for the aesthetic — an earlier draft used a neutral
reading face for prose and the cyberpunk faces only for headings and chrome.
Users who feel it can override the text font in Settings → Appearance without
losing the palette, or use **Use the system font for body text** in Style
Settings, which hands back prose and keeps Orbitron on the headings.

**Extended Latin and extended Cyrillic fall back to the system font.** Only
the base `latin` and `cyrillic` subsets are embedded; the `-ext` subsets cost
64KB against an 18KB stylesheet and pushed `theme.css` past the size Obsidian's
review accepts. So a Polish `ł`, a Czech `ř`, a Turkish `ğ` — and on the
Cyrillic side, Church Slavonic and minority-language letters — render in the
system UI font. Fallback is per-glyph, so this shows up as one character in a
different face, not a paragraph that changes shape. Ukrainian and Russian are
fully covered by the `cyrillic` subset and are unaffected. Re-adding a subset
is one line in `scripts/build-fonts.js`.

**Print collapses both schemes to one paper palette.** White page, near-black
ink, no glow, fills replaced by hairlines. The type stays — the faces are what
make an export recognisably Neonflux, and they print fine.

Two things about Obsidian's export shaped that block, and both are the
opposite of the obvious assumption (verified against 1.13.7):

- **Export to PDF always renders light.** `printToPdf` strips `theme-dark` and
  adds `theme-light` before rendering, so the active scheme does not reach the
  page and the dark palette never floods a sheet with ink.
- **Print backgrounds are not dropped.** Obsidian sets
  `-webkit-print-color-adjust: exact`, an explicit instruction to reproduce
  every fill — so the light scheme's `#f0f0f5` page colour was being laid down
  edge to edge on every sheet, and callouts printed as solid blocks.

The dark path also had a bug no colour token could reach. Obsidian prints with
`color: initial` on the note, and `initial` for `color` is `canvastext`, which
resolves against the active `color-scheme` — under `.theme-dark`, that is
**white**. Every element without a colour of its own therefore printed white on
white: body prose, callout text and table cells disappeared, while headings,
links and code survived because each carries an explicit colour. The theme now
sets `color-scheme: light` in print and states the ink colour outright. Only
reachable through the non-export print paths, since Export to PDF forces light
before it renders — but it is one declaration to prevent.

Verified by rendering the print media directly — Obsidian's own `app.css` plus
`theme.css` over the same DOM `print()` builds — rather than by reading the
CSS. Syntax highlighting collapses to two weights on paper on purpose: six
hues that separate on screen become six near-identical greys on a mono
printer, which reads as a broken export rather than as colour.

**Forced colors replaces the palette, and the theme gets out of the way.** In
`forced-colors: active` the OS supplies every colour and the theme stops being
in charge — which is correct, and most of this theme survives it untouched:
the UA forces colours to system keywords and drops `text-shadow`, so the
heading glow removes itself with no rule needed. What does not survive is any
affordance drawn with a background and nothing else, so callouts, code blocks
and tag chips are given real borders, and the `>_` prefix drops its 55%
opacity — opacity is not forced, and a faint mark defeats the point of a
palette chosen for maximum separation.

Two findings there were worth the trip:

- **Blend modes are not reset by forced colors, and they erase content.**
  Obsidian composites callouts, search highlights and table selections with
  `mix-blend-mode`, `lighten` in dark and `darken` in light. Forced colors
  then supplies black text on a white backdrop — and `lighten` of black over
  white is white. The entire callout, text and border alike, rendered as blank
  page. `darken` fails identically against a dark system palette, so neither
  scheme was safe. Fixed at the token both derive from.
- **A checked task was indistinguishable from an open one.** The tick is a
  masked pseudo-element coloured by `background-color`, and the box fill is a
  background too, so both flattened to the page colour and every task looked
  open. The mask survives, so naming a system colour pair brings the real tick
  back.

**More contrast is a request, not a takeover.** Under `prefers-contrast: more`
the theme keeps its palette and moves only the tokens sitting closest to their
floors — muted and faint text, control borders, decorative edges — plus the
heading glow, which is a legibility cost paid for atmosphere. The neon accents
are already above 12:1 and are left alone. `scripts/check-contrast.js` checks
these as two further schemes, base-plus-overrides, so the raised values are
held to the same floors as the base palette.

**Not tested:** Windows and Linux rendering, mobile, and actual screen-reader
navigation (VoiceOver). Canvas and graph view are token-mapped but were not
inspected. Forced colors was verified under Chrome's emulation of it, which
drives the same code path a real high-contrast desktop does but is not the
same as sitting in front of Windows High Contrast — that check belongs with
the Windows testing in 0.3.0.
