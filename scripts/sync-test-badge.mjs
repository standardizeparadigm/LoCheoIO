#!/usr/bin/env node
/**
 * Rewrite the tests badge in all ten READMEs to the real numbers.
 *
 * WHY THIS EXISTS
 * ---------------
 * The badge is `tests-<count>%20%C2%B7%20<files>%20files`, and `docs-numbers
 * .test.ts` asserts it equals the true counts. So every commit that adds a test
 * file makes ten READMEs fail, and the fix is a mechanical string replacement
 * performed by hand — which is how a repo ends up with ten near-identical
 * "docs(readme): badge" commits per round and still gets the number wrong when
 * someone forgets.
 *
 * The count here is *derived*, not passed in, and it is derived by **running
 * the suite** — not by counting `it(` in the source. A static count is wrong
 * for this repo: `it.each(TABLE)(...)` is one `it(` in the file and eleven
 * tests at runtime, and there are four such call sites. Counting source lines
 * reported 587 when the suite runs 675.
 *
 * `vitest run --reporter=json` is the only honest source. It costs a suite
 * run (~14 s), which is fine for the once-per-round job this is meant for,
 * and `--verify` is the mode that runs in CI where that cost is already paid.
 *
 * Usage:
 *   node scripts/sync-test-badge.mjs            # rewrite
 *   node scripts/sync-test-badge.mjs --verify   # report only, exit 1 if stale
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const TESTS_DIR = "tests";
const READMES = readdirSync(".").filter((f) => /^README(\.[a-z]{2})?\.md$/.test(f));

/** Run the suite once and read the numbers vitest reports. */
function realCounts() {
  /*
   * A non-zero exit is expected and must not abort: the run includes
   * `docs-numbers.test.ts`, which fails *because the badge is stale* — the
   * exact condition this script exists to fix. Reading the report regardless
   * is what breaks the chicken-and-egg, and it also means a genuinely broken
   * suite still gets its badge written; the suite itself is the gate for that,
   * not this script.
   */
  try {
    execFileSync("npx", ["vitest", "run", "--reporter=json", "--outputFile=/tmp/vitest-badge.json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    /* report is written either way — see above */
  }
  const report = JSON.parse(readFileSync("/tmp/vitest-badge.json", "utf8"));
  return { total: report.numTotalTests, files: report.testResults.length, report };
}

const { total, files, report } = realCounts();

/*
 * Per-file case counts, so the release notes can be checked against the suite
 * instead of against a table someone typed once.
 *
 * `docs/releases/v1.1.8.md` §6.8 lists four test files and how many cases each
 * holds; two of the counts were wrong. A whole-suite total is checked by
 * `docs-numbers.test.ts` and the badge, but a per-file count has no such twin —
 * it changes only when that file changes, and nothing points back at the table
 * when it does.
 *
 * Written next to the tests rather than into `dist/` or `/tmp` so that a clean
 * clone has it after `npm test`, and ignored by git like any other build output.
 */
const perFile = Object.fromEntries(
  report.testResults.map((t) => [String(t.name).split("/").pop(), t.assertionResults.length]),
);
writeFileSync(
  "tests/.counts.json",
  JSON.stringify(Object.fromEntries(Object.entries(perFile).sort()), null, 1) + "\n",
);

const badge = `tests-${total}%20%C2%B7%20${files}%20files`;
const pattern = /badge\/tests-\d+%20%C2%B7%20\d+%20files/g;

let changed = 0;
let svgChanged = false;
const stale = [];
for (const file of READMES) {
  const body = readFileSync(file, "utf8");
  if (!pattern.test(body)) continue;
  pattern.lastIndex = 0;
  const next = body.replace(pattern, `badge/${badge}`);
  if (next !== body) {
    changed++;
    if (process.argv.includes("--verify")) {
      stale.push(file);
    } else {
      writeFileSync(file, next);
    }
  }
}

/*
 * `assets/test-matrix.svg` states the same two numbers, six times, and is
 * embedded in all ten READMEs. It was the *last* place still saying "308 test
 * trên 36 file" — a three-times-wrong image under a correct badge, which is
 * worse than a wrong badge because an image reads as authoritative and cannot
 * be diffed by a reader.
 *
 * There are six shapes in the file (aria-label, English strip, the big numeral,
 * the gate row, the distribution heading, and the footer), so the rewrite is
 * done as targeted replacements rather than one regex.
 */
const SVG = "assets/test-matrix.svg";
if (existsSync(SVG)) {
  const before = readFileSync(SVG, "utf8");
  let after = before;
  // Digits are matched with a class rather than the previous value, so this
  // works no matter how far the file has drifted.
  after = after.replace(/\d+ test trên \d+ file/g, `${total} test trên ${files} file`);
  after = after.replace(/\d+ tests · \d+ files/g, `${total} tests · ${files} files`);
  after = after.replace(/(letter-spacing="2">)\d+(<\/text>)/g, `$1${total}$2`);
  after = after.replace(/\d+ \/ \d+ · \d+ files/g, `${total} / ${total} · ${files} files`);
  after = after.replace(/WHERE THE \d+ TESTS LIVE/g, `WHERE THE ${total} TESTS LIVE`);
  after = after.replace(/tests\/ · \d+ files/g, `tests/ · ${files} files`);
  after = after.replace(/phân bố \d+ test/g, `phân bố ${total} test`);
  if (after !== before) {
    if (process.argv.includes("--verify")) {
      console.error(`${SVG} is stale — run npm run sync:badge`);
      process.exit(1);
    }
    writeFileSync(SVG, after);
    svgChanged = true;
  }
}

const mode = process.argv.includes("--verify") ? "verify" : "write";
if (mode === "verify" && stale.length) {
  console.error(`stale badge in ${stale.length} README(s): ${stale.join(", ")}`);
  console.error(`expected: ${badge}`);
  process.exit(1);
}
console.log(`tests: ${total} · files: ${files} — ${changed} README(s) ${mode === "write" ? "updated" : "ok"}`);
