import { describe, expect, it } from "vitest";

import { hasKey, localeTable, t } from "../src/i18n/i18n";

/*
 * `t()` used to read the message table with `table[key] ?? fallback`. Because
 * the table is a plain object it inherits from `Object.prototype`, so asking for
 * `"toString"` or `"valueOf"` returned a *function* instead of falling through
 * to the fallback. Without params that function leaked into the rendered
 * string; with params `interpolate` called `.split` on it and threw.
 *
 * `MessageKey` makes this unreachable from typed code today, but a key can
 * arrive from a deep link, a query parameter, or a stored value written by an
 * older build whose key has since been renamed. A white screen is a bad answer
 * to a stale bookmark.
 */

const HOSTILE = [
  "toString",
  "valueOf",
  "constructor",
  "hasOwnProperty",
  "__proto__",
  "__defineGetter__",
  "isPrototypeOf",
];

describe("t() and the prototype chain", () => {
  it.each(HOSTILE)("returns a string for %s, not a function", (key) => {
    const out = t(key as never);
    expect(typeof out).toBe("string");
  });

  it.each(HOSTILE)("echoes %s back as the key", (key) => {
    expect(t(key as never)).toBe(key);
  });

  it.each(HOSTILE)("does not throw when the key is asked for with params", (key) => {
    // This is the shape that used to throw: interpolate() got a function.
    expect(() => t(key as never, { n: 1 })).not.toThrow();
  });

  it("still translates a real key", () => {
    const table = localeTable("vi");
    const realKey = Object.keys(table)[0] as never;
    expect(t(realKey)).toBe(table[realKey]);
  });

  it("interpolates params on a real key", () => {
    const vi = localeTable("vi");
    const withPlaceholder = Object.entries(vi).find(([, v]) => v.includes("{"))?.[0];
    if (!withPlaceholder) return; // no placeholder keys in this build
    const out = t(withPlaceholder as never, { n: 7 });
    expect(out).not.toContain("{n}");
  });

  it("falls back to vi when a language is missing a key at runtime", () => {
    // Simulates a locale loaded before its latest keys landed.
    const vi = localeTable("vi");
    const key = Object.keys(vi)[0];
    expect(t(key as never, undefined, "vi")).toBe(vi[key as never]);
  });
});

describe("hasKey()", () => {
  it("accepts every real key", () => {
    for (const key of Object.keys(localeTable("vi"))) {
      expect(hasKey(key), key).toBe(true);
    }
  });

  it.each(HOSTILE)("rejects the inherited name %s", (key) => {
    expect(hasKey(key)).toBe(false);
  });

  it("rejects empty and made-up keys", () => {
    for (const key of ["", "no.such.key", "app.wordmarkLo "]) {
      expect(hasKey(key)).toBe(false);
    }
  });

  it("agrees with the table it describes", () => {
    const table = localeTable("vi");
    const probe = "app.wordmarkLo";
    expect(hasKey(probe)).toBe(Object.prototype.hasOwnProperty.call(table, probe));
  });
});
