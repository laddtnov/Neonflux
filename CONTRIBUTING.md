# Contributing

## Workflow

Work on a branch and open a pull request. Nothing goes straight to `main` —
CI and the security review only run on pull requests, so a direct push skips
every check this repo has.

```sh
git checkout -b fix/whatever
# edit src/theme.css
npm run dev            # build + install into demo-vault/
# look at it in Obsidian, Cmd-R to reload
npm run check:contrast
npm run check:size
git commit && git push -u origin fix/whatever
gh pr create
```

## The three things that break

**`theme.css` is generated but committed.** `src/theme.css` is what you edit;
`theme.css` at the repo root is `fonts/fonts.css` + `src/theme.css`, and it is
the only file Obsidian loads. Editing the source without running
`npm run build` ships a stale theme that still looks right in your own vault,
because `npm run dev` installed the fresh copy there. CI rebuilds and fails on
the diff.

**`theme.css` has a size budget, and CI enforces it.** The file is ~83% inlined
font data, it reached 189KB once, and Obsidian's review flagged it. Two
ceilings now fail the build: 150KB for the whole file and 112KB for the font
payload alone, both in `scripts/check-size.js`. Split that way because a font
subset creeping back and the stylesheet honestly growing are different
problems. Going over is nearly always the former — check the `GROUPS` in
`scripts/build-fonts.js`. If it is genuinely the latter, raise the budget and
say why in the commit; a number quietly bumped whenever it is inconvenient is
not a budget.

**Release tags carry no `v`.** Obsidian matches the release tag against
`manifest.json` exactly, and rejected the first release for tagging `v0.1.0`
against a manifest saying `0.1.0`. Use `npm run release 0.2.0`, which derives
the tag from the manifest and refuses a `v`.

That command opens a pull request for the version bump, waits for it to merge
under the normal branch rules, and only then publishes the tag and release —
it does not push to `main`. Write `docs/release-notes/<version>.md` first, in
its own pull request: the script reads it for the release body, and refuses to
run at all with an uncommitted tree. If the bump PR is still waiting on checks
when the script's wait window ends, nothing has been released — `git pull &&
npm run release` with no version finishes the job.

## Style

Prefer **remapping Obsidian's design tokens** over overriding its rules. Token
remapping survives app updates and reaches community plugins for free; rule
overrides do neither. Where a rule is unavoidable, leave a comment saying why
a token could not do the job — several already do.

Contrast floors are enforced by `scripts/check-contrast.js` and are stricter
than a typical web project: muted text and syntax-highlight colours are held
to 4.5:1, not 3.0, because a note app is read for hours and a code comment is
text somebody parses. Adding a colour token means adding its pair to `PAIRS`
in that script.

That script checks **four** schemes, not two: dark and light, plus each one
again with the `@media (prefers-contrast: more)` overrides applied on top.
A token raised there is checked against a background that may not have moved,
which is the pair most likely to be wrong. It finds those nested palettes by
name, so it fails loudly if the media block is renamed or removed rather than
silently re-testing the base palette twice.

## Adding a Style Settings toggle

The annotated `@settings` block lives in `src/theme.css` beside the rules it
drives. Two rules for anything added to it:

**Phrase it as an opt-out.** A `class-toggle` applies its id to `body` when
enabled, so a setting that defaults to on would only work for people who have
the plugin installed — everyone else would lose the feature. Every toggle
turns something off, and the theme is identical without the plugin.

**Expose a decision the theme has already defended.** Each of the five is a
trade-off ACCESSIBILITY.md documents and argues for. A knob for something that
has not been reasoned about in public is inventing an option, not surfacing
one, and every toggle multiplies the states the contrast floors have to hold
across.

The block is YAML inside a CSS comment, so a typo silently produces no panel
rather than an error. Style Settings finds it with
`/\/\*!?\s*@settings[\r\n]+?([\s\S]+?)\*\//` and needs `name`, `id` and a
non-empty `settings` list.

## Testing a change

There is no unit test suite; the app is the test. At minimum, look at the
change in Obsidian in **both themes** and, if it touches note content, in both
**Reading view** and **Live Preview** — they are different DOMs, and every
visual bug this theme has shipped was invisible from the CSS.

`scripts/font-check.html` verifies font coverage by measuring rendered glyph
widths against the generic fallback; `document.fonts.check()` cannot answer
that question, because it returns true for a fallback.

Known limitations and the reasoning behind the accessibility trade-offs are in
[ACCESSIBILITY.md](ACCESSIBILITY.md).
