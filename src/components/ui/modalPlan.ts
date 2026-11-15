/**
 * How big a dialog gets, from the window it opens in.
 *
 * THE BUG THIS FIXES
 * ------------------
 * `Modal` carried `max-h-[86vh]` and `max-w-md` / `max-w-2xl` as constants.
 * `86vh` is a percentage of the *layout* viewport, which ignores the on-screen
 * keyboard and the mobile URL bar — on a 390×844 phone with the keyboard open
 * (about 300px of usable height) a settings dialog is 726px tall, and its own
 * footer scrolls out of reach. The width constants are worse on a small phone:
 * `max-w-md` is 448px, wider than the 390px screen, so the dialog is clipped by
 * the viewport rather than fitted to it.
 *
 * A dialog's size is a function of the window, so it is computed from the window
 * like everything else in this folder. `tests/adaptive-modal.test.ts` sweeps
 * 1 200 windows and asserts four properties: the panel never exceeds the window,
 * the padding never eats the content, a two-column dialog is only chosen when
 * two columns fit, and every number is finite.
 */

import { fluid, legible, quantised } from "../menu/adaptive/scale";
import { roomDriver, type Box } from "../menu/adaptive/viewport";

/** What a dialog decides for one window. */
export interface ModalPlan {
  /** Widest the panel may be, px. */
  maxWidth: number;
  /** Tallest the panel may be, px. */
  maxHeight: number;
  /** Inner padding of the panel, px. */
  padding: number;
  /** Gap between the two columns when there are two, px. */
  gap: number;
  /** Title size, px. */
  titleSize: number;
  /** Body size, px. */
  bodySize: number;
  /** Columns the content asks for — `1` below 560px of panel. */
  columns: 1 | 2;
  /** True when the content has to scroll, which is every dialog on a phone. */
  scroll: boolean;
}

/** The two width classes the app uses: `max-w-md` and `max-w-2xl`. */
export const MODAL_WIDTH = { narrow: 448, wide: 672 } as const;

/** The margin between the panel and the window edge, at its smallest. */
export const MODAL_MIN_INSET = 8;

/** Below this panel width a two-column layout does not fit two readable columns. */
export const MODAL_TWO_COLUMN_MIN = 560;

/**
 * Plan a dialog.
 *
 * `wide` is the caller's request (settings and changelog ask for two columns);
 * it is a *ceiling*, not a promise. On a phone the request is downgraded to one
 * column rather than squeezing two 250px columns into 390px.
 */
export function planModal(box: Box, wide = false): ModalPlan {
  const inset = box.shortest < 420 ? MODAL_MIN_INSET : box.shortest < 720 ? 12 : 24;
  /*
   * `86vh` is kept as the *preference* — it is what the app has always drawn —
   * but it is clamped by the window minus the inset, and by an absolute ceiling
   * the content can survive. The three-way min is the fix: the old single
   * `86vh` could exceed the window when the layout viewport was larger than the
   * visual one.
   */
  const comfortable = Math.round(box.height * 0.86);
  const usable = Math.max(160, box.height - inset * 2);
  const maxHeight = Math.max(160, Math.min(usable, Math.max(200, comfortable)));

  const requested = wide ? MODAL_WIDTH.wide : MODAL_WIDTH.narrow;
  const maxWidth = Math.max(240, Math.min(requested, box.width - inset * 2));

  const drive = roomDriver(box, 360, 1100);
  const padding = quantised(fluid({ min: 10, max: 20 }, drive), 1, 8);

  return {
    maxWidth,
    maxHeight,
    padding,
    gap: quantised(fluid({ min: 10, max: 22 }, drive), 1, 8),
    titleSize: legible(fluid({ min: 11, max: 14 }, drive), 11, 15),
    bodySize: legible(fluid({ min: 12, max: 15 }, drive), 12, 16),
    columns: wide && maxWidth >= MODAL_TWO_COLUMN_MIN ? 2 : 1,
    scroll: maxHeight < box.height - inset * 2,
  };
}

/** The dialog as inline CSS, ready for a `style` prop. */
export function modalStyle(plan: ModalPlan): {
  maxWidth: number;
  maxHeight: number;
  width: string;
} {
  return {
    maxWidth: plan.maxWidth,
    maxHeight: plan.maxHeight,
    width: "100%",
  };
}
