#!/usr/bin/env node
/**
 * README sync checker — guards the 10 localized READMEs against drift.
 *
 * Version strings are read from `src/version.ts` instead of being hardcoded
 * here (v1.1.7 fix — every release used to require hand-editing this comment
 * and the two literals below, and one release forgot).
 *
 *   1. the version badge must match the current release
 *   2. the README must link docs/releases/<current>.md
 *   3. the README must embed assets/corner-menu.svg (v1.1.5 corner panels)
 *   4. the README must embed assets/settings-sections.svg (v1.1.6 settings tour)
 *   5. the README must embed assets/palette-ribbon.svg + architecture.svg +
 *      release-tiers.svg (v1.1.7 additions)
 *   6. historical release rows keep their original claims (v1.1.5 → 113 tests,
 *      v1.1.4 → 61 tests) — history must never be rewritten
 *   7. no stray previous-version badge anywhere
 *   8. every release row carries a tier chip (PATCH · UPDATE · MAJOR)
 *
 * Exits non-zero with a per-file report on any violation (CI gate).
 */
import { readFileSync } from "node:fs";

const versionTs = readFileSync("src/version.ts", "utf8");
const match = /APP_VERSION\s*=\s*"([\d.]+)"/.exec(versionTs);
if (!match) {
  console.error("✗ src/version.ts does not export a literal APP_VERSION");
  process.exit(1);
}
/** Current release, e.g. "1.1.8" — never hardcoded below. */
const VERSION = match[1];
const BADGE = `version-${VERSION}-`;
const RELEASE_DOC = `docs/releases/v${VERSION}.md`;
const TIER_CHIP = /(\| 🩷 \*\*MAJOR\*\* \||\| 🟡 \*\*UPDATE\*\* \||\| 🟣 \*\*PATCH\*\* \|)/;

const FILES = [
  "README.md", "README.en.md", "README.zh.md", "README.ja.md", "README.ko.md",
  "README.es.md", "README.fr.md", "README.th.md", "README.de.md", "README.pt.md",
];

let failures = 0;
for (const file of FILES) {
  const s = readFileSync(file, "utf8");
  const problems = [];
  if (!s.includes(BADGE)) problems.push(`badge is not ${VERSION}`);
  if (!s.includes(RELEASE_DOC)) problems.push(`missing ${RELEASE_DOC} link`);
  if (!s.includes(`[v${VERSION}](${RELEASE_DOC})`)) problems.push(`missing the v${VERSION} releases row`);
  if (!s.includes("assets/corner-menu.svg")) problems.push("missing corner-menu.svg embed");
  if (!s.includes("assets/settings-sections.svg")) problems.push("missing settings-sections.svg embed");
  if (!s.includes("assets/palette-ribbon.svg")) problems.push("missing palette-ribbon.svg embed");
  if (!s.includes("assets/architecture.svg")) problems.push("missing architecture.svg embed");
  if (!s.includes("assets/release-tiers.svg")) problems.push("missing release-tiers.svg embed");
  if (s.includes("version-1.1.6-f5a81c") || s.includes("version-1.1.5-f5a81c")) problems.push("stale badge");
  for (const stale of ["1.1.4-f5a81c", "1.1.3-f5a81c"]) {
    if (s.includes(stale)) problems.push("stale badge");
  }

  const rows = s.split("\n");
  const rowFor = (v) => rows.find((l) => l.startsWith(`| [v${v}](docs/releases/v${v}.md)`));
  const row115 = rowFor("1.1.5");
  if (!row115) problems.push("missing historical v1.1.5 releases row");
  else if (!/113/.test(row115)) problems.push("historical v1.1.5 row must keep 113 tests");
  const row114 = rowFor("1.1.4");
  if (!row114) problems.push("missing historical v1.1.4 releases row");
  else if (!/61/.test(row114)) problems.push("historical v1.1.4 row must keep 61 tests");

  const currentRow = rowFor(VERSION);
  if (currentRow && !TIER_CHIP.test(currentRow)) problems.push(`v${VERSION} row has no tier chip`);
  const oldestRow = rowFor("1.0.0");
  if (!oldestRow || !oldestRow.includes("🩷 **MAJOR**")) problems.push("v1.0.0 row must be tagged MAJOR");

  if (problems.length) {
    failures += problems.length;
    console.error(`✗ ${file}: ${problems.join("; ")}`);
  } else {
    console.log(`✓ ${file} — v${VERSION}`);
  }
}
if (failures) {
  console.error(`\n${failures} problem(s) found`);
  process.exit(1);
}
console.log(`\nAll 10 READMEs in sync at v${VERSION}.`);
