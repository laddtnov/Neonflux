#!/usr/bin/env node
/**
 * Build fonts/fonts.css — every woff2 inlined as a data: URI.
 *
 * Why inline rather than link: Obsidian is offline-first. A theme that fetches
 * fonts from a CDN on every launch leaks the user's IP to a third party and
 * stalls startup when there is no connection. Inlining costs file size and
 * buys a theme that is genuinely self-contained.
 *
 * Two groups of families, and the split is the point:
 *
 *   PRIMARY   — Orbitron, Rajdhani, Share Tech Mono. These define the look,
 *               and they are all Latin-only.
 *   CYRILLIC  — Unbounded, Exo 2, JetBrains Mono. Downloaded for their
 *               CYRILLIC SUBSETS ONLY, because their Latin is not wanted:
 *               the primary faces cover that.
 *
 * Nothing wires the two groups together at build time. Font fallback is
 * per-glyph, not per-run: a stack of `'Rajdhani', 'Exo 2'` uses Rajdhani for
 * every glyph Rajdhani has and Exo 2 only for the ones it does not — which is
 * exactly the Cyrillic. So the stacks in src/theme.css do the joining, and
 * this script only has to avoid shipping Latin twice.
 *
 * BASE SUBSETS ONLY — no `latin-ext`, no `cyrillic-ext`. Obsidian's review
 * flags a theme.css this size, and the whole file is font data: when this was
 * decided the authored stylesheet was 18KB of 189KB, and it has since grown to
 * 45KB against a smaller total. The `-ext` subsets were 64KB of that, spent on
 * glyphs this theme's users almost never type — `cyrillic-ext` is Church
 * Slavonic, Abkhaz and historic letterforms; `latin-ext` is Central-European
 * and Turkish diacritics. Dropping them keeps every glyph of English,
 * Ukrainian and Russian in the theme faces and costs a third of the file.
 *
 * The cost is real, just narrow: a Polish `ł` or a Czech `ř` now falls back to
 * the system UI font mid-word. Per-glyph fallback means only that character
 * changes face, not the paragraph. If that ever needs reversing, add the
 * subset back to the group below and re-run — nothing else in the build knows
 * about it.
 *
 * Run: node scripts/build-fonts.js
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "fonts", "fonts.css");
const LOCK = join(ROOT, "fonts", "fonts.lock.json");

/* Google serves these over HTTPS and nothing verifies what comes back. The
   bytes are then base64'd straight into the file every user installs, so an
   unexpected response ships to everyone. The lockfile turns that from silent
   into a failed build: each face is keyed by family/style/weight/subset — not
   by URL, which carries a version hash and changes whenever Google reissues —
   and its SHA-256 must match.

   A changed hash is not proof of an attack; a routine reissue looks the same.
   It means LOOK, then re-lock on purpose:

     UPDATE_FONT_LOCK=1 npm run build:fonts

   Faces absent from the lock are reported and recorded rather than failed,
   so adding one to GROUPS does not require a separate re-lock run. */
const RELOCK = process.env.UPDATE_FONT_LOCK === "1";
const keyOf = (face) =>
  `${face.family}|${face.style}|${face.weight}|${face.subset}`;

const lockOnDisk = existsSync(LOCK)
  ? new Map(JSON.parse(readFileSync(LOCK, "utf8")).faces.map((f) => [keyOf(f), f]))
  : new Map();

const locked = [];
const mismatches = [];

/** Compare one fetched face against the lock. Pure — see --self-check. */
const checkFace = (face, sha256, bytes, known) => {
  const entry = { ...face, bytes, sha256 };
  if (!known) return { entry, verdict: "new" };
  if (known.sha256 === sha256) return { entry, verdict: "match" };
  return { entry, verdict: "mismatch", was: known.sha256 };
};

if (process.argv.includes("--self-check")) {
  const assert = (ok, what) => {
    if (!ok) throw new Error(`self-check failed: ${what}`);
  };
  const f = { family: "X", style: "normal", weight: "400", subset: "latin" };
  assert(checkFace(f, "aa", 1, undefined).verdict === "new", "unknown face is new");
  assert(checkFace(f, "aa", 1, { sha256: "aa" }).verdict === "match", "same hash matches");
  const bad = checkFace(f, "bb", 1, { sha256: "aa" });
  assert(bad.verdict === "mismatch" && bad.was === "aa", "changed hash mismatches");
  assert(keyOf(f) === "X|normal|400|latin", "key shape");
  assert(keyOf({ ...f, subset: "cyrillic" }) !== keyOf(f), "subset is part of the key");
  console.log("self-check ok");
  process.exit(0);
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const GROUPS = [
  {
    label: "primary (Latin)",
    query: "family=Orbitron:wght@700&family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono",
    subsets: new Set(["latin"]),
  },
  {
    label: "Cyrillic companions",
    query: "family=Unbounded:wght@700&family=Exo+2:wght@400;600;700&family=JetBrains+Mono:wght@400",
    subsets: new Set(["cyrillic"]),
  },
];

/** Parse Google's CSS into faces, keeping only the wanted subsets. */
const facesFrom = (css, wanted) => {
  /* Google labels each @font-face with a subset comment above it, so splitting
     on those comments keeps each block paired with its label. */
  const chunks = css.split(/\/\*\s*([\w-]+)\s*\*\//).slice(1);
  const faces = [];
  for (let i = 0; i < chunks.length; i += 2) {
    const subset = chunks[i];
    const block = chunks[i + 1];
    if (!wanted.has(subset)) continue;
    const url = /url\((https:[^)]+\.woff2)\)/.exec(block)?.[1];
    if (!url) continue;
    faces.push({
      subset,
      url,
      family: /font-family:\s*'([^']+)'/.exec(block)?.[1],
      weight: /font-weight:\s*(\d+)/.exec(block)?.[1] ?? "400",
      style: /font-style:\s*(\w+)/.exec(block)?.[1] ?? "normal",
      unicodeRange: /unicode-range:\s*([^;]+);/.exec(block)?.[1]?.trim(),
    });
  }
  return faces;
};

/* Reproduced in full inside the generated CSS, not merely referenced.
   theme.css is installed on its own — Obsidian copies theme.css and
   manifest.json into a vault and nothing else — so a pointer to fonts/OFL.txt
   would leave every installed copy carrying the font binaries with no notice
   attached, which is precisely what OFL §1 requires to travel with them.
   Update this list if the font set changes. */
const FONT_NOTICES = [
  'Copyright 2018 The Orbitron Project Authors (https://github.com/theleagueof/orbitron), with Reserved Font Name: "Orbitron"',
  "Copyright (c) 2014, Indian Type Foundry (info@indiantypefoundry.com) — Rajdhani",
  "Copyright (c) 2012, Carrois Type Design, Ralph du Carrois (post@carrois.com), with Reserved Font Name 'Share' — Share Tech Mono",
  "Copyright 2022 The Unbounded Project Authors (https://github.com/googlefonts/unbounded)",
  "Copyright 2013 The Exo 2 Project Authors (https://github.com/googlefonts/Exo-2.0)",
  "Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)",
];

const out = [
  "/* Generated by scripts/build-fonts.js — do not edit by hand.",
  " *",
  " * EMBEDDED FONTS — SIL Open Font License 1.1",
  " * https://openfontlicense.org",
  " *",
  " * The font data below is licensed under the OFL 1.1, NOT this theme's MIT",
  " * licence. The OFL permits this redistribution. It also forbids selling the",
  " * fonts on their own, and requires that these notices accompany them:",
  " *",
  ...FONT_NOTICES.map((notice) => ` *   ${notice}`),
  " *",
  " * Full licence text: fonts/OFL.txt in the source repository, and shipped",
  " * as an asset on every release.",
  " *",
  " * The Cyrillic companions carry only their Cyrillic subsets. Their Latin is",
  " * deliberately absent — the primary faces cover it, and font fallback is",
  " * per-glyph, so the stacks in src/theme.css pick the right face per",
  " * character with no unicode-range trickery needed here.",
  " */",
  "",
];

let total = 0;
let count = 0;

for (const group of GROUPS) {
  const response = await fetch(
    `https://fonts.googleapis.com/css2?${group.query}&display=swap`,
    { headers: { "User-Agent": UA } },
  );
  if (!response.ok) {
    console.error(`Google Fonts CSS -> HTTP ${response.status}`);
    process.exit(1);
  }

  const faces = facesFrom(await response.text(), group.subsets);
  if (faces.length === 0) {
    console.error(`No faces matched for group: ${group.label}`);
    process.exit(1);
  }

  console.log(`\n${group.label}`);
  out.push(`/* ── ${group.label} ── */`, "");

  /* Google serves variable fonts as ONE file covering a weight range, but its
     CSS still emits a separate @font-face per requested weight, all pointing
     at the same URL. Inlining those naively embeds identical bytes two or
     three times — Exo 2 alone cost 88KB that way. Collapse them into one face
     with a weight RANGE, which is what a variable font wants anyway. */
  const byUrl = new Map();
  for (const face of faces) {
    const existing = byUrl.get(face.url);
    if (existing) existing.weights.push(Number(face.weight));
    else byUrl.set(face.url, { ...face, weights: [Number(face.weight)] });
  }

  for (const face of byUrl.values()) {
    const file = await fetch(face.url);
    if (!file.ok) {
      console.error(`${face.url} -> HTTP ${file.status}`);
      process.exit(1);
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    total += bytes.length;
    count += 1;

    const low = Math.min(...face.weights);
    const high = Math.max(...face.weights);
    const weight = low === high ? `${low}` : `${low} ${high}`;

    const identity = {
      family: face.family,
      style: face.style,
      weight,
      subset: face.subset,
    };
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const { entry, verdict, was } = checkFace(
      identity,
      sha256,
      bytes.length,
      lockOnDisk.get(keyOf(identity)),
    );
    locked.push(entry);
    if (verdict === "mismatch" && !RELOCK) {
      mismatches.push({ ...entry, was });
    }

    const mark =
      verdict === "match" ? "✓" : verdict === "new" ? "+" : RELOCK ? "~" : "✗";

    console.log(
      `  ${mark} ${face.family} ${weight} ${face.subset}`.padEnd(44) +
        `${(bytes.length / 1024).toFixed(1)} KB`,
    );

    out.push(
      "@font-face {",
      `  font-family: '${face.family}';`,
      `  font-style: ${face.style};`,
      `  font-weight: ${weight};`,
      "  font-display: swap;",
      `  src: url(data:font/woff2;base64,${bytes.toString("base64")}) format('woff2');`,
      ...(face.unicodeRange ? [`  unicode-range: ${face.unicodeRange};`] : []),
      "}",
      "",
    );
  }
}

/* Before anything is written. A mismatch means the bytes about to be inlined
   into every installed copy are not the bytes that were reviewed, so the
   build stops with fonts.css untouched rather than leaving a half-verified
   artifact on disk for someone to commit. */
if (mismatches.length > 0) {
  console.error(
    `\n${mismatches.length} font(s) do not match fonts.lock.json:\n` +
      mismatches
        .map(
          (m) =>
            `  ${m.family} ${m.weight} ${m.subset}\n` +
            `    locked ${m.was}\n` +
            `    got    ${m.sha256}`,
        )
        .join("\n") +
      "\n\nfonts.css was NOT written. Google reissuing a face looks identical " +
      "to a tampered response from here, so this is a prompt to look rather " +
      "than a verdict. If the change is expected, re-lock deliberately:\n" +
      "  UPDATE_FONT_LOCK=1 npm run build:fonts",
  );
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out.join("\n") + "\n");

locked.sort((a, b) =>
  `${a.family}${a.weight}`.localeCompare(`${b.family}${b.weight}`),
);
writeFileSync(
  LOCK,
  JSON.stringify(
    {
      comment:
        "SHA-256 of each woff2 embedded in fonts/fonts.css. Regenerate " +
        "deliberately: UPDATE_FONT_LOCK=1 npm run build:fonts",
      generated: new Date().toISOString().slice(0, 10),
      faces: locked,
    },
    null,
    2,
  ) + "\n",
);

const written = readFileSync(OUT).length;
console.log(
  `\n${count} faces, ${(total / 1024).toFixed(1)} KB of font data ` +
    `-> ${(written / 1024).toFixed(1)} KB of CSS (base64 costs ~33%).`,
);
