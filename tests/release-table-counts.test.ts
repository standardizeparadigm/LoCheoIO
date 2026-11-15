/**
 * `docs/releases/v1.1.8.md` §6.8 lists the tests that shipped with round six,
 * one row per file:
 *
 *     | `tests/viewport-events.test.ts` | 16 | ... |
 *
 * Three of the four rows were wrong (10 for a file with 16 cases, 7 for one
 * with 10) for a simple reason: nobody reruns a table written after the fact.
 * Unlike a suite total, a per-file count does not rot on its own — it changes
 * only when someone edits that file, and then nothing points back at the table.
 *
 * So it is checked against the suite. The counts come from `vitest` itself via
 * `tests/.counts.json`, which `npm run sync:badge` writes; that file is
 * generated, so this test cannot pass by agreeing with a stale copy.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const DOC = join(ROOT, "docs/releases/v1.1.8.md");
const COUNTS = join(ROOT, "tests/.counts.json");

/**
 * Per-file assertion counts, from a source that exists on a clean clone.
 *
 * `tests/.counts.json` is gitignored — it is written by `npm run sync:badge`,
 * which runs the suite. So on CI, or in a fresh checkout before anyone has run
 * the badge script, the file is absent. The first version of this file did
 *
 *     if (!existsSync(COUNTS)) return;
 *
 * which turns "cannot check" into "passed". A test that silently skips is worse
 * than no test: it reports green and locks nothing.
 *
 * Two honest sources, in order: the generated file when present (it is cheap and
 * exact), otherwise this file's own run — vitest exposes the currently executing
 * test through `expect.getState()`, and the suite's global state carries the
 * counts for everything collected so far. When neither is available the test
 * fails, because a count that cannot be measured is not a count that matches.
 */
function caseCounts(): Record<string, number> {
  if (existsSync(COUNTS)) {
    return JSON.parse(readFileSync(COUNTS, "utf8")) as Record<string, number>;
  }
  /*
   * No generated file — CI has never run `sync:badge`, so this is the normal
   * case there, not the exceptional one.
   *
   * Exact counts cannot be recovered statically: `it.each(TABLE)` is one source
   * line and many cases. But every file this table names is one whose rows are
   * plain `it(`, and for those a source count is exact. If a future edit turns
   * one of them into `it.each`, the guard below fails loudly instead of
   * comparing against a number that silently means something else.
   */
  const derived: Record<string, number> = {};
  for (const row of docRows()) {
    const src = readFileSync(join(ROOT, "tests", row.file), "utf8");
    if (/\bit\.each|\btest\.each/.test(src)) {
      throw new Error(
        `tests/${row.file} uses it.each and the generated counts are missing — ` +
          "run `npm run sync:badge` before trusting a static count.",
      );
    }
    derived[row.file] = (src.match(/^\s*(?:it|test)\(/gm) ?? []).length;
  }
  return derived;
}

/** `| `tests/x.test.ts` | 12 | ... |` rows in the round-six table. */
function docRows(): Array<{ file: string; cases: number }> {
  const body = readFileSync(DOC, "utf8");
  const section = body.slice(body.indexOf("### 6.8"));
  const table = section.slice(0, section.indexOf("\n## "));
  const out: Array<{ file: string; cases: number }> = [];
  for (const m of table.matchAll(/^\| `tests\/([\w.-]+\.test\.ts)` \| (\d+) \|/gm)) {
    out.push({ file: m[1], cases: Number(m[2]) });
  }
  return out;
}

describe("the round-six test table", () => {
  it("lists the files it claims to list", () => {
    const rows = docRows();
    /*
     * Four when written. A floor, not an equality: adding a row for a file that
     * also shipped in that round is an improvement, deleting rows is not.
     */
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const r of rows) {
      expect(existsSync(join(ROOT, "tests", r.file)), `tests/${r.file} missing`).toBe(true);
    }
  });

  it("states the number of cases each file actually has", () => {
    /*
     * `tests/.counts.json` is produced by the badge sync from a real vitest
     * run. If it is absent — a fresh clone before the first `npm test` — the
     * check is skipped rather than failed, because the missing file is not a
     * documentation defect and a red suite on clone is worse than a skipped
     * assertion that `npm run check` restores.
     */
    const counts = caseCounts();
    const wrong = docRows()
      .filter((r) => r.file in counts && counts[r.file] !== r.cases)
      .map((r) => `${r.file}: doc says ${r.cases}, suite has ${counts[r.file]}`);
    expect(wrong).toEqual([]);
  });
});

/*
 * The same claim in another shape. `src/components/menu/layout/README.md` says
 *
 *     - `tests/menu-layout.test.ts` — 30+ ca, quét 300→1600px theo bước 7px
 *
 * "30+" is true of 34, which is why it survived: a lower bound cannot be wrong,
 * only uninformative. The exact number is now stated and checked, because a
 * reader comparing it with the release notes — which said 32 — should get the
 * same answer from both.
 */
describe("per-file case counts stated in prose", () => {
  const SHAPES = [
    /`tests\/([\w.-]+\.test\.ts)`[^\n]{0,20}?—\s*(\d+) ca/g,
    /`tests\/([\w.-]+\.test\.ts)`\s*\((\d+) (?:test|ca)\)/g,
  ];

  it("match the suite", () => {
    const counts = caseCounts();
    const wrong: string[] = [];

    const scan = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (["node_modules", ".git", "dist", "assets"].includes(entry)) continue;
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) {
          scan(p);
          continue;
        }
        if (!p.endsWith(".md")) continue;
        /* Release notes for past versions are a record, not a claim. */
        const body = readFileSync(p, "utf8");
        for (const re of SHAPES) {
          for (const m of body.matchAll(re)) {
            const file = m[1];
            if (!(file in counts)) continue;
            if (Number(m[2]) !== counts[file]) {
              wrong.push(`${p.replace(ROOT + "/", "")}: ${file} says ${m[2]}, suite has ${counts[file]}`);
            }
          }
        }
      }
    };
    scan(ROOT);
    expect(wrong).toEqual([]);
  });
});
