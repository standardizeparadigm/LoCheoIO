/**
 * `normalizeScores` — the function every scoreboard row passes through.
 *
 * Its input is `localStorage`, which a player can edit, and its output is the
 * leaderboard, which is the screen the app shows off. Everything it does not
 * sanitise is therefore *visible* garbage rather than a hidden bug.
 *
 * The existing `storage-seed.test.ts` covers the first-run board. This file
 * covers the hostile one.
 */
import { describe, expect, it } from "vitest";
import { normalizeScores } from "../src/game/storage";

/** A row that should survive with minimal change. */
const good = { id: "a", name: "BÀ TƯ", score: 100, level: 3, jars: 2, combo: 5, date: 1_700_000_000_000 };

const one = (patch: Record<string, unknown>) => normalizeScores([{ ...good, ...patch }]);

describe("the board's size and order", () => {
  it("keeps at most eight rows, best first", () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ ...good, id: `r${i}`, score: i * 10 }));
    const out = normalizeScores(rows);
    expect(out).toHaveLength(8);
    for (let i = 1; i < out.length; i++) expect(out[i - 1].score).toBeGreaterThanOrEqual(out[i].score);
  });

  it("returns an empty list for a non-array", () => {
    for (const v of [null, undefined, {}, "x", 42, true]) expect(normalizeScores(v)).toEqual([]);
  });

  it("drops a null row instead of throwing", () => {
    expect(normalizeScores([null, good])).toHaveLength(1);
  });
});

describe("a row is dropped when its identity is unusable", () => {
  it("drops a non-numeric or non-finite score", () => {
    for (const score of ["100", null, undefined, Number.NaN, Infinity, -Infinity]) {
      expect(normalizeScores([{ ...good, score }]), `score=${String(score)}`).toEqual([]);
    }
  });

  it("drops a missing, empty or whitespace-only name", () => {
    for (const name of [undefined, null, 42, "", "   ", "\t\n"]) {
      expect(normalizeScores([{ ...good, name }]), `name=${String(name)}`).toEqual([]);
    }
  });
});

describe("a surviving row is clamped into something printable", () => {
  it("trims then truncates the name", () => {
    // The slice used to be taken from the *untrimmed* string, so a name that
    // arrived with padding rendered with its padding.
    expect(one({ name: "  KHOẢNG TRẮNG  " })[0].name).toBe("KHOẢNG TRẮNG");
    expect(one({ name: "A".repeat(40) })[0].name).toHaveLength(16);
    expect(one({ name: `  ${"B".repeat(40)}  ` })[0].name).toHaveLength(16);
  });

  it("never produces a negative score", () => {
    expect(one({ score: -500 })[0].score).toBe(0);
  });

  it("rounds a fractional score", () => {
    expect(one({ score: 99.6 })[0].score).toBe(100);
  });

  it("keeps level at 1 or above", () => {
    for (const level of [0, -3, 0.2]) expect(one({ level })[0].level).toBeGreaterThanOrEqual(1);
  });

  it("clamps jars and combo to zero or above", () => {
    for (const field of ["jars", "combo"] as const) {
      expect(one({ [field]: -9 })[0][field]).toBe(0);
      expect(one({ [field]: Number.NaN })[0][field]).toBe(0);
    }
  });

  it("fills a missing level, jars or combo rather than printing NaN", () => {
    for (const field of ["level", "jars", "combo"] as const) {
      const v = one({ [field]: undefined })[0][field];
      expect(Number.isFinite(v), `${field} is ${v}`).toBe(true);
    }
  });
});

describe("the date must be renderable", () => {
  /*
   * `num()` rejects NaN and Infinity and accepts any other number, which is the
   * wrong test for a timestamp. Both of these render as garbage in the
   * leaderboard's date column:
   *
   *     1e308  →  "Invalid Date"
   *     -1e15  →  "30/12/-31688902"
   */
  const renders = (t: number) => {
    const d = new Date(t);
    return Number.isFinite(d.getTime()) && d.getUTCFullYear() >= 1970 && d.getUTCFullYear() <= 2100;
  };

  it("replaces an absurdly large date with now", () => {
    expect(renders(one({ date: 1e308 })[0].date)).toBe(true);
  });

  it("replaces a negative date with now", () => {
    expect(renders(one({ date: -1e15 })[0].date)).toBe(true);
  });

  it("keeps a plausible date exactly", () => {
    expect(one({ date: 1_700_000_000_000 })[0].date).toBe(1_700_000_000_000);
  });

  it("keeps the epoch itself", () => {
    // 0 is a legitimate value (unset, not broken) and must not become "now".
    expect(one({ date: 0 })[0].date).toBe(0);
  });

  it("falls back for missing or non-numeric dates", () => {
    for (const date of [undefined, null, "1700000000000", Number.NaN]) {
      expect(renders(one({ date })[0].date), `date=${String(date)}`).toBe(true);
    }
  });
});

describe("ids stay unique enough to dedupe by", () => {
  it("keeps a provided id", () => {
    expect(one({ id: "keep-me" })[0].id).toBe("keep-me");
  });

  it("generates one when the id is empty or not a string", () => {
    for (const id of ["", null, 42, undefined]) {
      const out = one({ id });
      expect(typeof out[0].id).toBe("string");
      expect(out[0].id.length).toBeGreaterThan(0);
    }
  });

  it("generates different ids for two id-less rows", () => {
    // Two rows colliding on one id would make `persistScores` collapse them.
    const out = normalizeScores([
      { ...good, id: undefined },
      { ...good, id: undefined, score: 90 },
    ]);
    expect(new Set(out.map((e) => e.id)).size).toBe(2);
  });
});
