# Roadmap

Two milestones over the nine todos in `.planning/todos/pending/`.

The cut is **not** by importance — mobile matters more than a print
stylesheet, and it is in the later milestone anyway. It is by **what blocks the
work**. Everything in 0.2.0 can be written and verified on the machine this
theme is developed on. Everything in 0.3.0 is gated on a device, a platform, or
a fixture that does not exist yet, and no amount of care in an editor
substitutes for looking at it.

Splitting that way means 0.2.0 can ship on its own schedule instead of waiting
on a Windows machine to be free.

---

## 0.2.0 — Configurable, and correct where it can be checked

The theme stops being take-it-or-leave-it, and two rendering paths that are
currently broken-by-omission get written. All of it is CSS and Node, verifiable
in the Obsidian already installed here.

Ship in this order — the first item is a prerequisite, and the last wants
everything above it finished:

1. **Fail CI when theme.css exceeds a size budget** — *tooling*
   Goes first because item 3 adds bytes to the file Obsidian already flagged.
   Adding the guard after the thing it guards against is how the 189KB
   happened the first time.

2. **Add a print stylesheet** and **honour forced-colors and contrast
   preferences** — *ui*
   Paired because they are the same shape of work: a media block that stops
   the theme insisting on near-black and glow when the context cannot use
   them. Both are self-contained, need no hardware, and both currently fail
   silently for the user least able to work around it.

3. **Support the Style Settings plugin** — *ui*
   The headline feature, and last of the code items on purpose. Every toggle
   has to hold its contrast floors in both themes, so it wants the print and
   forced-colors paths already settled rather than being retrofitted across a
   matrix of toggle states.

4. **Add a light-mode screenshot to the gallery assets** — *docs*
   Last, so it photographs the finished release. Also the asset the release
   announcement needs.

**Why this is a coherent release:** a user can bend the theme to their reading,
and it stops breaking on paper and in high-contrast mode. That is one sentence
in a changelog, which is the test of whether a milestone is real.

---

## 0.3.0 — Verified everywhere it actually runs

Everything ACCESSIBILITY.md currently lists as untested, plus the README claim
that has never met a plugin. No new features — this milestone converts
assertions into evidence, and fixes whatever the evidence turns up.

Each item is blocked on access rather than on effort, so they can land in any
order as the means become available:

1. **Test and fix the theme on Obsidian mobile** — *ui*
   Needs a phone. Largest expected fallout: uppercase tracked headings in a
   narrow column, and a condensed body face at phone sizes.

2. **Check font rendering on Windows and Linux** — *ui*
   Needs those machines. Also the honest re-test of 0.1.1's extended-Latin
   trade-off, which was judged on macOS alone.

3. **Inspect Canvas and graph view** — *ui*
   Needs a Canvas file and a few linked notes added to `demo-vault/` — the
   fixture is part of the work and worth committing.

4. **Spot-check the popular community plugins** — *ui*
   Needs Dataview, Tasks, Kanban, Calendar and Excalidraw installed. The
   outcome is a verdict on the README's "reaches community plugins for free",
   not necessarily a code change.

**Why this is a coherent release:** the compatibility claims in the README and
the "Not tested" list in ACCESSIBILITY.md both shrink to something a reader can
trust. If the evidence forces a change — re-adding `latin-ext`, say — that is a
0.3.0 change, not a surprise in someone's vault.

---

## Not in either milestone

**Further size cuts.** Dropping the Cyrillic companions takes `theme.css` to
74KB, and it stays a documented option rather than a plan — it costs Ukrainian
and Russian notes their theme face. Revisit only if Obsidian's review flags
124KB, which it has not.

**An Obsidian Publish theme (`publish.css`).** A separate product with its own
size target and its own surfaces. Worth wanting; not worth mixing into a
milestone about the app theme.
