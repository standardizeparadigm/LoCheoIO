/**
 * Start-screen layout — numbers, then the function that picks between them.
 *
 * ```ts
 * import { planMenuLayout, cornerRowReserve } from "./layout";
 * ```
 *
 * Read `metrics.ts` first (every declared height), then `fit.ts` (how a
 * viewport picks between them), then its README (why this module exists).
 */
export {
  MENU_ROW_HEIGHT,
  MENU_ROW_RICH_HEIGHT,
  MENU_ROW_GAP,
  PANEL_HEADER_HEIGHT,
  PANEL_PADDING,
  PANEL_BORDER,
  CORNER_MAX_ROWS,
  CORNER_PANEL_WIDTH,
  CORNER_ROW_GAP,
  CORNER_ROW_MARGIN,
  TICKER_HEIGHT,
  TICKER_FOOTER_HEIGHT,
  STACK_BREAKPOINT,
  RICH_ROW_BREAKPOINT,
  MIN_SCENE_HEIGHT,
  PREFERRED_SCENE_HEIGHT,
  TIGHT_SCENE_HEIGHT,
  TICKER_HIDE_HEIGHT,
  rowHeight,
  cornerPanelHeight,
  cornerRowHeight,
  cornerRowReserve,
} from "./metrics";

export {
  planMenuLayout,
  planFits,
  usableHeight,
  MAX_INSET,
  occupiesExactly,
  cornerLayoutFor,
  rowDensityFor,
} from "./fit";

export type { Viewport, MenuPlan, CornerLayout, RowDensity } from "./fit";

export { useMenuPlan, useViewportWidth, REFERENCE_VIEWPORT } from "./useMenuPlan";
