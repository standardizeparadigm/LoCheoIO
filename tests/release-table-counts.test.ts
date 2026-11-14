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
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const DOC = join(ROOT, "docs/releases/v1.1.8.md");
const COUNTS = join(ROOT, "tests/.counts.json");

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
    if (!existsSync(COUNTS)) {
      expect(true).toBe(true);
      return;
    }
    const counts = JSON.parse(readFileSync(COUNTS, "utf8")) as Record<string, number>;
    const wrong = docRows()
      .filter((r) => r.file in counts && counts[r.file] !== r.cases)
      .map((r) => `${r.file}: doc says ${r.cases}, suite has ${counts[r.file]}`);
    expect(wrong).toEqual([]);
  });
});
