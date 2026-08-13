# Cyberpunk Terminal

An Obsidian theme. Neon on near-black, machined edges, Orbitron headings over
a `>_` prompt. Light mode included and not an afterthought.

Palette shared with [`@laddtnov/cyberpunk-ui`](https://github.com/laddtnov/cyberpunk-ui).

## Install

Not yet in the community themes list. To try it now:

```sh
git clone https://github.com/laddtnov/cyberpunk-obsidian
cd cyberpunk-obsidian
npm run build
scripts/install-dev.sh /path/to/your/vault
```

Then pick it in Settings → Appearance → Themes.

## Development

`src/theme.css` is the file a human edits. `theme.css` at the repo root is a
build artifact — fonts prepended to the source — and is what Obsidian loads.

```sh
npm run build           # src/theme.css + fonts -> theme.css
npm run check:contrast  # WCAG check, both themes
npm run dev             # build, then install into demo-vault/
npm run build:fonts     # re-download and re-inline the fonts (rarely needed)
```

`demo-vault/` is a throwaway vault whose single note exercises every surface
the theme touches. Open it in Obsidian and reload with `Cmd-R` after a build.

### How it is built

Almost entirely by **remapping Obsidian's own design tokens** rather than
overriding its rules. Token remapping survives app updates and reaches
community plugins for free; rule overrides break on both counts. The handful
of real rules each carry a comment explaining why a token could not do the
job.

Setting `--accent-h/s/l` and the `--color-base-*` ramp is what makes the theme
reach surfaces no rule here mentions — sliders, toggles, callouts, the graph.

### Fonts

Orbitron, Rajdhani and Share Tech Mono are **embedded as base64 woff2**, not
linked from a CDN. Obsidian is offline-first: a theme that fetches fonts on
every launch leaks the user's IP to a third party and stalls startup without a
connection. Cost is about 85KB of the ~101KB `theme.css`.

All three are SIL Open Font License 1.1, which permits this redistribution.
Licence text in [`fonts/OFL.txt`](fonts/OFL.txt).

They are **Latin-only** — see the accessibility notes.

## Accessibility

Contrast is enforced by `scripts/check-contrast.js`, with floors stricter than
the sibling CSS kit uses: muted text and syntax colours are held to 4.5:1, not
3.0, because a note-taking app is read for hours and a code comment is text
somebody parses.

[`ACCESSIBILITY.md`](ACCESSIBILITY.md) records what passes, what was fixed,
and — more usefully — the three known problems that remain, including the
Cyrillic gap and the screen-reader announcement of the `>_` prompt.

## Licence

MIT for the theme. The bundled fonts are OFL 1.1.
