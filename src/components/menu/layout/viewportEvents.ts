/**
 * Every event that can change the viewport, in one place.
 *
 * THE MISSING ONE
 * ---------------
 * Round 6 is two screenshots of the same window: 1920×1080 and 1920×820. The
 * user produced that state by pressing the fullscreen key, and the app did not
 * re-plan when it happened — `resize` fires on most browsers when fullscreen
 * toggles, but not reliably, and never on Safari's fullscreen API. The hero
 * then kept the plan it had computed for the old height until the next resize.
 *
 * So `fullscreenchange` (and its vendor-prefixed cousins, still needed for
 * older Safari) is subscribed alongside the three events the hook already had.
 *
 * WHY A MODULE
 * ------------
 * `useMenuPlan()` and `useViewportWidth()` both need this subscription, and
 * they were duplicating it — which is how the two could drift and describe
 * different windows. One list, one subscribe function, both hooks use it.
 */

/** The events that change the usable viewport. */
export const VIEWPORT_EVENTS = [
  "resize",
  "orientationchange",
  "fullscreenchange",
  "webkitfullscreenchange",
  "mozfullscreenchange",
  "MSFullscreenChange",
] as const;

/**
 * Subscribe `handler` to every viewport event on `window` and `visualViewport`.
 *
 * Returns the unsubscribe function, ready to be used as a `useEffect` cleanup.
 * `visualViewport` is optional and absent on the server and in jsdom, hence the
 * optional chain rather than a guard the caller has to repeat.
 */
export function onViewportChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  for (const type of VIEWPORT_EVENTS) {
    window.addEventListener(type, handler);
  }
  window.visualViewport?.addEventListener("resize", handler);

  return () => {
    for (const type of VIEWPORT_EVENTS) {
      window.removeEventListener(type, handler);
    }
    window.visualViewport?.removeEventListener("resize", handler);
  };
}
