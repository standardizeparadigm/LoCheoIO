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
import { readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EXTRA_TARGETS, rewrite, staleCounts } from "./lib/prose-counts.mjs";

/*
 * Through `os.tmpdir()`, not a literal "/tmp".
 *
 * Two instances of this script used to share one fixed path, so a run that
 * failed to write could read the other's report — and a test that planted a
 * fake report at that path could corrupt an unrelated run. `TMPDIR` is the
 * standard way to give a process its own scratch space, and honouring it is
 * what lets the test that exercises the stale-report guard run in parallel with
 * everything else.
 */
const REPORT = join(tmpdir(), "vitest-prose.json");

/** The real numbers, measured the same way the badge script measures them. */
function realCounts() {
  /*
   * Delete any previous report first. Without this, a run where vitest could
   * not start at all — `node_modules` missing, `vite.config.ts` broken — leaves
   * whatever an earlier run wrote, and the script happily recopies that. It
   * happened: the suite did not run, the report from a previous invocation was
   * still on disk, and thirteen files were rewritten with "0 tests / 0 files"
   * from a file whose mtime nobody checked.
   */
  try {
    rmSync(REPORT);
  } catch {
    /* absent is the normal case */
  }
  try {
    execFileSync("npx", ["vitest", "run", "--reporter=json", `--outputFile=${REPORT}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    /* the report is written either way */
  }
  /*
   * If vitest could not start — a missing `node_modules`, a broken
   * `vite.config.ts` — it writes no report, and the raw failure was
   * `ENOENT: no such file or directory, open '/tmp/vitest-prose.json'`, which
   * names the temp file rather than the cause. Anyone reading that goes looking
   * for a wiped `/tmp` instead of the missing dependency it actually is.
   */
  let raw;
  try {
    raw = readFileSync(REPORT, "utf8");
  } catch {
    console.error(
      "sync-prose-counts: vitest wrote no report — the suite did not run.\n" +
        "Run `npx vitest run` on its own and fix what it reports first.\n" +
        "This script counts tests; it cannot guess how many there are.",
    );
    process.exit(2);
  }
  const report = JSON.parse(raw);
  const total = report.numTotalTests;
  const files = report.testResults.length;
  /*
   * A second line of defence: a suite of this size cannot be 0, and writing 0
   * into thirteen documents is far worse than refusing to run. This is the
   * check that would have caught the stale-report bug even if the rmSync above
   * were removed.
   */
  if (!Number.isFinite(total) || total < 100 || files < 10) {
    console.error(
      `sync-prose-counts: refusing to write ${total} tests / ${files} files — ` +
        "the report looks like a failed run, not a measurement.",
    );
    process.exit(2);
  }
  return { total, files };
}

const { total, files } = realCounts();

/**
 * The SVG count has the same problem as the test count and one extra axis: it
 * is written as "19 SVG", "19 SVGs" and "19 SVGs, references checked both
 * ways" in different READMEs, and as a *historical* `18 → 19 → 20` table in
 * the release doc, which must not move. Only the standalone claims are
 * rewritten; anything inside a row that already shows an arrow is history.
 */
const SVGS = String(readdirSync("assets").filter((f) => f.endsWith(".svg")).length);

/**
 * The i18n key count, counted from the Vietnamese source table.
 *
 * This is the third count that had drifted: the READMEs said "306 keys" and one
 * guide said 307 while the table held 327 — and 306 was *written into two
 * different files on two different days*, so it looked corroborated. It was
 * simply old.
 *
 * Counted from the locale file as text, the same way `check:i18n` does, rather
 * than imported: this script runs outside the app's module graph.
 */
function messageKeyCount() {
  const src = readFileSync("src/i18n/locales/vi.ts", "utf8");
  // Key lines look like `  "some.key": "value",` — at one indent level, quoted.
  return (src.match(/^ {2}"[^"]+":/gm) ?? []).length;
}
const KEYS = String(messageKeyCount());

/*
 * The rules themselves live in `scripts/lib/prose-counts.mjs`.
 *
 * They moved because this script is a CI step: it measures the suite by running
 * it, which is far too expensive to do inside `npm run check`, and so the only
 * thing that ever ran the prose gate was CI. The rules are now shared with
 * `tests/prose-counts-gate.test.ts`, which runs them against the counts the
 * repo already publishes — same patterns, same guards, no re-implementation.
 */
const REAL = {
  tests: total,
  files,
  svgs: Number(SVGS),
  keys: Number(KEYS),
};

const TARGETS = [
  ...readdirSync(".").filter((f) => /^README(\.[a-z]{2})?\.md$/.test(f)),
  ...EXTRA_TARGETS,
];
const verify = process.argv.includes("--verify");
let changed = 0;
const problems = [];

for (const file of TARGETS) {
  const body = readFileSync(file, "utf8");
  const { body: next, changed: differs } = rewrite(body, REAL);
  if (differs) {
    changed += 1;
    if (verify) problems.push(`${file}: prose count is stale`);
    else writeFileSync(file, next);
  }
  /* Verify the OUTPUT, not just the input — see `staleCounts()`. */
  for (const line of staleCounts(next, REAL)) {
    problems.push(`${file}: suspicious count line → ${line}`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(p);
  console.error(`\n${problems.length} problem(s). Expected ${total} tests / ${files} files.`);
  process.exit(1);
}
console.log(
  `prose counts: ${total} tests / ${files} files / ${SVGS} SVGs / ${KEYS} keys — ${changed} README(s) ${verify ? "ok" : "updated"}`,
);
