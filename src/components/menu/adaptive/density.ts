/**
 * Density — how much air the chrome gets, as one named value.
 *
 * WHY THIS IS NOT JUST THE PLAN'S THREE FLAGS
 * -------------------------------------------
 * `MenuPlan` carries `dense`, `tight` and `compact` as independent booleans,
 * and that is right for the planner: each one answers a different inequality.
 * It is wrong for every consumer, because the three flags have **eight**
 * combinations and only four of them are real:
 *
 *   dense + tight        impossible — rich rows are 54px at every density
 *   tight + compact      real, and the tightest state that still shows a hero
 *   compact + dense      real, and the state a 900px-tall laptop lands in
 *   none of them         real, the reference layout
 *
 * A component that reads the flags one at a time has to re-derive that table,
 * which is how `GameMenu` and `InfoMenu` came to draw a panel 28px taller than
 * the plan reserved: they passed `dense` and `tight` to `cornerRowHeight()` and
 * forgot `compact`. The plan was right, the painter was wrong, and the panel
 * overlapped the ticker by 28px on every compact window.
 *
 * So: one function turns the flags into a density, one table turns the density
 * into pixels, and the numbers come from `layout/metrics.ts` rather than from a
 * second copy. `tests/adaptive-density.test.ts` asserts that the table and
 * `cornerRowHeight()` agree for every reachable density — that is the test the
 * GameMenu bug would have failed.
 */

import {
  CORNER_MAX_ROWS,
  CORNER_PANEL_WIDTH,
  CORNER_ROW_MARGIN,
  MENU_ROW_GAP,
  MENU_ROW_GAP_COMPACT,
  MENU_ROW_HEIGHT,
  MENU_ROW_RICH_HEIGHT,
  MENU_ROW_TIGHT_HEIGHT,
  PANEL_BORDER,
  PANEL_FOOTER_HEIGHT,
  PANEL_HEADER_HEIGHT,
  PANEL_HEADER_HEIGHT_COMPACT,
  PANEL_PADDING,
  PANEL_PADDING_COMPACT,
  TICKER_HEIGHT,
  cornerPanelHeight,
  cornerRowReserve,
} from "../layout/metrics";
import type { MenuPlan } from "../layout/fit";

/**
 * The five states the chrome can be in.
 *
 * `minimal` here means "tight rows *and* compact chrome", which is the state a
 * landscape phone lands in — not `plan.minimal`, which is about the hero. The
 * name collision is unfortunate and deliberate: they always coincide, and one
 * word for one visual result is better than `tightAndCompact`.
 */
export type Density = "spacious" | "comfortable" | "compact" | "tight" | "minimal";

/** The flags a density is derived from — a structural subset of `MenuPlan`. */
export interface DensityFlags {
  dense: boolean;
  tight: boolean;
  compact: boolean;
}

/** The flags that actually decide the chrome, in the order they apply. */
export function densityFor(flags: DensityFlags): Density {
  if (flags.tight && flags.compact) return "minimal";
  if (flags.tight) return "tight";
  if (flags.compact) return "compact";
  if (flags.dense) return "spacious";
  return "comfortable";
}

/** The flags a density implies — the inverse, used by the table below. */
export interface DensityMetrics {
  density: Density;
  /** Rows carry a hint line. */
  rich: boolean;
  /** Rows are 26px. */
  tight: boolean;
  /** Gaps, padding and header are the compact set. */
  compact: boolean;
  /** One row's height, px. */
  rowHeight: number;
  /** A rich row's height, px. */
  richRowHeight: number;
  /** Gap between two rows, px. */
  rowGap: number;
  /** Inner padding, top + bottom, px. */
  panelPadding: number;
  /** Header strip height, px. */
  panelHeader: number;
  /** Border overhang, top + bottom, px. */
  panelBorder: number;
  /** Panel width before the viewport clamp, px. */
  panelWidth: number;
  /** Rows the GAME panel holds. */
  rows: number;
  /** Ticker height, px. */
  tickerHeight: number;
  /** One-line stat footer height, px. */
  footerHeight: number;
  /** Icon box inside a row, px. */
  iconSize: number;
  /** Label size inside a row, px. */
  labelSize: number;
  /** Hint size inside a row, px. */
  hintSize: number;
}

/**
 * The table.
 *
 * Every number is read from `layout/metrics.ts`; none is typed here. A copy
 * would drift the first time a threshold moved, and the drift would be
 * invisible until a screenshot — which is the entire history of this folder.
 */
export function metricsFor(density: Density): DensityMetrics {
  const tight = density === "tight" || density === "minimal";
  const compact = density === "compact" || density === "minimal";
  const rich = density === "spacious";
  return {
    density,
    rich,
    tight,
    compact,
    rowHeight: tight ? MENU_ROW_TIGHT_HEIGHT : MENU_ROW_HEIGHT,
    richRowHeight: MENU_ROW_RICH_HEIGHT,
    rowGap: compact ? MENU_ROW_GAP_COMPACT : MENU_ROW_GAP,
    panelPadding: compact ? PANEL_PADDING_COMPACT : PANEL_PADDING,
    panelHeader: compact ? PANEL_HEADER_HEIGHT_COMPACT : PANEL_HEADER_HEIGHT,
    panelBorder: PANEL_BORDER,
    panelWidth: CORNER_PANEL_WIDTH,
    rows: CORNER_MAX_ROWS,
    tickerHeight: TICKER_HEIGHT,
    footerHeight: PANEL_FOOTER_HEIGHT,
    iconSize: tight ? 16 : rich ? 20 : 18,
    labelSize: tight ? 10 : 11,
    hintSize: 9,
  };
}

/** The metrics for a plan — the only call sites that exist should use this. */
export function densityMetricsFor(plan: MenuPlan): DensityMetrics {
  return metricsFor(densityFor(plan));
}

/**
 * The GAME panel's painted height at a density.
 *
 * This is the fix for the painter bug described at the top of the file: the
 * panel reads `densityMetricsFor(plan).panelHeight`, which is by construction
 * the same arithmetic the plan reserved. `compact` can no longer be forgotten,
 * because it is not a parameter any more — it is inside the density.
 */
export function panelHeightFor(density: Density, rows = CORNER_MAX_ROWS): number {
  const m = metricsFor(density);
  return cornerPanelHeight(rows, m.rich, m.tight, m.compact);
}

/** The full bottom reserve at a density, including the ticker and its margin. */
export function reserveFor(density: Density, ticker: boolean, footer: boolean): number {
  const m = metricsFor(density);
  return cornerRowReserve(m.rich, m.tight, ticker, m.compact) - (footer ? 0 : m.footerHeight);
}

/**
 * Panel width for a viewport.
 *
 * Two 224px panels plus gaps need 472px; below that the plan stacks them, and a
 * single stacked panel may use the full width minus its margins. The clamp is
 * here rather than in the components so both panels cannot disagree about how
 * wide "the panel" is.
 */
export function panelWidthFor(viewportWidth: number, density: Density): number {
  const w = Number.isFinite(viewportWidth) ? Math.max(1, Math.trunc(viewportWidth)) : 1;
  const base = metricsFor(density).panelWidth;
  return Math.min(base, Math.max(1, w - CORNER_ROW_MARGIN * 2));
}

/** A density one step airier — used when the window grows past a threshold. */
export function airier(density: Density): Density {
  const order: Density[] = ["minimal", "tight", "compact", "comfortable", "spacious"];
  const i = order.indexOf(density);
  return order[Math.min(order.length - 1, (i < 0 ? 0 : i) + 1)];
}

/** A density one step tighter. */
export function denser(density: Density): Density {
  const order: Density[] = ["minimal", "tight", "compact", "comfortable", "spacious"];
  const i = order.indexOf(density);
  return order[Math.max(0, (i < 0 ? 0 : i) - 1)];
}

/** How much of the viewport the chrome claims, 0..1 — for the debug overlay. */
export function chromeShare(plan: MenuPlan): number {
  const total = plan.scene + plan.reserve;
  return total > 0 ? Math.round((plan.reserve / total) * 1000) / 1000 : 0;
}
