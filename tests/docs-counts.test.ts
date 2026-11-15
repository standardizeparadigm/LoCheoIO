/**
 * Numbers in the documentation that must agree with the code.
 *
 * `docs-numbers.test.ts` guards the README badges. This file guards the places
 * that have no badge and therefore no check — the ones that drifted three
 * releases without anyone noticing:
 *
 *   · `scripts/README.md` quoted "308 tests / 36 file" and "296 keys";
 *   · `docs/README.md`'s v1.1.8 row quoted 393 / 41;
 *   · `docs/guides/release-process.md` put "393 tests" inside the checklist.
 *
 * The rule these tests encode is not "these numbers must equal X" — that would
 * need editing on every commit. It is "**no document may quote a stale count**
 * in a place that claims to describe the current release". So the assertion is
 * about a *range*: nothing may claim fewer tests than the current floor, and
 * the version-history rows are exempt because they describe old releases on
 * purpose.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Every markdown file under `docs/`, plus the script and test READMEs. */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (name.endsWith(".md")) out.push(path);
  }
  return out;
}

const FILES = [
  ...walk("docs"),
  "scripts/README.md",
  "tests/README.md",
  "src/utils/README.md",
];

/** Files whose whole job is recording history, where old counts are correct. */
const HISTORY = new Set([
  "docs/releases/v1.0.0.md",
  "docs/releases/v1.1.0.md",
  "docs/releases/v1.1.1.md",
  "docs/releases/v1.1.2.md",
  "docs/releases/v1.1.3.md",
  "docs/releases/v1.1.4.md",
  "docs/releases/v1.1.5.md",
  "docs/releases/v1.1.6.md",
  "docs/releases/v1.1.7.md",
]);

describe("no current-facing document understates the suite", () => {
  it("has no stale test count below the current floor", () => {
    /*
     * The floor is a round number well below the real count. It is not the
     * exact figure on purpose: pinning the exact figure means this test fails
     * on every commit that adds a test, which is the failure mode that made
     * the README badge rot in the first place. 600 is high enough to catch
     * "308" and "393", low enough to survive a few rounds.
     */
    const FLOOR = 600;
    for (const file of FILES) {
      if (HISTORY.has(file)) continue;
      const body = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      /*
       * A document that *explains* a stale number has to quote it, so a line
       * that says "the old text read 393 tests" would trip this test. Skip
       * lines that mark the number as an example: a quoted phrase, a `→`, or
       * an explicit "cũ"/"old"/"used to".
       */
      const claimed = [...body.matchAll(/(\d{3})\s*(?:tests?|test)\b/g)]
        .map((m) => Number(m[1]))
        .filter((n) => n > 100);
      for (const n of claimed) {
        /*
         * Judge each *line* that states the number, not the first line in the
         * file that mentions it: a file can both explain an old number and
         * claim a current one, and only the second is a defect.
         */
        const lines = body.split("\n").filter((l) => l.includes(`${n} test`) || l.includes(`${n} tests`));
        const offenders = lines.filter((line) => {
          // Only numbers *below the floor* can be stale; a correct current
          // number is the normal case and must not be flagged.
          if (n >= FLOOR) return false;
          if (/v1\.1\.[0-7]|v1\.0\.0|vòng \d/.test(line)) return false;
          // An explanation that quotes the old number is not a claim about now.
          if (/"[^"]*\d{3} tests?[^"]*"|«[^»]*»|\bcũ\b|\bold\b|used to|đã ghi/.test(line)) return false;
          return true;
        });
        expect(
          offenders.length,
          `${file} states ${n} tests below the ${FLOOR} floor: ${offenders[0]?.trim().slice(0, 90) ?? ""}`,
        ).toBe(0);
      }
    }
  });

  it("has no document claiming the old i18n key count", () => {
    // 296 was true at v1.1.5 and survived into `scripts/README.md` because no
    // check looks at prose key counts.
    for (const file of FILES) {
      if (HISTORY.has(file)) continue;
      const body = readFileSync(file, "utf8");
      for (const line of body.split("\n")) {
        if (!/\b296\b/.test(line)) continue;
        if (/v1\.1\.[0-5]|vòng \d|→/.test(line)) continue;
        expect.fail(`${file} still claims 296 i18n keys: ${line.trim().slice(0, 80)}`);
      }
    }
  });
});

describe("the scripts README describes every script", () => {
  const scriptsReadme = readFileSync("scripts/README.md", "utf8");
  const scripts = readdirSync("scripts").filter((f) => /\.(mjs|tsx|sh|command|bat)$/.test(f));

  it("mentions each runnable script by name", () => {
    for (const s of scripts) {
      expect(scriptsReadme, `scripts/README.md does not mention ${s}`).toContain(s);
    }
  });

  it("mentions the sync:badge npm script", () => {
    // Documented in prose as `sync-test-badge.mjs`; the npm alias is what a
    // contributor will actually type.
    expect(scriptsReadme).toContain("sync:badge");
  });
});
