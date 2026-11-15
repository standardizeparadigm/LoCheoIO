/**
 * `layout/metrics.ts` is the arithmetic every other layout decision rests on,
 * and seven of its constants had no assertion anywhere:
 *
 *     MENU_ROW_GAP_COMPACT · PANEL_PADDING_COMPACT · PANEL_HEADER_HEIGHT_COMPACT
 *     PANEL_FOOTER_HEIGHT · CORNER_ROW_GAP · CORNER_ROW_MARGIN · TICKER_FOOTER_HEIGHT
 *
 * They are not free constants. Each one is a term in `cornerPanelHeight()`,
 * which produces the *declared* height of a corner panel — the number that
 * stops the panel sizing itself to its content and pushing the hero off the
 * band. That was the v1.1.7 bug, and a wrong term here brings it back through
 * a different door: a 430px panel declared as 426 clips 4px of its last row, and
 * nothing throws.
 *
 * So the panel height is asserted twice: as an arithmetic identity (the sum of
 * its own terms) and as a literal (430/458), because an identity agrees with
 * itself even when both sides are wrong.
 */
import { describe, expect, it } from "vitest";

import {
  CORNER_MAX_ROWS,
  CORNER_ROW_GAP,
  CORNER_ROW_MARGIN,
  MENU_ROW_GAP,
  MENU_ROW_GAP_COMPACT,
  MENU_ROW_RICH_HEIGHT,
  PANEL_BORDER,
  PANEL_FOOTER_HEIGHT,
  PANEL_HEADER_HEIGHT,
  PANEL_HEADER_HEIGHT_COMPACT,
  PANEL_PADDING,
  PANEL_PADDING_COMPACT,
  TICKER_HEIGHT,
  cornerPanelHeight,
  cornerRowHeight,
  cornerRowReserve,
  rowHeight,
} from "../src/components/menu/layout/metrics";

describe("the compact economy is smaller than the normal one, term by term", () => {
  it("shrinks the gap between rows", () => {
    expect(MENU_ROW_GAP_COMPACT).toBeLessThan(MENU_ROW_GAP);
    expect(MENU_ROW_GAP_COMPACT).toBeGreaterThanOrEqual(0);
  });

  it("shrinks the panel padding", () => {
    expect(PANEL_PADDING_COMPACT).toBeLessThan(PANEL_PADDING);
  });

  it("shrinks the header", () => {
    expect(PANEL_HEADER_HEIGHT_COMPACT).toBeLessThan(PANEL_HEADER_HEIGHT);
  });

  it("keeps the border and the rows, because those are not air", () => {
    // The whole point of the compact economy is that it buys height from gaps,
    // padding and header — never from a row and never from the border, which
    // would visibly crop the panel edge.
    expect(rowHeight(true, true)).toBe(MENU_ROW_RICH_HEIGHT);
  });
});

describe("cornerPanelHeight", () => {
  it("equals the sum of its own terms, normal economy", () => {
    const n = CORNER_MAX_ROWS;
    const expected =
      PANEL_HEADER_HEIGHT +
      n * MENU_ROW_RICH_HEIGHT +
      (n - 1) * MENU_ROW_GAP +
      PANEL_PADDING +
      PANEL_BORDER;
    expect(cornerPanelHeight(n, true)).toBe(expected);
  });

  it("equals the sum of its own terms, compact economy", () => {
    const n = CORNER_MAX_ROWS;
    const expected =
      PANEL_HEADER_HEIGHT_COMPACT +
      n * MENU_ROW_RICH_HEIGHT +
      (n - 1) * MENU_ROW_GAP_COMPACT +
      PANEL_PADDING_COMPACT +
      PANEL_BORDER;
    expect(cornerPanelHeight(n, true, false, true)).toBe(expected);
  });

  it("is 458px normal and 430px compact at seven rich rows", () => {
    // The two numbers the docs quote. If one moves, four documents are wrong.
    expect(cornerPanelHeight(7, true)).toBe(458);
    expect(cornerPanelHeight(7, true, false, true)).toBe(430);
  });

  it("saves 28px by going compact, not 32 and not 0", () => {
    // The commit that introduced this said 32; the terms say 28. The terms win.
    expect(cornerPanelHeight(7, true) - cornerPanelHeight(7, true, false, true)).toBe(28);
  });

  it("treats tight rows as irrelevant when the rows are rich", () => {
    // `rowHeight(rich, tight)` short-circuits on `rich`, so a caller that passes
    // both must get the rich height — otherwise a 7-row panel would be declared
    // 196px shorter than it renders.
    expect(cornerPanelHeight(7, true, true)).toBe(cornerPanelHeight(7, true, false));
  });

  it("uses the tight row height only when the rows are not rich", () => {
    const tight = cornerPanelHeight(7, false, true);
    const normal = cornerPanelHeight(7, false, false);
    expect(tight).toBeLessThan(normal);
    expect(normal - tight).toBe(7 * (rowHeight(false, false) - rowHeight(false, true)));
  });

  it("floors a nonsense row count at one row instead of emitting NaN", () => {
    // NaN and Infinity reach here from a corrupt saved layout. `Math.max(1, NaN)`
    // is NaN, and a NaN height is silently dropped by React — which is the
    // content-sized-panel bug again.
    for (const bad of [Number.NaN, Number.NEGATIVE_INFINITY, -3, 0]) {
      expect(cornerPanelHeight(bad, true), String(bad)).toBe(cornerPanelHeight(1, true));
    }
    expect(cornerPanelHeight(Number.POSITIVE_INFINITY, true)).toBe(cornerPanelHeight(1, true));
  });

  it("truncates a fractional row count, so no odd height can be produced", () => {
    expect(cornerPanelHeight(2.7, true)).toBe(cornerPanelHeight(2, true));
  });
});

describe("cornerRowHeight", () => {
  it("is the seven-row panel, because GAME sets the row height for both panels", () => {
    expect(cornerRowHeight(true)).toBe(cornerPanelHeight(CORNER_MAX_ROWS, true));
  });

  it("leaves 240px empty in the three-row INFO panel, which section 12 documents", () => {
    // docs/releases/v1.1.8.md §12 explains this gap and used to quote 320px,
    // 46px rows and a 458px three-row panel — none of which the code produces.
    expect(cornerPanelHeight(7, true) - cornerPanelHeight(3, true)).toBe(240);
  });

  it("is taller than the four-row INFO panel, which is why INFO has slack", () => {
    const info = cornerPanelHeight(4, true);
    expect(cornerRowHeight(true)).toBeGreaterThan(info);
    expect(cornerRowHeight(true) - info).toBe(3 * (MENU_ROW_RICH_HEIGHT + MENU_ROW_GAP));
  });
});

describe("cornerRowReserve", () => {
  it("is the row height, plus the ticker, plus the margin — nothing else", () => {
    expect(cornerRowReserve(true)).toBe(cornerRowHeight(true) + TICKER_HEIGHT + CORNER_ROW_MARGIN);
  });

  it("drops the ticker term when the ticker is hidden", () => {
    expect(cornerRowReserve(true, false, false)).toBe(
      cornerRowReserve(true, false, true) - TICKER_HEIGHT,
    );
  });

  it("is 518 normal and 490 compact", () => {
    expect(cornerRowReserve(true)).toBe(518);
    expect(cornerRowReserve(true, false, true, true)).toBe(490);
  });
});

describe("the constants that are not in any formula here but are used by the renderer", () => {
  it("keeps a footer height, a row gap and a margin that are all positive", () => {
    // Trivial individually; their value is that deleting one of them now fails
    // here instead of silently removing a term from a hand-built layout.
    for (const n of [PANEL_FOOTER_HEIGHT, CORNER_ROW_GAP, CORNER_ROW_MARGIN]) {
      expect(n).toBeGreaterThan(0);
    }
  });
});
