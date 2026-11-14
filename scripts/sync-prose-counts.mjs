/**
 * Rewrite the *prose* test counts in the ten READMEs.
 *
 * WHY THIS EXISTS SEPARATELY FROM `sync-test-badge.mjs`
 * ----------------------------------------------------
 * The badge is a generated widget with a stable shape (`tests-NNN · NN files`)
 * and one regex handles every README. The prose is not: eight languages state
 * the same fact eight ways —
 *
 *     520 tests / 51 files       520 tests across 51 files
 *     520 tests en 51 archivos   520 Tests in 51 Dateien
 *     520 test trên 48 file      520 testes em 51 ficheiros
 *     520 Unit-Tests             520 tests unitaires
 *     typecheck + 520 tests + build
 *
 * — and every one of them had drifted from the badge by hundreds. A stale
 * sentence is worse than a stale badge: the badge is understood as generated,
 * the prose is read as fact.
 *
 * WHY THE FIRST ATTEMPT WAS THROWN AWAY
 * -------------------------------------
 * It rewrote with a template string containing `$&`, which is a literal in a
 * non-regex replacement and rewrote nothing; the "fix" then used a backreference
 * inside a template and produced `82 Dateien · 882 51 Dateien · 520 Tests` —
 * corruption, in six files, that the suite did not catch because no test reads
 * prose counts.
 *
 * So this script differs in two ways from what replaced it:
 *
 *   1. **every replacement is a function of a full match**, never a template
 *      with a backreference — no `$1`, no `$&`, nothing to escape;
 *   2. **it verifies its own output**: after rewriting, any file that still
 *      contains the old count in a sentence-shaped context is reported and the
 *      script exits non-zero, rather than silently leaving a wrong number.
 *
 * Run:
 *   node scripts/sync-prose-counts.mjs            # rewrite
 *   node scripts/sync-prose-counts.mjs --verify   # report only
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

/** The real numbers, measured the same way the badge script measures them. */
function realCounts() {
  try {
    execFileSync("npx", ["vitest", "run", "--reporter=json", "--outputFile=/tmp/vitest-prose.json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    /* the report is written either way */
  }
  const report = JSON.parse(readFileSync("/tmp/vitest-prose.json", "utf8"));
  return { total: report.numTotalTests, files: report.testResults.length };
}

const { total, files } = realCounts();
const T = String(total);
const F = String(files);

/**
 * The SVG count has the same problem as the test count and one extra axis: it
 * is written as "19 SVG", "19 SVGs" and "19 SVGs, references checked both
 * ways" in different READMEs, and as a *historical* `18 → 19 → 20` table in
 * the release doc, which must not move. Only the standalone claims are
 * rewritten; anything inside a row that already shows an arrow is history.
 */
const SVGS = String(readdirSync("assets").filter((f) => f.endsWith(".svg")).length);

/**
 * One entry per sentence shape. Each `to` is a function of the match groups, so
 * there is no backreference syntax anywhere in this file.
 */
const RULES = [
  // 520 tests / 51 files  ·  520 test / 48 file  ·  520 Tests / 51 Dateien
  {
    re: /\b\d{3,4} ([Tt]ests?|[Tt]est|[Tt]estes|[Tt]este) \/ \d{1,3} ([A-Za-z][\w]*)\b/g,
    to: (m, noun, unit) => `${T} ${noun} / ${F} ${unit}`,
  },
  // 520 tests across 51 files
  {
    re: /\b\d{3,4} tests? across \d{1,3} files\b/g,
    to: () => `${T} tests across ${F} files`,
  },
  // 520 tests en 51 archivos · 520 Tests in 51 Dateien · 520 testes em 51 ficheiros
  {
    re: /\b\d{3,4} ([Tt]ests?|[Tt]estes?) (en|sur|auf|em|in|di|trên|の) \d{1,3} ([A-Za-z][\w]*)\b/g,
    to: (m, noun, prep, unit) => `${T} ${noun} ${prep} ${F} ${unit}`,
  },
  // 520 Unit-Tests · 520 tests unitaires · 520 testes unitários · 520 unit tests
  {
    re: /\b\d{3,4} ((?:[Uu]nit[- ][Tt]ests?)|(?:[Uu]nit[- ][Tt]est)|(?:tests? unit\w*)|(?:testes? unit\w*))\b/g,
    to: (m, phrase) => `${T} ${phrase}`,
  },
  // typecheck + 520 tests + build
  {
    re: /\btypecheck \+ \d{3,4} [Tt]ests? \+ build\b/g,
    to: (m) => m.replace(/\d{3,4}/, T),
  },
  /*
   * Thai writes the pair with no separator words: "501 เทสต์ใน 48 ไฟล์" —
   * count, noun, "ใน" (in), count, unit. Non-Latin script, so `\b` does not
   * apply and the pattern is anchored on the digits and the Thai word instead.
   */
  {
    re: /\d{3,4} เทสต์ใน \d{1,3} ไฟล์/g,
    to: () => `${T} เทสต์ใน ${F} ไฟล์`,
  },
  /*
   * "20 SVG — no orphans" · "20 SVGs, references checked both ways".
   * This rule is marked `current: true`, which means the whole *line* is
   * skipped when it looks like a record of the past: an arrow into 1.1.8, a
   * version-range row, or a changelog table. The sweep row in every README
   * says "10 READMEs + docs + 19 SVGs → 1.1.8", and 19 really was the count
   * when that sweep happened — rewriting it would falsify the record. The
   * growth table (`| SVG | 18 | 19 |`) has the same problem.
   */
  {
    re: /\b\d{1,2} (SVGs?|file SVG)\b/g,
    current: true,
    to: (m, unit) => `${SVGS} ${unit}`,
  },
  // 51 files · 520 tests  (reversed order, some languages prefer it)
  {
    re: /\b\d{1,3} ([A-Za-z][\w]*) · \d{3,4} ([Tt]ests?|[Tt]estes?)\b/g,
    to: (m, unit, noun) => `${F} ${unit} · ${T} ${noun}`,
  },
];

/** Sentences that look like a count but must NOT be rewritten (released rows). */
const HISTORICAL = /v1\.1\.[0-7]|2026-1[01]-\d\d/;

/**
 * Sentences that describe the past rather than today, so their numbers must be
 * left exactly as written. Widened after the SVG rule rewrote two sweep rows
 * that said "19 SVGs → 1.1.8": an arrow into the release, a "sweep"/"quét" verb
 * plus a version, or an explicit old-value marker all mean "this was true
 * then".
 */
const PAST = /→ *1\.1\.8|→ *v1\.1\.8|quét toàn bộ|sweep of 10|barrido de 10|balayage des 10|kompletter Durchlauf|varredura de 10|ตรวจ 10|全量扫描|\| *\d{1,2} *\| *\*?\d{1,2}\*? *\|/;

const READMES = readdirSync(".").filter((f) => /^README(\.[a-z]{2})?\.md$/.test(f));
const verify = process.argv.includes("--verify");
let changed = 0;
const problems = [];

for (const file of READMES) {
  const body = readFileSync(file, "utf8");
  let next = body;
  for (const { re, to, current } of RULES) {
    if (!current) {
      next = next.replace(re, to);
      continue;
    }
    /*
     * Line-by-line, because "is this sentence about today?" is a property of
     * the line, not of the file. A README can legitimately contain both a
     * current claim and a historical one.
     */
    next = next
      .split("\n")
      .map((line) => (PAST.test(line) ? line : line.replace(re, to)))
      .join("\n");
  }
  if (next !== body) {
    changed += 1;
    if (verify) problems.push(`${file}: prose count is stale`);
    else writeFileSync(file, next);
  }

  /*
   * VERIFY THE OUTPUT, not just the input. Any line that still pairs the old
   * count with a file count is a rewrite this script failed to make, and it is
   * better to fail loudly than to leave a wrong number in eight languages.
   */
  for (const line of next.split("\n")) {
    if (!/\b\d{3,4}\b/.test(line)) continue;
    if (HISTORICAL.test(line)) continue;
    const stalePair = /\b(?:5[0-9]{2}|6[0-9]{2}|7[0-9]{2})\b[^\n]*\b(?:4[0-9]|5[0-9]|6[0-9])\b/.test(line)
      && /\b(?:tests?|Tests?|testes?|Unit)\b/.test(line)
      && !line.includes(String(total));
    if (stalePair) problems.push(`${file}: suspicious count line → ${line.trim().slice(0, 90)}`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(p);
  console.error(`\n${problems.length} problem(s). Expected ${T} tests / ${F} files.`);
  process.exit(1);
}
console.log(
  `prose counts: ${T} tests / ${F} files / ${SVGS} SVGs — ${changed} README(s) ${verify ? "ok" : "updated"}`,
);
