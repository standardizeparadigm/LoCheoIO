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
    const { dir } = runInCopy((d) => {
      const p = join(d, "scripts/README.md");
      const body = read(d, "scripts/README.md");
      const bad = body.replace(/vitest — \*\*\d+ tests \/ \d+ file\*\*/, "vitest — **777 tests / 60 file**");
      expect(bad).not.toBe(body);
      writeFileSync(p, bad);
    });
    expect(read(dir, "scripts/README.md")).not.toContain("777 tests");
  });

  it("checks every README, not just the ten at the root", () => {
    const body = readFileSync(SCRIPT, "utf8");
    expect(body).toContain('"scripts/README.md"');
    expect(body).toMatch(/readdirSync\("\."\)/);
  });
});
