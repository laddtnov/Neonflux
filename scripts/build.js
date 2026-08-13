#!/usr/bin/env node
/**
 * Assemble the shipped theme.css from its two parts.
 *
 * An Obsidian theme is a single file — the app loads theme.css and nothing
 * else, and CSS @import of a sibling file is not reliable inside a theme
 * folder. So the embedded @font-face rules and the authored stylesheet have to
 * end up concatenated. src/theme.css is what a human edits; theme.css is a
 * build artifact and should never be edited directly.
 *
 * Run: node scripts/build.js
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const fonts = readFileSync(join(ROOT, "fonts", "fonts.css"), "utf8");
const theme = readFileSync(join(ROOT, "src", "theme.css"), "utf8");

const banner = `/* GENERATED FILE — edit src/theme.css, then run: npm run build
 * ============================================================
 * theme.css = fonts/fonts.css + src/theme.css
 */

`;

writeFileSync(join(ROOT, "theme.css"), banner + fonts + "\n" + theme);

const size = readFileSync(join(ROOT, "theme.css")).length;
console.log(`theme.css written — ${(size / 1024).toFixed(1)} KB`);
