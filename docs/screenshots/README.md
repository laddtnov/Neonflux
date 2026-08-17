Screenshots for the README and the Obsidian community themes listing.

`dark.png` is the one the README embeds. Capture it from the demo vault's
Kitchen Sink note in **Reading view** — the `>_` prompt before the H1 only
renders there.

## What the gallery actually takes

The listing does **not** read anything from `manifest.json`. It reads one entry
in `community-css-themes.json` in `obsidianmd/obsidian-releases`, and ours is:

```json
{
  "name": "Neonflux",
  "author": "Vladyslav",
  "repo": "laddtnov/Neonflux",
  "screenshot": "docs/screenshots/dark.png",
  "modes": ["dark", "light"]
}
```

Three things follow from that, and they are the reason this note exists:

- **One screenshot, not a gallery.** `screenshot` is a single repo-relative
  path. A second image is for the README only; the listing will never show it.
- **The filename is free.** Plenty of themes use `screenshot.png`, but the
  field is a path — `docs/screenshots/dark.png` is fine and needs no rename.
- **`modes` already claims both.** We assert light support in the registry, so
  the README showing only a dark capture is the claim going unevidenced in the
  one place people decide from.

## Size: the documented number is not the real one

The docs say "Recommended image dimensions: 512 x 288 pixels". Measured against
what is actually published, that recommendation is universally ignored — of ten
listed themes sampled from the registry:

| | width | ratio |
| --- | --- | --- |
| median | 2791 | 1.68 |
| range | 1280–3748 | 1.50–1.78 |
| at or below 512 wide | **0 of 10** | |

So 512×288 reads as a display hint rather than a constraint, and there is no
evidence a large image is rejected. Ship a retina-scale capture like everyone
else.

**The number worth matching is the aspect ratio, and ours misses it.**
`dark.png` is 2254×1682 — ratio 1.34, against a field clustered at 1.5–1.78.
That is squarer than every theme sampled, so in a grid of 16:9 thumbnails ours
is the one that letterboxes or crops. Frame future captures near **16:9**.

Re-measure before trusting the table above; it was taken from the registry at
one point in time and themes come and go.
