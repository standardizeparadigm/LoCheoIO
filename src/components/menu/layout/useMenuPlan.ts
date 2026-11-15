/**
 * Read the viewport and keep a `MenuPlan` in sync with it.
 *
 * The plan itself is pure (`fit.ts`); this hook only supplies the width and
 * height. Keeping the subscription here rather than in StartScreen means the
 * layout decision stays testable and the component stays a renderer.
 *
 * Notes on the implementation:
 *
 *   - `visualViewport` is preferred when available. On mobile browsers
 *     `window.innerHeight` includes the URL bar that slides away, so a plan
 *     computed from it changes as the user scrolls — which is one of the ways
 *     a layout appears to "jump" on its own.
 *   - Updates are coalesced into an animation frame. A resize drag fires
 *     dozens of events per second and re-planning on each one is wasted work.
 *   - The initial value is computed synchronously from `window` on the client
 *     so the first paint is already correct (no flash from a default plan).
 *     On the server there is no `window`, so it falls back to the 1280×720
 *     reference plan — which is what the SSR smoke test renders.
 */
import { useEffect, useState } from "react";
import { planMenuLayout } from "./fit";
import type { MenuPlan, Viewport } from "./fit";
import { onViewportChange } from "./viewportEvents";
import { readInsets } from "../adaptive/useEnvironment";

/** The viewport the SSR smoke test and the fallback path use. */
export const REFERENCE_VIEWPORT: Viewport = { width: 1280, height: 720 };

/**
 * Read the viewport, or the reference viewport when there is nothing usable.
 *
 * TWO THINGS THIS HAS TO GET RIGHT
 * --------------------------------
 * 1. `visualViewport` reports `0` for both dimensions while a page is being
 *    restored from the back/forward cache, and momentarily during a rotation.
 *    `??` does not catch that — it only catches `null`/`undefined` — so a 0
 *    flowed through as a real measurement and produced a plan for a 1×1
 *    viewport, which is a blank screen for one frame.
 *
 * 2. `Math.round(NaN)` is `NaN`. The plan's own `sane()` clamp now handles
 *    that, but returning NaN from a function whose contract is "a viewport"
 *    pushes the check to every caller. Falling back here keeps the contract.
 *
 * The fallback is the reference viewport rather than a "best guess": when the
 * browser cannot say how big the window is, the honest answer is the size this
 * layout was designed against, not a number invented from a broken one.
 */
function readViewport(): Viewport {
  if (typeof window === "undefined") return REFERENCE_VIEWPORT;
  const vv = window.visualViewport;
  const rawW = vv?.width ?? window.innerWidth;
  const rawH = vv?.height ?? window.innerHeight;
  const usable = (n: number) => Number.isFinite(n) && n >= 1;
  if (!usable(rawW) || !usable(rawH)) return REFERENCE_VIEWPORT;
  /*
   * The safe-area inset is read here, once per viewport update, and carried on
   * the `Viewport` so `planMenuLayout()` can subtract it.
   *
   * Reading it here rather than inside the planner keeps `fit.ts` pure — it
   * takes a number, not a `window` — which is what lets the whole layout be
   * tested without a DOM. `readInsets()` is exported from the adaptive module
   * and does the `env()` probe; it returns zeroes on every desktop browser.
   */
  return { width: Math.round(rawW), height: Math.round(rawH), inset: readViewportInset() };
}

/**
 * `env(safe-area-inset-top + bottom)`, or 0 when there is nothing to read.
 *
 * Wrapped because it runs on every resize and touches the DOM: a throw here
 * would take out the whole re-plan, and the correct fallback (no inset, lay out
 * against the raw viewport) is exactly the pre-round-7 behaviour.
 */
function readViewportInset(): number {
  try {
    const insets = readInsets();
    return insets.insetTop + insets.insetBottom;
  } catch {
    return 0;
  }
}

/** The current viewport width — the same value the plan was computed from. */
export function useViewportWidth(): number {
  const [width, setWidth] = useState<number>(() => readViewport().width);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(readViewport().width));
    };
    const unsubscribe = onViewportChange(update);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, []);
  return width;
}

/** The current plan for the current viewport. */
export function useMenuPlan(): MenuPlan {
  const [plan, setPlan] = useState<MenuPlan>(() => planMenuLayout(readViewport()));

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setPlan(planMenuLayout(readViewport()));
      });
    };
    update();
    /*
     * One subscription, covering resize, orientationchange, fullscreenchange
     * and visualViewport resize — see `viewportEvents.ts` for why fullscreen
     * had to be added in round 6 (it is how the user produced the two
     * screenshots that started it).
     */
    const unsubscribe = onViewportChange(update);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, []);

  return plan;
}
