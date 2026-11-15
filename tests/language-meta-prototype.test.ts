import { describe, expect, it } from "vitest";

import type { Language } from "../src/i18n/i18n";
import { LANGUAGE_META, LANGUAGE_META_MAP, metaFor } from "../src/i18n/languageMeta";

/*
 * `metaFor` is the one place a language code from storage, from `?lang=`, or
 * from an older build is turned into something the picker can render. It has to
 * survive a code that is not one of the seven.
 */

const HOSTILE = ["toString", "valueOf", "constructor", "__proto__", "hasOwnProperty"];

describe("metaFor", () => {
  it("returns real metadata for every supported language", () => {
    for (const meta of LANGUAGE_META) {
      expect(metaFor(meta.code)).toBe(meta);
    }
  });

  it.each(HOSTILE)("falls back for the inherited name %s", (code) => {
    // Regression: `LANGUAGE_META_MAP[code] ?? LANGUAGE_META[0]` returned
    // Object.prototype.toString here, and a function is not undefined, so the
    // fallback never ran.
    const out = metaFor(code as Language);
    expect(out).toBe(LANGUAGE_META[0]);
    expect(typeof out.flag).toBe("string");
    expect(typeof out.native).toBe("string");
  });

  it("falls back for an unknown but harmless code", () => {
    expect(metaFor("xx" as Language)).toBe(LANGUAGE_META[0]);
    expect(metaFor("" as Language)).toBe(LANGUAGE_META[0]);
  });

  it("always returns an object with the three display fields", () => {
    for (const code of [...HOSTILE, "vi", "en", "xx"]) {
      const out = metaFor(code as Language);
      expect(out.code).toMatch(/^[a-z]{2}$/);
      expect(out.flag.length).toBeGreaterThan(0);
      expect(out.native.length).toBeGreaterThan(0);
    }
  });

  it("has a map that contains exactly the array", () => {
    expect(Object.keys(LANGUAGE_META_MAP).sort()).toEqual(
      LANGUAGE_META.map((m) => m.code).sort(),
    );
  });

  it("uses a flag and a native name for each of the seven languages", () => {
    expect(LANGUAGE_META).toHaveLength(7);
    for (const meta of LANGUAGE_META) {
      expect(meta.native).not.toBe("");
      expect(meta.short).toMatch(/^[A-Z]{2}$/);
    }
  });
});
