import { describe, expect, it } from "vitest";
import {
  CHANGELOG_ENTRIES,
  entriesForTier,
  tierCounts,
  tierFor,
} from "../src/game/changelog";

describe("tierFor — SemVer → release tier", () => {
  it("maps x.0.0 to major", () => {
    expect(tierFor("1.0.0")).toBe("major");
    expect(tierFor("2.0.0")).toBe("major");
    expect(tierFor("1.2.0")).toBe("minor");
  });

  it("maps 0.x.0 to minor and any non-zero patch to patch", () => {
    expect(tierFor("1.1.0")).toBe("minor");
    expect(tierFor("1.1.1")).toBe("patch");
    expect(tierFor("1.1.7")).toBe("patch");
  });

  it("degrades to patch for junk instead of throwing", () => {
    for (const bad of ["", "x", "1", "1.2", "not-a-version"]) {
      expect(tierFor(bad)).toBe("patch");
    }
  });

  it("never promotes junk to major", () => {
    /*
     * The regression. `Number.parseInt` reads a numeric prefix and ignores the
     * rest, and it accepts radix-16 and exponent notation — so all of these
     * parsed to `0.0.0` and returned **major**, the loudest tier in the UI,
     * for input that is not a version at all:
     *
     *     "0x10.0.0"  → 0.0.0 → major
     *     "1e1.0.0"   → 1.0.0 → major
     *     "-0.0.0"    → 0.0.0 → major
     *
     * Degrading *upward* is worse than throwing: a corrupt changelog entry
     * would have claimed the rarest label rather than failing visibly.
     */
    for (const bad of ["0x10.0.0", "1e1.0.0", "-0.0.0", "+1.0.0", "1..0", "1.1.0.0", "v1.0.0"]) {
      expect(tierFor(bad), `${bad} must not be major`).not.toBe("major");
      expect(tierFor(bad), `${bad} must be patch`).toBe("patch");
    }
  });

  it("still treats leading or trailing whitespace as the version it is", () => {
    // `trim()` before the shape check: a stray space from an env var should not
    // demote a major release to a patch.
    expect(tierFor("  1.0.0  ")).toBe("major");
    expect(tierFor("\t2.0.0\n")).toBe("major");
  });

  it("rejects values that are not safe integers", () => {
    // Beyond 2^53 the digits no longer identify a version.
    expect(tierFor("99999999999999999999.0.0")).toBe("patch");
  });

  it("every changelog entry agrees with its own tier", () => {
    // The whole point of deriving the tag: it can never drift from the number.
    for (const entry of CHANGELOG_ENTRIES) {
      expect(tierFor(entry.version)).toMatch(/^(major|minor|patch)$/);
    }
  });
});

describe("tierCounts / entriesForTier", () => {
  it("counts add up to the full list", () => {
    const counts = tierCounts();
    expect(counts.major + counts.minor + counts.patch).toBe(CHANGELOG_ENTRIES.length);
  });

  it("filtering by null returns everything, by tier returns a subset", () => {
    expect(entriesForTier(null)).toHaveLength(CHANGELOG_ENTRIES.length);
    for (const tier of ["major", "minor", "patch"] as const) {
      const subset = entriesForTier(tier);
      expect(subset.every((e) => tierFor(e.version) === tier)).toBe(true);
      expect(subset.length).toBe(tierCounts()[tier]);
    }
  });

  it("only 1.x.0 releases count as minor (UPDATE)", () => {
    const minors = entriesForTier("minor").map((e) => e.version);
    expect(minors).toEqual(["1.1.0"]);
  });

  it("only x.0.0 releases count as major (MAJOR)", () => {
    const majors = entriesForTier("major").map((e) => e.version);
    expect(majors).toEqual(["1.0.0"]);
  });
});

describe("changelog copy quality (v1.1.7 backfill)", () => {
  it("every release documents at least five concrete changes", () => {
    for (const entry of CHANGELOG_ENTRIES) {
      expect(entry.itemsVi.length, `${entry.version} vi`).toBeGreaterThanOrEqual(5);
      expect(entry.itemsEn.length, `${entry.version} en`).toBe(entry.itemsVi.length);
    }
  });

  it("no release falls back to a bare one-liner summary", () => {
    for (const entry of CHANGELOG_ENTRIES) {
      expect(entry.vi.trim().length, `${entry.version} vi summary`).toBeGreaterThan(30);
      expect(entry.en.trim().length, `${entry.version} en summary`).toBeGreaterThan(30);
    }
  });

  it("bullets are unique within a release (vi and en)", () => {
    for (const entry of CHANGELOG_ENTRIES) {
      expect(new Set(entry.itemsVi).size, `${entry.version} vi`).toBe(entry.itemsVi.length);
      expect(new Set(entry.itemsEn).size, `${entry.version} en`).toBe(entry.itemsEn.length);
    }
  });

  it("release dates form a strictly increasing timeline", () => {
    // Newest-first array, so timestamps must strictly decrease.
    const times = CHANGELOG_ENTRIES.map((e) => Date.parse(e.date));
    for (let i = 1; i < times.length; i++) {
      expect(times[i], `${CHANGELOG_ENTRIES[i].version}`).toBeLessThan(times[i - 1]);
    }
  });

  it("the timeline starts at the 1.0.0 release and ends today-ish", () => {
    const oldest = CHANGELOG_ENTRIES[CHANGELOG_ENTRIES.length - 1];
    expect(oldest.version).toBe("1.0.0");
    expect(oldest.date).toBe("2026-10-26");
  });
});
