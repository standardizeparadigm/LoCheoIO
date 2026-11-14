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
      const md = iso.slice(5); // "2026-11-12" → "11-12"
      const pattern = new RegExp(`${version.replace(/\./g, "\\.")}\\s+(\\*\\*)?(\\d{2}-\\d{2})`);
      const found = doc.match(pattern);
      expect(found, `no date printed for ${version}`).toBeTruthy();
      expect(found![2], `${version} printed ${found![2]}, entry says ${md}`).toBe(md);
    }
  });

  it("marks 1.1.8 itself in bold, as the release being described", () => {
    expect(doc).toMatch(/\*\*1\.1\.8\s+\d{2}-\d{2}\*\*/);
  });

  it("keeps the cadence it claims, with the one exception named", () => {
    /*
     * The prose says "Nhịp hai ngày, không bản nào trùng ngày". The first step
     * is three days, not two: 1.0.0 shipped 10-24 and 1.1.0 on 10-27. That is a
     * real exception, not a typo — 1.0.0 was the launch, and the cadence began
     * with the release after it. Asserted explicitly so the sentence and the
     * dates cannot drift apart in either direction.
     */
    const iso = [...dates.entries()]
      .map(([v, d]) => ({ v, t: Date.parse(d) }))
      .sort((a, b) => a.t - b.t);
    const days = iso.slice(1).map((e, i) => (e.t - iso[i].t) / 86_400_000);
    expect(days[0], "1.0.0 → 1.1.0 is the launch gap").toBe(3);
    for (const [i, d] of days.slice(1).entries()) {
      expect(d, `${iso[i + 1].v} → ${iso[i + 2].v}`).toBe(2);
    }
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
