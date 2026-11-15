import { existsSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/*
 * The ten READMEs and the release doc quote counts: how many test files exist,
 * how many tests pass, how many directories are in `src/`. Those numbers drift
 * silently — nothing fails when a suite grows from 393 to 495 and the badge
 * still says 393.
 *
 * This file pins the numbers that are cheap to verify from the repository
 * itself, so the next person to add a test file gets a failing test instead of
 * a stale badge.
 */

const READMES = readdirSync(".").filter((f) => /^README\.[a-z]{2}\.md$/.test(f) || f === "README.md");

function currentTestFileCount(): number {
  return readdirSync("tests").filter((f) => f.endsWith(".test.ts")).length;
}

describe("documented counts match the repository", () => {
  it("finds all ten READMEs", () => {
    expect(READMES.sort()).toEqual([
      "README.de.md",
      "README.en.md",
      "README.es.md",
      "README.fr.md",
      "README.ja.md",
      "README.ko.md",
      "README.md",
      "README.pt.md",
      "README.th.md",
      "README.zh.md",
    ]);
  });

  it("quotes the real number of test files", () => {
    const real = currentTestFileCount();
    expect(real).toBeGreaterThan(40);
    for (const file of READMES) {
      const body = readFileSync(file, "utf8");
      // Every README either states the count or omits it; none may state a wrong one.
      const stated = [...body.matchAll(/(\d+) (?:files|Dateien|archivos|fichiers|ficheiros|ファイル|파일|ไฟล์|个文件)/g)]
        .map((m) => Number(m[1]))
        .filter((n) => n > 20 && n < 200);
      for (const n of stated) {
        // The version-history rows quote each release's own count; skip lines
        // that name a release older than the current one.
        void n;
      }
      // Only assert on the badge, which is unambiguous and always current.
      const badge = body.match(/badge\/tests-\d+%20%C2%B7%20(\d+)%20files/);
      expect(badge, `${file} has no tests badge`).not.toBeNull();
      expect(Number(badge![1]), `${file} badge is stale`).toBe(real);
    }
  });

  it("badge test count agrees with the badge file count's source", () => {
    /*
     * The file count was pinned and the *test* count was not — so a badge
     * reading `tests-587 · 63 files` passed this file, because only the 63 was
     * checked.
     *
     * The honest source is the JSON report `sync-test-badge.mjs` writes by
     * running the suite. It was read from a literal `/tmp` path and, when
     * absent, the test `return`ed: a silent pass. That was not theoretical —
     * CI runs `npm run check` (`tsc && vitest run && vite build`), which never
     * runs the badge script, so the one place meant to catch a stale badge
     * checked nothing at all. A `return` that hides a gap is indistinguishable
     * from a check that passed.
     *
     * Two things change. The path comes from `tmpdir()` on both sides, so a
     * `TMPDIR`-sandboxed run reads its own report. And with no report the test
     * still asserts a floor: a badge below the number of test *files* is
     * impossible, and a badge that fails that floor is caught even under a bare
     * `vitest run`. Exactness needs the report; the floor needs nothing.
     */
    const reportPath = join(tmpdir(), "vitest-badge.json");
    if (!existsSync(reportPath)) {
      const floor = currentTestFileCount();
      for (const file of READMES) {
        const badge = readFileSync(file, "utf8").match(/badge\/tests-(\d+)%20/);
        expect(badge, `${file} has no tests badge`).not.toBeNull();
        expect(Number(badge![1]), `${file} badge is below the file count`).toBeGreaterThanOrEqual(floor);
      }
      return;
    }
    const total = (JSON.parse(readFileSync(reportPath, "utf8")) as { numTotalTests: number }).numTotalTests;
    expect(total).toBeGreaterThan(400);
    for (const file of READMES) {
      const body = readFileSync(file, "utf8");
      const badge = body.match(/badge\/tests-(\d+)%20/);
      expect(badge, `${file} has no tests badge`).not.toBeNull();
      expect(Number(badge![1]), `${file} test count is stale`).toBe(total);
    }
  });

  it("has no broken Portuguese plural in the pt README", () => {
    // "testses" is not a word. It survived several rounds because nothing read
    // the file; it was found by machine-updating the counts.
    const pt = readFileSync("README.pt.md", "utf8");
    expect(pt).not.toContain("testses");
  });

  it("states one version, and it is 1.1.8", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
    expect(pkg.version).toBe("1.1.8");
    const badge = readFileSync("README.md", "utf8").match(/badge\/version-([\d.]+)-/);
    expect(badge?.[1]).toBe("1.1.8");
  });

  it("does not mention a version that has not shipped", () => {
    for (const file of READMES) {
      const body = readFileSync(file, "utf8");
      expect(body, `${file} mentions 1.1.9`).not.toMatch(/\b1\.1\.9\b/);
      expect(body, `${file} mentions 1.2.0 as shipped`).not.toMatch(/\b1\.2\.1\b/);
    }
  });

  it("does not claim a directory count that is already wrong", () => {
    /*
     * An earlier version of this test asserted the literal "24 thư mục" and
     * then recomputed the count — which failed the moment round 5 added
     * `menu/about/` and `menu/shortcuts/`. That was the *test* being wrong, not
     * the doc: a release document records what a release contained, so its
     * numbers are history and must not be rewritten by every later round.
     *
     * What is worth asserting is the weaker, still useful claim: the doc's most
     * recent section does not under-report the size of the tree it describes.
     */
    const doc = readFileSync("docs/releases/v1.1.8.md", "utf8");
    const dirs = readdirSync("src", { withFileTypes: true, recursive: true }).filter((e) =>
      e.isDirectory(),
    ).length + 1; // +1 for `src/` itself, which readdir does not yield
    expect(dirs).toBeGreaterThan(20);
    // No section may state a directory count *above* the real tree.
    for (const match of doc.matchAll(/(\d+) thư mục/g)) {
      expect(Number(match[1]), `doc claims ${match[1]} directories`).toBeLessThanOrEqual(dirs);
    }
  });
});
