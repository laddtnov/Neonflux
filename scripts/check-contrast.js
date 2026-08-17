#!/usr/bin/env node
/**
 * WCAG contrast check for theme.css.
 *
 * A note-taking app is read for hours, so this checker is stricter than the
 * one in cyberpunk-ui: anything a reader's eye lands on to extract meaning is
 * held to 4.5:1, including syntax-highlight colours and muted metadata. Only
 * genuinely decorative chrome (borders, indent guides) is allowed the 3.0
 * non-text floor.
 *
 * It resolves `var(--x)` one level deep and knows nothing about the cascade,
 * so it can only check pairs declared in PAIRS below. It cannot see a colour
 * written inline in a rule rather than as a token — those need a human.
 *
 * No dependencies, no build. Run: node scripts/check-contrast.js
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Comments are stripped up front. Declarations are split on `;`, so a comment
   sitting between two declarations gets glued to the front of the next one and
   the token silently stops being checked — which is exactly the failure mode a
   contrast checker must not have. */
const CSS = readFileSync(join(ROOT, "src", "theme.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/* ── Parsing ──────────────────────────────────────────────────── */

/**
 * Pull the contents of the block opened by `selector` at the start of a line.
 * Anchoring to the line start matters: a bare indexOf would match the word
 * inside a comment, or match `body` inside `body.theme-dark`.
 */
const escapeForRegex = (text) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const blockFor = (selector, source = CSS) => {
  const opener = new RegExp(String.raw`^${escapeForRegex(selector)}\s*\{`, "m");
  const hit = opener.exec(source);
  if (!hit) return "";
  const open = hit.index + hit[0].length - 1;
  const close = source.indexOf("}", open);
  return close === -1 ? "" : source.slice(open + 1, close);
};

/**
 * Same, for a palette nested inside an `@media` block — where the selector is
 * indented and so invisible to the column-zero anchor above. That anchor is
 * load-bearing rather than incidental: it is what stops a lookup for
 * `.theme-dark` finding the copy inside `@media print` instead of the real
 * palette, so nested lookups are opt-in and say which block they mean.
 */
const nestedBlockFor = (selector, mediaQuery) => {
  const header = new RegExp(
    String.raw`@media\s*\(\s*${escapeForRegex(mediaQuery)}\s*\)\s*\{`,
  );
  const hit = header.exec(CSS);
  if (!hit) return "";

  /* Brace-matched, unlike blockFor: a media block contains nested blocks, so
     the first `}` closes a rule inside it rather than the block itself. */
  let depth = 0;
  let i = CSS.indexOf("{", hit.index);
  const start = i;
  for (; i < CSS.length; i += 1) {
    if (CSS[i] === "{") depth += 1;
    else if (CSS[i] === "}" && (depth -= 1) === 0) break;
  }

  const body = CSS.slice(start + 1, i);
  const inner = new RegExp(
    String.raw`^\s*${escapeForRegex(selector)}\s*\{`,
    "m",
  );
  const at = inner.exec(body);
  if (!at) return "";
  const open = at.index + at[0].length - 1;
  const close = body.indexOf("}", open);
  return close === -1 ? "" : body.slice(open + 1, close);
};

/** `--name: value;` pairs in a block, as a Map. */
const declarationsIn = (block) => {
  const found = new Map();
  for (const line of block.split(";")) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    const name = line.slice(0, at).trim();
    if (!name.startsWith("--")) continue;
    found.set(name, line.slice(at + 1).trim());
  }
  return found;
};

/** Resolve `var(--x)` against a token map, then normalise to #rrggbb. */
const resolve = (value, tokens, depth = 0) => {
  if (!value || depth > 4) return null;
  const alias = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value);
  if (alias) return resolve(tokens.get(alias[1]), tokens, depth + 1);

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!hex) return null;
  const digits = hex[1];
  return digits.length === 3
    ? `#${[...digits].map((d) => d + d).join("")}`.toLowerCase()
    : `#${digits.toLowerCase()}`;
};

/* ── WCAG maths ───────────────────────────────────────────────── */

const channel = (eightBit) => {
  const c = eightBit / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* ── What gets checked ────────────────────────────────────────────
   [foreground, background, floor, label]

   4.5 = the reader reads it to extract meaning (WCAG 1.4.3).
   3.0 = decorative or structural only (WCAG 1.4.11). Used sparingly —
         in a reading app, "muted" text is still text.                */

const PAIRS = [
  ["--text-normal", "--background-primary", 4.5, "body text"],
  ["--text-muted", "--background-primary", 4.5, "muted text"],
  ["--text-faint", "--background-primary", 3.0, "faint text (decorative)"],
  ["--text-normal", "--background-secondary", 4.5, "text on sidebar"],
  ["--text-muted", "--background-secondary", 4.5, "muted text on sidebar"],
  ["--h1-color", "--background-primary", 4.5, "H1"],
  ["--h2-color", "--background-primary", 4.5, "H2"],
  ["--link-color", "--background-primary", 4.5, "internal link"],
  ["--link-external-color", "--background-primary", 4.5, "external link"],
  ["--link-unresolved-color", "--background-primary", 4.5, "unresolved link"],
  ["--text-accent", "--background-primary", 4.5, "accent text"],
  ["--text-on-accent", "--interactive-accent", 4.5, "text on accent button"],
  ["--text-error", "--background-primary", 4.5, "error text"],
  ["--text-success", "--background-primary", 4.5, "success text"],
  ["--text-warning", "--background-primary", 4.5, "warning text"],
  ["--blockquote-color", "--background-primary", 4.5, "blockquote"],
  ["--tag-color", "--tag-background", 4.5, "tag"],
  ["--code-normal", "--code-background", 4.5, "code: plain"],
  ["--code-comment", "--code-background", 4.5, "code: comment"],
  ["--code-keyword", "--code-background", 4.5, "code: keyword"],
  ["--code-string", "--code-background", 4.5, "code: string"],
  ["--code-function", "--code-background", 4.5, "code: function"],
  ["--code-value", "--code-background", 4.5, "code: value"],
  ["--code-property", "--code-background", 4.5, "code: property"],
  ["--code-operator", "--code-background", 4.5, "code: operator"],
  ["--nav-item-color", "--background-secondary", 4.5, "sidebar item"],
  ["--nav-item-color-active", "--background-secondary", 4.5, "sidebar item active"],
  /* WCAG 1.4.11 wants 3:1 for the boundary that identifies a control. In
     Obsidian this token draws text-input and form-field borders, where the
     border IS the affordance, so the floor applies. */
  ["--cyber-control-border", "--background-primary", 3.0, "control border"],
  ["--cyber-control-border", "--background-secondary", 3.0, "control border (sidebar)"],
  ["--checkbox-border-color", "--background-primary", 3.0, "checkbox border"],
];

/* Purely decorative: pane dividers and indent guides carry no information a
   user must perceive to operate anything, so 1.4.11 does not reach them. They
   are printed for eyes-on review, never failed. */
const ADVISORY = [
  ["--divider-color", "--background-primary", "pane divider"],
  ["--indentation-guide-color", "--background-primary", "indent guide"],
  ["--background-modifier-border", "--background-primary", "decorative edge"],
];

/* ── Run ──────────────────────────────────────────────────────── */

const base = {
  dark: declarationsIn(blockFor(".theme-dark")),
  light: declarationsIn(blockFor(".theme-light")),
};

/* `prefers-contrast: more` overrides a handful of tokens and inherits the
   rest, so each variant is checked as base-plus-overrides rather than on its
   own. Checking only the overridden tokens would miss the pair that matters
   most: a raised foreground against a background that did not move. */
const MORE_CONTRAST = "prefers-contrast: more";
const moreContrast = {
  dark: declarationsIn(nestedBlockFor(".theme-dark", MORE_CONTRAST)),
  light: declarationsIn(nestedBlockFor(".theme-light", MORE_CONTRAST)),
};

if (moreContrast.dark.size === 0 || moreContrast.light.size === 0) {
  console.error(
    `No palette found under @media (${MORE_CONTRAST}) for both schemes.\n` +
      "The theme ships one; if it was removed on purpose, drop the variants " +
      "from SCHEMES here too rather than leaving a check that silently " +
      "re-tests the base palette under another name.",
  );
  process.exit(1);
}

const THEMES = [
  ["dark", base.dark],
  ["light", base.light],
  ["dark + more contrast", new Map([...base.dark, ...moreContrast.dark])],
  ["light + more contrast", new Map([...base.light, ...moreContrast.light])],
];

const shared = declarationsIn(blockFor("body"));

let failures = 0;
let unresolved = 0;

for (const [themeName, ownTokens] of THEMES) {
  const tokens = new Map([...shared, ...ownTokens]);
  console.log(`\n${themeName} theme`);
  console.log("-".repeat(64));

  for (const [fgName, bgName, floor, label] of PAIRS) {
    const fg = resolve(tokens.get(fgName), tokens);
    const bg = resolve(tokens.get(bgName), tokens);

    if (!fg || !bg) {
      unresolved += 1;
      const missing = !fg ? fgName : bgName;
      console.log(`  ${label.padEnd(26)} SKIPPED — cannot resolve ${missing}`);
      continue;
    }

    const ratio = contrast(fg, bg);
    const ok = ratio >= floor;
    if (!ok) failures += 1;
    const verdict = ok ? "PASS" : "FAIL";
    console.log(
      `  ${label.padEnd(26)} ${fg} on ${bg}  ${ratio.toFixed(2).padStart(5)}  need ${floor}  ${verdict}`,
    );
  }

  for (const [fgName, bgName, label] of ADVISORY) {
    const fg = resolve(tokens.get(fgName), tokens);
    const bg = resolve(tokens.get(bgName), tokens);
    if (!fg || !bg) continue;
    console.log(
      `  ${label.padEnd(26)} ${fg} on ${bg}  ${contrast(fg, bg).toFixed(2).padStart(5)}  decorative`,
    );
  }
}

console.log("");
if (unresolved > 0) {
  console.log(
    `${unresolved} pair(s) skipped — a token is missing or not a plain hex.\n` +
      `Every pair in PAIRS should resolve; a skip means the theme lost a token.`,
  );
}
if (failures > 0) {
  console.error(`${failures} contrast failure(s).`);
  process.exit(1);
}
if (unresolved > 0) process.exit(1);
console.log("All contrast checks passed.");
