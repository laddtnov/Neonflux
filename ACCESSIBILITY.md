# Accessibility review

State of the theme before publishing. Written after a pass in Obsidian 1.13.7
on macOS, dark and light, Reading view and Live Preview.

## Verified

`npm run check:contrast` passes. It resolves the tokens out of
`src/theme.css` and measures every pair a reader's eye lands on, in both
themes — 31 pairs each.

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

**The `>_` before every H1 is announced by screen readers.** It is CSS
generated content, and there is no reliable way to hide that from assistive
tech — `speak: never` is implemented nowhere that matters. A screen-reader
user hears "greater-than underscore" before every top-level heading in their
vault. Kept because it is the theme's signature and it is one short token.
Deleting the `.markdown-rendered h1::before` rule removes it cleanly.

**Rajdhani is a display face doing a text face's job.** It is condensed with a
low x-height, which costs measurable reading speed over a long note. This was
a deliberate choice for the aesthetic — an earlier draft used a neutral
reading face for prose and the cyberpunk faces only for headings and chrome.
Users who feel it can override the text font in Settings → Appearance without
losing the palette.

**Not tested:** Windows and Linux rendering, mobile, the print stylesheet,
high-contrast / forced-colors mode, and actual screen-reader navigation
(VoiceOver). Canvas and graph view are token-mapped but were not inspected.
