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
git commit && git push -u origin fix/whatever
gh pr create
```

## The two things that break

**`theme.css` is generated but committed.** `src/theme.css` is what you edit;
`theme.css` at the repo root is `fonts/fonts.css` + `src/theme.css`, and it is
the only file Obsidian loads. Editing the source without running
`npm run build` ships a stale theme that still looks right in your own vault,
because `npm run dev` installed the fresh copy there. CI rebuilds and fails on
the diff.

**Release tags carry no `v`.** Obsidian matches the release tag against
`manifest.json` exactly, and rejected the first release for tagging `v0.1.0`
against a manifest saying `0.1.0`. Use `npm run release 0.2.0`, which derives
the tag from the manifest and refuses a `v`.

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
