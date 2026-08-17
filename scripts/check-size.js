#!/usr/bin/env node
/**
 * Fail if theme.css outgrows its budget.
 *
 * theme.css reached 189KB once and Obsidian's review flagged it. Nothing in
 * the repo noticed — scripts/build-fonts.js prints a size, but only to whoever
 * ran it by hand. That failure mode is quiet and slow: a weight creeps back in,
 * the file grows, and it surfaces months later as a rejected release.
 *
 * Two budgets rather than one, because the two halves fail for different
 * reasons and want different verdicts:
 *
 *   TOTAL    — what Obsidian's reviewer actually weighs. Grows for honest
 *              reasons too (the Style Settings block is coming), so it carries
 *              real headroom.
 *   PAYLOAD  — the base64 font data alone. This is the half that moves in
 *              large steps, and measuring it separately means 20KB of new
 *              stylesheet is never mistaken for a subset that crept back.
 *
 * Measured against the built theme.css rather than its sources: that single
 * file is the whole of what gets installed, so it is the only number with
 * consequences. Run scripts/build.js first — CI does.
 *
 * Run: node scripts/check-size.js
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KB = 1024;

/* Both numbers are ceilings with deliberate slack, not high-water marks — a
   budget that sits on today's size fails on the next routine font revision and
   gets raised reflexively until it means nothing.

   TOTAL 165KB. Raised once, from 150KB, and the reasoning is recorded here
   because a number bumped whenever it is inconvenient is not a budget:

     - 150KB was set when theme.css was 124KB and the only planned addition
       was Style Settings. Three accessibility features landed after it — the
       print stylesheet, forced-colors/prefers-contrast, and task-state icons
       — none of which existed when the figure was chosen, and together they
       account for the growth to 146KB.
     - The stylesheet, not the fonts, is what grew. The embedded payload has
       not moved from 103KB through any of it, which is exactly the split the
       two budgets exist to show.
     - 165KB still sits ~24KB below the 189KB that drew Obsidian's review
       flag, and leaves ~19KB for the Style Settings block.

   If this needs raising a second time, the honest move is probably to cut
   comment volume or revisit the Cyrillic companions rather than to keep
   lifting the ceiling toward the number that got the theme flagged.

   PAYLOAD 112KB: ~9KB above the current 103KB — enough that Google reissuing a
   face costs nobody an afternoon, far too little to hide a re-added subset.
   The `-ext` subsets alone were 64KB. Unchanged, and deliberately so. */
const BUDGETS = {
  total: 165 * KB,
  payload: 112 * KB,
};

const theme = readFileSync(join(ROOT, "theme.css"));

/* Each embedded face is one `src: url(data:font/woff2;base64,…)`. Summing the
   encoded text — not the decoded bytes — is right: base64 is what ships, and
   its ~33% overhead is a real cost of inlining, not an artefact of measuring. */
const faces = theme.toString("utf8").match(/base64,([A-Za-z0-9+/=]+)\)/g) ?? [];
const payload = faces.reduce((sum, face) => sum + face.length, 0);

const kb = (bytes) => `${(bytes / KB).toFixed(1)} KB`;

const checks = [
  {
    label: "theme.css",
    actual: theme.length,
    budget: BUDGETS.total,
    note: `${faces.length} embedded faces`,
  },
  {
    label: "font payload",
    actual: payload,
    budget: BUDGETS.payload,
    note: `${((payload / theme.length) * 100).toFixed(0)}% of the file`,
  },
];

let failed = false;

for (const { label, actual, budget, note } of checks) {
  const over = actual > budget;
  failed ||= over;

  const verdict = over
    ? `OVER by ${kb(actual - budget)}`
    : `${kb(budget - actual)} to spare`;

  console.log(
    `${over ? "✗" : "✓"} ${label.padEnd(13)}${kb(actual).padStart(9)} / ` +
      `${kb(budget).padEnd(9)} ${verdict.padEnd(18)} ${note}`,
  );

  if (over) {
    /* ::error:: renders as a GitHub annotation on the job; harmless noise in a
       local terminal, which is a fair trade for the fix landing where the
       failure is read. */
    console.error(
      `::error::${label} is ${kb(actual)}, over its ${kb(budget)} budget. ` +
        "Almost always a font subset or weight that crept back in — check " +
        "the GROUPS in scripts/build-fonts.js and re-run 'npm run build:fonts'. " +
        "If the growth is genuinely the stylesheet, raise the budget in " +
        "scripts/check-size.js and say why in the commit.",
    );
  }
}

process.exit(failed ? 1 : 0);
