/**
 * The window, as one profile, kept in sync.
 *
 * ONE SUBSCRIPTION, ONE READ, ONE FRAME
 * ------------------------------------
 * The tempting implementation composes the hooks that already exist:
 *
 *     const plan = useMenuPlan();        // resize + visualViewport + fullscreen
 *     const env  = useEnvironment();     // the same events, plus two media queries
 *     const w    = useViewportWidth();   // the same events, again
 *
 * Three subscribers, three `requestAnimationFrame` callbacks, three
 * `setState`s. They are all scheduled from the same event but they are not
 * guaranteed to commit in the same React batch, so one render can hold a plan
 * for the old height and a width for the new one. That is not theoretical: it is
 * how a hero ends up in row layout beside a stacked panel for one frame, which
 * reads as a flicker on a resize drag.
 *
 * This hook subscribes once, reads both numbers in the same frame, resolves one
 * profile, and stores that. A profile is internally consistent by construction,
 * so a partial update is impossible.
 *
 * SSR: `readViewport()` returns the 1280×720 reference and `readEnvironment()`
 * returns the desktop default, so the server render and the first client render
 * agree.
 */
import { useEffect, useMemo, useState } from "react";
import { onViewportChange } from "../layout/viewportEvents";
import { readViewport } from "../layout/useMenuPlan";
import { boxOf } from "./viewport";
import { readEnvironment, type Environment } from "./useEnvironment";
import { resolveAdaptive, type AdaptiveProfile } from "./resolve";

/**
 * Read both halves of the input for the current frame.
 *
 * Exported for the probe script and for tests that want the same numbers the
 * hook would have produced without mounting React.
 */
export function readAdaptiveInput(): { width: number; height: number; env: Environment } {
  const viewport = readViewport();
  return { width: viewport.width, height: viewport.height, env: readEnvironment() };
}

/** Media queries that change the environment but not the viewport box. */
const ENV_QUERIES = ["(pointer: coarse)", "(prefers-reduced-motion: reduce)", "(prefers-contrast: more)"] as const;

/**
 * The live profile.
 *
 * `wideModal` is a parameter rather than state because it is a property of what
 * is on screen, not of the window: opening the changelog re-resolves the profile
 * with `columns: 2`, which is a cheap pure recomputation.
 */
export function useAdaptive(wideModal = false): AdaptiveProfile {
  const [input, setInput] = useState(readAdaptiveInput);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setInput(readAdaptiveInput());
      });
    };

    const unsubscribe = onViewportChange(update);
    const lists: MediaQueryList[] = [];
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      for (const query of ENV_QUERIES) {
        try {
          const list = window.matchMedia(query);
          list.addEventListener?.("change", update);
          lists.push(list);
        } catch {
          // An unknown query throws on older Safari; the media query is then
          // simply never subscribed, which is the pre-existing behaviour.
        }
      }
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      unsubscribe();
      for (const list of lists) list.removeEventListener?.("change", update);
    };
  }, []);

  return useMemo(
    () =>
      resolveAdaptive({
        box: boxOf(input.width, input.height),
        env: input.env,
        wideModal,
      }),
    [input, wideModal],
  );
}

/**
 * Just the CSS variables the profile produces.
 *
 * Split out because a component that only needs to paint `--type-*` should not
 * have to destructure a twelve-field profile — and because the return value is
 * memo-stable across renders that do not change the window, which matters for
 * any future `React.memo` boundary.
 */
export function useAdaptiveVars(wideModal = false): {
  profile: AdaptiveProfile;
  style: Record<string, string>;
} {
  const profile = useAdaptive(wideModal);
  return { profile, style: profile.cssVars };
}
