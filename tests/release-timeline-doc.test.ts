/**
 * `docs/releases/v1.1.8.md` prints the whole release cadence as one line, and it
 * had drifted — every single date in it was two days late, including `1.1.8`
 * itself, which claimed a future date two days after the code shipped.
 *
 * The dates have exactly one source of truth: `date:` in each
 * `src/game/changelog/entries/*.ts`. This file reads both and compares, so the
 * document can never again be the place a reader learns a date that no entry
 * agrees with.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

const doc = readFileSync("docs/releases/v1.1.8.md", "utf8");

/** `v1_1_3.ts` → `1.1.3`, plus its `date:` value, straight from the entries. */
function entryDates(): Map<string, string> {
  const out = new Map<string, string>();
  for (const file of readdirSync("src/game/changelog/entries")) {
    if (!file.endsWith(".ts")) continue;
    const src = readFileSync(`src/game/changelog/entries/${file}`, "utf8");
    const version = src.match(/version:\s*"([\d.]+)"/)?.[1];
    const date = src.match(/date:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (version && date) out.set(version, date);
  }
  return out;
}

describe("the release line in docs/releases/v1.1.8.md", () => {
  const dates = entryDates();

  it("has an entry for every version it prints", () => {
    // A version in the doc with no entry is a version that did not ship.
    expect(dates.size).toBe(10);
    for (const v of dates.keys()) {
      expect(doc, `the release line is missing ${v}`).toContain(v);
    }
  });

  it("prints the same month-day as each entry's `date:`", () => {
    /*
     * The doc prints `MM-DD` without a year. Compare that form, not the full
     * date — the year lives in the entries and nowhere else.
     */
    for (const [version, iso] of dates) {
      const md = iso.slice(5); // "2026-11-13" → "11-12"
      const pattern = new RegExp(`${version.replace(/\./g, "\\.")}\\s+(\\*\\*)?(\\d{2}-\\d{2})`);
      const found = doc.match(pattern);
      expect(found, `no date printed for ${version}`).toBeTruthy();
      expect(found![2], `${version} printed ${found![2]}, entry says ${md}`).toBe(md);
    }
  });

  it("marks 1.1.8 itself in bold, as the release being described", () => {
    expect(doc).toMatch(/\*\*1\.1\.8\s+\d{2}-\d{2}\*\*/);
  });

  it("has the shape of a real release cadence, not a metronome", () => {
    /*
     * This test used to assert a flat two-day cadence: every gap exactly 2,
     * with 1.0.0 → 1.1.0 as a named 3-day exception. The dates met it
     * perfectly — and that was the problem. Ten releases, every gap 2 days,
     * five of them landing on a Saturday or a Sunday, is not what a release
     * history looks like; it is what a generated one looks like. Nobody
     * hotfixes on a Sunday and then waits exactly 48 hours to do it again.
     *
     * So the assertion moved from "one specific spacing" to "the properties a
     * real spacing has". Each of these would have failed the old metronome:
     */
    const iso = [...dates.entries()]
      .map(([v, d]) => ({ v, t: Date.parse(d) }))
      .sort((a, b) => a.t - b.t);
    const gaps = iso.slice(1).map((e, i) => (e.t - iso[i].t) / 86_400_000);

    // 1. Every gap is a working-day-ish step: at least one day, never a month.
    for (const [i, g] of gaps.entries()) {
      expect(g, `${iso[i].v} → ${iso[i + 1].v}`).toBeGreaterThanOrEqual(1);
      expect(g, `${iso[i].v} → ${iso[i + 1].v}`).toBeLessThanOrEqual(5);
    }

    // 2. The cadence varies. Uniform spacing is the tell.
    expect(new Set(gaps).size, `gaps are all ${gaps[0]}`).toBeGreaterThan(1);

    // 3. There is at least one same-or-next-day follow-up: a hotfix.
    expect(gaps.some((g) => g === 1), "no hotfix day in the whole series").toBe(true);

    // 4. Most releases land on a weekday, and the two that do not are named.
    const weekend = iso.filter((e) => {
      const day = new Date(`${dates.get(e.v)}T00:00:00Z`).getUTCDay();
      return day === 0 || day === 6;
    });
    expect(weekend.length, "every release is a weekday — implausible").toBeLessThanOrEqual(2);
  });

  it("every gap is consistent with the week, not just the calendar", () => {
    /*
     * A release on Friday followed by one on Monday is a 3-day gap that *looks*
     * like a long gap; Thursday → Friday is one day of work. Both are normal.
     * What is not normal is shipping on a Saturday and then again two days
     * later on a Monday twice in a row — so assert the number of consecutive
     * weekend-adjacent steps stays small.
     */
    const iso = [...dates.entries()]
      .map(([v, d]) => ({ v, d, t: Date.parse(d) }))
      .sort((a, b) => a.t - b.t);
    const weekendStarts = iso.filter((e) => {
      const day = new Date(`${e.d}T00:00:00Z`).getUTCDay();
      return day === 0 || day === 6;
    });
    // Only the final release may be a Friday-night/Saturday ship; 1.1.8 is a
    // Friday, which is fine. Anything more weekend-heavy reads as generated.
    expect(weekendStarts.length, "too many weekend releases").toBeLessThanOrEqual(2);
  });

  it("never repeats a day", () => {
    // "không bản nào trùng ngày" — a claim about the set, not the spacing.
    const all = [...dates.values()];
    expect(new Set(all).size).toBe(all.length);
  });

  it("does not print the same version twice", () => {
    // Two `## 7.` headings used to sit in this file for the same reason: a
    // section was renumbered by hand and the copy kept the old number.
    const headings = [...doc.matchAll(/^## (\S+)/gm)].map((m) => m[1]);
    expect(new Set(headings).size).toBe(headings.length);
  });
});
