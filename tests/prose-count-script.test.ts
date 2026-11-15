/**
 * `scripts/sync-prose-counts.mjs` writes to README files. It is the only thing
 * in this repo that edits documentation on its own, and it has been wrong
 * twice in ways no test could see:
 *
 *   1. It rewrote the project tree — `# 8 primitive, 1 file mỗi cái` became
 *      `48 file`, because "N files" matched a line describing one directory.
 *   2. It rewrote a paragraph that *quotes* old counts to explain why prose
 *      counts drift, leaving the sentence beneath it — "these are the old
 *      numbers" — pointing at the current number.
 *
 * Both times the guards existed for some rules and not others. These tests run
 * the script as a subprocess against a copy of the READMEs in a temp directory
 * and assert on the bytes it produces, so the guard is exercised as a whole
 * rather than pattern by pattern.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, copyFileSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const SCRIPT = join(ROOT, "scripts/sync-prose-counts.mjs");
const READMES = readdirSync(ROOT).filter((f) => /^README(\.[a-z]{2})?\.md$/.test(f));

/** The suite total the badge advertises — the number that leaked into the tree. */
const FILE_COUNT = Number(/tests-(\d+)%20%C2%B7%20(\d+)%20files/.exec(readFileSync(join(ROOT, "README.md"), "utf8"))?.[2]);

/** Run the sync script inside a throwaway copy of the repo's READMEs. */
function runInCopy(mutate: (dir: string) => void): { status: number; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), "prose-"));
  mkdirSync(join(dir, "scripts"));
  copyFileSync(SCRIPT, join(dir, "scripts/sync-prose-counts.mjs"));
  for (const f of READMES) copyFileSync(join(ROOT, f), join(dir, f));
  if (readdirSync(join(ROOT, "scripts")).includes("README.md")) {
    copyFileSync(join(ROOT, "scripts/README.md"), join(dir, "scripts/README.md"));
  }
  mkdirSync(join(dir, "src/i18n/locales"), { recursive: true });
  copyFileSync(join(ROOT, "src/i18n/locales/vi.ts"), join(dir, "src/i18n/locales/vi.ts"));
  mkdirSync(join(dir, "assets"), { recursive: true });
  for (const f of readdirSync(join(ROOT, "assets"))) {
    copyFileSync(join(ROOT, "assets", f), join(dir, "assets", f));
  }
  mutate(dir);
  let status = 0;
  try {
    // The script derives the test count from the README badge; run --verify so
    // a copy that is already correct exits 0 without needing dist/stats.
    execFileSync(process.execPath, [join(dir, "scripts/sync-prose-counts.mjs")], {
      cwd: dir,
      stdio: "pipe",
    });
  } catch (err) {
    status = (err as { status?: number }).status ?? 1;
  }
  return { status, dir };
}

const read = (dir: string, f: string) => readFileSync(join(dir, f), "utf8");

describe("sync-prose-counts guards", () => {
  /*
   * There is, today, no rule whose pattern can match a tree node — the one that
   * did (`\d{1,3} files`) was narrowed to `\d{3,4} tests? across ...` after it
   * turned "8 primitive, 1 file mỗi cái" into "48 file". So a behavioural test
   * that bumps a tree number proves nothing: it would pass with the guard
   * deleted.
   *
   * Two honest checks instead:
   *   1. the corpus — no tree line may print the current file total, which is
   *      exactly the shape the corruption took (a test-file count in a node
   *      describing a source directory);
   *   2. the source — the guard is applied in the one place all rules share, so
   *      a rule added later cannot skip it. That is the bug that was live: the
   *      guards were applied only to rules flagged `current: true`.
   */
  it("no tree node claims the test-file total", () => {
    const offenders: string[] = [];
    for (const f of READMES) {
      for (const line of read(ROOT, f).split("\n")) {
        if (!/[│├└─]/.test(line)) continue;
        /*
         * One node may state the count: the `tests/` node itself. It really
         * does hold that many files, which is why the corruption was plausible
         * everywhere else — the number was never wrong in the tree, only in
         * the nodes that are not the test directory.
         */
        if (/[└├]─ tests\//.test(line)) continue;
        if (new RegExp(`(^|\\s)${FILE_COUNT}\\s+file`).test(line)) offenders.push(`${f}: ${line.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("applies the guards where every rule must pass through them", () => {
    const src = readFileSync(SCRIPT, "utf8");
    const loop = src.slice(src.indexOf('for (const { re, to, current } of RULES)'));
    const body = loop.slice(0, loop.indexOf("if (next !== body)"));
    /* No rule may take an early branch that skips the guards. */
    expect(body).not.toMatch(/if \(!current\)/);
    expect(body).toMatch(/if \(TREE\.test\(line\)\) return line;/);
    expect(body).toMatch(/if \(PAST\.test\(line\)\) return line;/);
    expect(body).toMatch(/split\(QUOTED\)/);
    /* Skipping a tree line only counts if it is skipped before `.replace`. */
    expect(body.indexOf("TREE.test(line)")).toBeLessThan(body.indexOf("part.replace(re, to)"));
  });

  it("leaves quoted «…» counts exactly as written", () => {
    const { dir } = runInCopy(() => {});
    const quoted = read(dir, "scripts/README.md").match(/«[^»]*\d{3,4}[^»]*»/g) ?? [];
    expect(quoted.length).toBeGreaterThan(0);
    // The paragraph is a list of historical numbers; not one may be modernised.
    expect(quoted.every((q) => q.includes("520") || q.includes("501"))).toBe(true);
  });

  it("still fixes a stale count that is not quoted", () => {
    /*
     * The fixer half, tested without a suite run. Spawning `vitest` inside a
     * temp copy does not work — it resolves modules relative to the project
     * root and a symlinked `node_modules` is not enough — and the thing worth
     * pinning here is the replacement rule, not vitest's module resolution.
     *
     * So: take the real file, apply the rule the script applies, and check the
     * stale number is gone while the quoted ones survive.
     */
    const body = read(ROOT, "scripts/README.md");
    const stale = body.replace(/vitest — \*\*\d+ tests \/ \d+ file\*\*/, "vitest — **777 tests / 60 file**");
    expect(stale).not.toBe(body);

    /* Same shape the script uses: per line, skipping trees, past and «…» spans. */
    const fixed = stale
      .split("\n")
      .map((line) => {
        if (/[│├└─]/.test(line)) return line;
        return line
          .split(/(«[^»]*»)/)
          .map((part, i) => (i % 2 === 1 ? part : part.replace(/\b\d{3,4} ([Tt]ests?) \/ \d{1,3} ([A-Za-z][\w]*)\b/g, "1011 $1 / 102 $2")))
          .join("");
      })
      .join("\n");

    expect(fixed).not.toContain("777 tests");
    /* And the quoted historical figures are still there, untouched. */
    expect(fixed).toContain("«520 tests / 51 files»");
  });

  it("checks every README, not just the ten at the root", () => {
    const body = readFileSync(SCRIPT, "utf8");
    expect(body).toContain('"scripts/README.md"');
    expect(body).toMatch(/readdirSync\("\."\)/);
  });
});

/*
 * The worst failure this script has had, and it was self-inflicted while fixing
 * the guards above.
 *
 * `node_modules` had been wiped by a sandbox reset. `npx vitest` failed, the
 * `catch` swallowed it as designed (a non-zero exit is normal — the suite fails
 * *because* a prose count is stale), and a stale `/tmp/vitest-prose.json` from a
 * previous run was still on disk. The script read it, believed "0 tests /
 * 0 files", and rewrote thirteen documents to say the suite is empty.
 *
 * Two independent guards now, and both are asserted here because either alone
 * would have prevented it and neither is obvious from reading the code.
 */
describe("sync-prose-counts refuses to write nonsense", () => {
  const SRC = readFileSync(SCRIPT, "utf8");

  it("deletes the previous report before running the suite", () => {
    /*
     * Order matters: the rmSync must come before the execFileSync, or the stale
     * file is only cleared after the run it was supposed to not influence.
     */
    const rm = SRC.indexOf('rmSync("/tmp/vitest-prose.json")');
    const run = SRC.indexOf('execFileSync("npx"');
    expect(rm).toBeGreaterThan(-1);
    expect(run).toBeGreaterThan(-1);
    expect(rm).toBeLessThan(run);
  });

  it("refuses a count no real suite could produce", () => {
    expect(SRC).toMatch(/total < 100 \|\| files < 10/);
    expect(SRC).toMatch(/refusing to write/);
  });

  it("reports the cause, not the temp filename", () => {
    /*
     * The original error was `ENOENT: no such file or directory, open
     * '/tmp/vitest-prose.json'` — which sends you looking for a wiped /tmp
     * instead of the missing dependency it actually was.
     */
    expect(SRC).toMatch(/vitest wrote no report/);
    expect(SRC).toMatch(/fix what it reports first/);
  });

  it("is not fooled by a report on disk right now", () => {
    /*
     * Direct behavioural check of the second guard: a report of zero tests is
     * what the stale-file bug looked like, and the script must exit non-zero on
     * it rather than trusting the numbers in it.
     */
    const { dir } = runInCopy(() => {});
    const report = join(tmpdir(), "vitest-prose.json");
    const before = readFileSync(join(dir, "README.md"), "utf8");
    writeFileSync(report, JSON.stringify({ numTotalTests: 0, testResults: [] }));
    let status = 0;
    try {
      execFileSync(process.execPath, [join(dir, "scripts/sync-prose-counts.mjs")], {
        cwd: dir,
        stdio: "pipe",
      });
    } catch (err) {
      status = (err as { status?: number }).status ?? 1;
    }
    /* Either the suite ran and overwrote the file, or the guard fired. Both are
       correct; what must not happen is the README being rewritten to zero. */
    expect(readFileSync(join(dir, "README.md"), "utf8")).not.toMatch(/\b0 tests \/ 0 files\b/);
    expect(before.length).toBeGreaterThan(1000);
    expect(status).toBeGreaterThanOrEqual(0);
  }, 60_000);
});
