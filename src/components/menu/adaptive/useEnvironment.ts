/**
 * Read the `Environment` from the browser, once and on change.
 *
 * `environment.ts` is pure and takes `unknown`s because every one of those
 * readings is a browser API that lies. This hook is the only place that touches
 * `window`, and it is deliberately thin: no decisions, no defaults of its own,
 * just four reads and a subscription.
 *
 * THE INSET MEASURE IS CACHED
 * ---------------------------
 * `readInsets()` appends a probe element and forces a synchronous layout to
 * resolve `env(safe-area-inset-*)` — that is the correct one-off answer and an
 * unacceptable per-frame one. `readEnvironment()` is called on every resize
 * animation frame (a drag fires dozens per second), so an uncached probe means a
 * `getComputedStyle` reflow on *every frame of a drag*: on a mid-range phone
 * that is exactly the jank this system exists to remove.
 *
 * The values cannot change except when the display area itself changes —
 * rotation, fullscreen enter/exit, split-view — so the cache is keyed on the
 * `window` object and expires after `INSET_TTL_MS` as a backstop; the hooks
 * invalidate it explicitly on the two events that can move an inset. Tests that
 * swap in a fresh fake `window` always miss the cache, so a fresh measure is
 * guaranteed for them.
 */
import { useEffect, useState } from "react";
import {
  DESKTOP_ENVIRONMENT,
  parseInset,
  saneDpr,
  type Environment,
} from "./environment";

/** Media queries that change what the layout should do. */
const ENVIRONMENT_QUERIES = {
  coarse: "(pointer: coarse)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
  moreContrast: "(prefers-contrast: more)",
} as const;

/** `true` when the matchMedia is absent (SSR, jsdom without a shim). */
function matches(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia(query).matches === true;
  } catch {
    // Older Safari throws on an unknown query rather than returning false.
    return false;
  }
}

/** How long a measured inset stays valid without an explicit invalidation. */
export const INSET_TTL_MS = 1000;

interface InsetCacheEntry {
  /** Keyed on the window object so a swapped/rebuilt window re-measures. */
  win: unknown;
  at: number;
  value: Pick<Environment, "insetTop" | "insetRight" | "insetBottom" | "insetLeft">;
}
let insetCache: InsetCacheEntry | null = null;

/**
 * Read all four `env(safe-area-inset-*)` values in px, in one layout.
 *
 * The values cannot be read directly — `getComputedStyle` does not resolve
 * `env()` on an element that does not use it — so a throwaway element is created
 * with a `padding` of all four insets, laid out once, and measured.
 *
 * One element, not four: the first version created four and called
 * `getComputedStyle` on each, which is four forced layouts per resize event. It
 * ran on every `resize`, including the dozens a drag fires.
 */
/**
 * Invalidate the memoised insets. Call from any listener whose event can change
 * `env(safe-area-inset-*)` — `orientationchange`, `fullscreenchange`. Cheap, and
 * idempotent.
 */
export function invalidateInsetsCache(): void {
  insetCache = null;
}

export function readInsets(): Pick<Environment, "insetTop" | "insetRight" | "insetBottom" | "insetLeft"> {
  const zero = { insetTop: 0, insetRight: 0, insetBottom: 0, insetLeft: 0 };
  if (typeof window === "undefined" || typeof document === "undefined") return zero;
  const now = Date.now();
  if (insetCache && insetCache.win === window && now - insetCache.at < INSET_TTL_MS) {
    return insetCache.value;
  }
  let probe: HTMLDivElement | null = null;
  try {
    probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    /*
     * A single `padding` shorthand, in CSS order: top right bottom left. Each
     * layer carries its own `0px` fallback, so a browser that does not support
     * `env()` parses `0px` and reports zeroes rather than dropping the
     * declaration.
     */
    probe.style.padding =
      "env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) " +
      "env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)";
    document.body.appendChild(probe);
    const cs = window.getComputedStyle(probe);
    const value = {
      insetTop: parseInset(cs.paddingTop),
      insetRight: parseInset(cs.paddingRight),
      insetBottom: parseInset(cs.paddingBottom),
      insetLeft: parseInset(cs.paddingLeft),
    };
    insetCache = { win: window, at: now, value };
    return value;
  } catch {
    // A document without a body (very early render) or a CSP that blocks inline
    // styles both land here. Zero is the right answer for both.
    return zero;
  } finally {
    probe?.remove();
  }
}

/** Read the environment now. Safe to call during render on the client. */
export function readEnvironment(): Environment {
  if (typeof window === "undefined") return DESKTOP_ENVIRONMENT;
  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    dpr: saneDpr(window.devicePixelRatio),
    landscape: Number.isFinite(width) && Number.isFinite(height) ? width > height : true,
    coarse: matches(ENVIRONMENT_QUERIES.coarse),
    ...readInsets(),
    reducedMotion: matches(ENVIRONMENT_QUERIES.reducedMotion),
    moreContrast: matches(ENVIRONMENT_QUERIES.moreContrast),
  };
}

/**
 * The environment, kept in sync with the window.
 *
 * Subscribes to the same six events `onViewportChange()` uses *plus* the two
 * media queries, because a pointer type can change without a resize — plugging in
 * a mouse on a hybrid device fires `pointer: coarse` → `fine` and nothing else.
 */
export function useEnvironment(): Environment {
  const [env, setEnv] = useState<Environment>(() => readEnvironment());

  useEffect(() => {
    let frame = 0;
    const update = () => {
      // One read per animation frame; a resize drag fires dozens of events.
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setEnv(readEnvironment());
      });
    };

    const onDisplayChange = () => invalidateInsetsCache();
    for (const type of ["resize", "orientationchange", "fullscreenchange"] as const) {
      if (type !== "resize") window.addEventListener(type, onDisplayChange);
      window.addEventListener(type, update);
    }
    window.visualViewport?.addEventListener("resize", update);

    const lists: MediaQueryList[] = [];
    for (const query of Object.values(ENVIRONMENT_QUERIES)) {
      if (typeof window.matchMedia !== "function") continue;
      const list = window.matchMedia(query);
      list.addEventListener?.("change", update);
      lists.push(list);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const type of ["resize", "orientationchange", "fullscreenchange"] as const) {
        if (type !== "resize") window.removeEventListener(type, onDisplayChange);
        window.removeEventListener(type, update);
      }
      window.visualViewport?.removeEventListener("resize", update);
      for (const list of lists) list.removeEventListener?.("change", update);
    };
  }, []);

  return env;
}
