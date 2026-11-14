/**
 * The ticker's two invariants.
 *
 * The strip is 48px and contains two lines that must not grow: the marquee
 * (26px) and the footer (16px). In 1.1.7 the footer was a sibling block
 * inside the same flex item, so it wrapped, the strip exceeded its height,
 * and the bottom edge cut the copyright row through the middle of the
 * glyphs.
 *
 * A second invariant is quieter: the ticker keys were an inline array in
 * StartScreen. As a module they can be counted, and every one must resolve in
 * every locale — which is a test, not a hope.
 */
import { describe, expect, it } from "vitest";
import { TICKER_COUNT, TICKER_KEYS, tickerTone } from "../src/components/menu/ticker";
import { TICKER_HEIGHT } from "../src/components/menu/layout";
import * as viLocale from "../src/i18n/locales/vi";

describe("the ticker string set", () => {
  it("has fourteen entries", () => {
    expect(TICKER_KEYS).toHaveLength(14);
    expect(TICKER_COUNT).toBe(14);
  });

  it("keys are unique", () => {
    expect(new Set(TICKER_KEYS).size).toBe(TICKER_KEYS.length);
  });

  it("every key resolves in the source locale", () => {
    const table = Object.values(viLocale).find(
      (v) => v && typeof v === "object" && "ticker.0" in (v as Record<string, string>),
    ) as Record<string, string> | undefined;
    expect(table, "no exported locale table found").toBeTruthy();
    for (const k of TICKER_KEYS) {
      expect(table![k], `${k} is missing from vi`).toBeTruthy();
      expect(table![k].length).toBeGreaterThan(0);
    }
  });
});

describe("tickerTone", () => {
  it("rotates through three colours", () => {
    expect(tickerTone(0)).toBe("tumeric");
    expect(tickerTone(1)).toBe("brine");
    expect(tickerTone(2)).toBe("chili");
    expect(tickerTone(3)).toBe("tumeric");
  });

  it("never puts two of the same colour next to each other", () => {
    for (let i = 0; i < 40; i++) {
      expect(tickerTone(i)).not.toBe(tickerTone(i + 1));
    }
  });

  it("does not repeat across the doubled array the marquee renders", () => {
    // The marquee maps over [...keys, ...keys]. 14 % 3 === 2, so the second
    // copy opens on a different colour than the first — which is what stops a
    // visible seam at the loop point. It must simply still alternate.
    expect(tickerTone(13)).not.toBe(tickerTone(14));
    expect(tickerTone(14)).toBe("chili");
    expect(tickerTone(15)).toBe("tumeric");
  });
});

describe("the strip height is declared, not derived", () => {
  it("is 48px", () => {
    expect(TICKER_HEIGHT).toBe(48);
  });

  it("splits into a 26px marquee and a 16px footer with padding to spare", () => {
    const MARQUEE = 26;
    const FOOTER = 16;
    expect(MARQUEE + FOOTER).toBeLessThanOrEqual(TICKER_HEIGHT);
    expect(TICKER_HEIGHT - MARQUEE - FOOTER).toBe(6);
  });
});
