/**
 * `.github/` is the one directory every contributor reads and no test looked at.
 *
 * Two numbers were wrong in it:
 *
 *   `.github/PULL_REQUEST_TEMPLATE.md`   "typecheck + 222 tests + build"
 *   `.github/workflows/ci.yml`          "i18n parity (7 locales × 296 keys)"
 *
 * The template is copied into every pull request, so 222 was printed on every
 * PR opened since the suite passed that number. The CI step name is what shows
 * on the checks tab of every build. Neither is read at runtime, neither is in
 * the repository root, and the sweep only ever opened READMEs — which is the
 * entire reason they survived.
 *
 * The rule: a file under `.github/` may state a version or a small fixed count
 * (7 locales, 10 READMEs, 9 modes), but not a number that moves — the suite
 * total or the key total. Those have exactly one honest source each, and it is
 * not a workflow file.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const GITHUB = join(ROOT, ".github");

function files(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    statSync(p).isDirectory() ? files(p, out) : out.push(p);
  }
  return out;
}

const ALL = files(GITHUB);
const text = (p: string) => readFileSync(p, "utf8");

describe(".github/", () => {
  it("exists and is not empty", () => {
    expect(ALL.length).toBeGreaterThanOrEqual(5);
    expect(ALL.some((f) => f.endsWith("ci.yml"))).toBe(true);
    expect(ALL.some((f) => f.endsWith("PULL_REQUEST_TEMPLATE.md"))).toBe(true);
  });

  it("states no test total", () => {
    /*
     * "222 tests", "1007 tests", "556 tests" — any of them. A template cannot
     * know the number, and a workflow should not try: `npm run check` runs them
     * all, whatever they are.
     */
    const offenders: string[] = [];
    for (const f of ALL) {
      for (const m of text(f).matchAll(/\b\d{2,4}\s*(?:unit\s+)?tests?\b/gi)) {
        offenders.push(`${f.replace(ROOT + "/", "")}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("states no i18n key total", () => {
    /*
     * The key count is measured by `npm run check:i18n` and printed by
     * `sync-prose-counts.mjs`. In a step name it is decoration that goes stale,
     * which is how "296 keys" outlived the three hundred keys that replaced it.
     */
    const offenders: string[] = [];
    for (const f of ALL) {
      for (const m of text(f).matchAll(/\b\d{1,4}\s*(?:i18n\s+)?(?:keys?|khoá)\b/gi)) {
        offenders.push(`${f.replace(ROOT + "/", "")}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("still runs every gate it claims", () => {
    /*
     * The other half of the problem: a workflow that stops calling a gate is
     * as bad as one that names a stale number, and the name is the only place
     * the gate is documented.
     */
    const ci = text(join(GITHUB, "workflows/ci.yml"));
    for (const gate of [
      "npm run check",
      "npm run smoke",
      "check-readme-sync.mjs",
      "check-assets.mjs",
      "check-i18n.mjs",
    ]) {
      expect(ci, `ci.yml no longer runs ${gate}`).toContain(gate);
    }
  });
});
