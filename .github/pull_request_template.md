## What changed

<!-- One or two sentences. Why, not just what. -->

## Checks

- [ ] `npm run build` was run and `theme.css` is committed
- [ ] `npm run check:contrast` passes
- [ ] Looked at it in Obsidian, **both themes**
- [ ] Looked at it in **Reading view and Live Preview** if any rule touches
      note content

<!--
Those last two are not ceremony. Every visual bug this theme has shipped was
invisible from the CSS and obvious in the app:

  - a blanket *:focus-visible drew a cyan rectangle around the whole editor
  - heading casing was applied only to Reading view's DOM, so headings changed
    shape when the cursor entered them
  - a checked radio was styled with an ::after that Gecko does not render on
    replaced elements

Reading view (.markdown-rendered) and Live Preview (.HyperMD-header-*, .cm-*)
are different DOMs. A rule that lands in one can miss the other entirely.
-->

## Screenshots

<!-- For anything visible. Dark and light if the change touches colour. -->

## Notes

<!-- Anything a reviewer would otherwise have to reverse-engineer: a token
     that had to move, a rule that could not be a token and why, an
     accessibility trade-off. -->
