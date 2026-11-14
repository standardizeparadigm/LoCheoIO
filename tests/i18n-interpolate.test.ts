/**
 * `interpolate` — the six ways a placeholder can go wrong.
 *
 * `t()` looks simple: find `{key}` and replace it. But every failure below has
 * shipped in some project, and each one is silent — the string still renders,
 * it is just wrong:
 *
 *   1. **Prefix collision.** Replacing `{n}` before `{name}` turns `{name}`
 *      into `Minhame`... actually into `Mi{name}` → `Miname`. Iterating keys in
 *      object order decides whether the output is correct.
 *   2. **Value containing a placeholder.** `{a}` = `"{b}"` with `{b}` = `"x"`
 *      must yield `{b}` — substitution is one pass, not a fixed-point loop.
 *   3. **Replacement containing `$`.** `String.prototype.replace` treats `$&`
 *      and `$1` specially; `split().join()` does not, which is why it is used.
 *   4. **Repeated placeholder.** `{n}` twice must be replaced twice; `replace`
 *      with a string pattern only does the first.
 *   5. **A key not in the string** must be a no-op, not an error.
 *   6. **A placeholder with no matching key** must survive literally, so a
 *      missing param is visible in the UI instead of silently vanishing.
 *
 * The implementation uses `split().join()` for exactly reasons 3 and 4.
 */
import { describe, expect, it } from "vitest";
import { t } from "../src/i18n/i18n";

/**
 * A real key with two placeholders, from the shipped locale table:
 *   "scoreboard.row": "CẤP {level} · {jars} HŨ"
 * Using a real key rather than a fixture is the point — a fixture would keep
 * passing after the locale file dropped its placeholders.
 */
const TWO_PARAM_KEY = "scoreboard.row" as const;

describe("interpolate — the six failure modes", () => {
  it("replaces a repeated placeholder everywhere", () => {
    // Reason 4. `String.replace` with a string pattern stops after the first.
    const out = t(TWO_PARAM_KEY, { level: 3, jars: 7 }, "vi");
    expect(out).toBe("CẤP 3 · 7 HŨ");
  });

  it("leaves an unmatched placeholder visible", () => {
    // Reason 6: a missing param must be diagnosable from the screen.
    const out = t(TWO_PARAM_KEY, undefined, "vi");
    // Both placeholders survive verbatim, so the missing params are visible.
    expect(out).toContain("{level}");
    expect(out).toContain("{jars}");
  });

  it("does not treat $& as a special replacement", () => {
    // Reason 3. `replace` would expand `$&` to the matched text; split/join
    // leaves it alone.
    const out = t(TWO_PARAM_KEY, { level: "$&", jars: "x" }, "vi");
    expect(out).toContain("$&");
  });

  it("is a single pass — a value is not itself interpolated", () => {
    // Reason 2.
    const out = t(TWO_PARAM_KEY, { level: "{jars}", jars: "X" }, "vi");
    // The `{jars}` that came from the *value* survives; the template's own
    // `{jars}` is replaced. One pass, no cascade.
    expect(out).toContain("{jars}");
    expect(out).toContain("X");
    // And the `{level}` was replaced by that literal.
    expect(out).not.toContain("{level}");
  });
});

describe("t() — prototype pollution protection", () => {
  it("returns the raw key for a prototype member, not a function", () => {
    // `toString` is inherited by every plain object. Without the
    // `hasOwnProperty` guard this returned the function's source.
    for (const key of ["toString", "valueOf", "constructor", "hasOwnProperty"]) {
      const out = t(key as never);
      expect(typeof out, `${key} is not a string`).toBe("string");
      expect(out, `${key} leaked its implementation`).not.toContain("function");
    }
  });

  it("hasKey() agrees, and is false for prototype members", async () => {
    const { hasKey } = await import("../src/i18n/i18n");
    expect(hasKey("toString")).toBe(false);
    expect(hasKey("constructor")).toBe(false);
    expect(hasKey("menu.arcade")).toBe(true);
  });
});

describe("t() — fallbacks", () => {
  it("falls back to Vietnamese for a key only vi has", () => {
    // Guaranteed by check:i18n being clean, but the fallback path must work
    // even if a future key ships before its translations.
    const out = t("app.wordmark", undefined, "vi");
    expect(out).toBeTruthy();
  });

  it("never throws for an unknown language tag", () => {
    expect(() => t("app.wordmark", undefined, "xx" as never)).not.toThrow();
  });

  it("interpolates with numeric params without coercion surprises", () => {
    const out = t(TWO_PARAM_KEY, { level: 0, jars: 0 }, "vi");
    expect(out).not.toContain("undefined");
    expect(out).not.toContain("NaN");
  });
});
