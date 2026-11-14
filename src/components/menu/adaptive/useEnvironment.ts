/**
 * Read the `Environment` from the browser, once and on change.
 *
 * `environment.ts` is pure and takes `unknown`s because every one of those
 * readings is a browser API that lies. This hook is the only place that touches
 * `window`, and it is deliberately thin: no decisions, no defaults of its own,
 * just four reads and a subscription.
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
export function readInsets(): Pick<Environment, "insetTop" | "insetRight" | "insetBottom" | "insetLeft"> {
  const zero = { insetTop: 0, insetRight: 0, insetBottom: 0, insetLeft: 0 };
  if (typeof window === "undefined" || typeof document === "undefined") return zero;
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
    return {
      insetTop: parseInset(cs.paddingTop),
      insetRight: parseInset(cs.paddingRight),
      insetBottom: parseInset(cs.paddingBottom),
      insetLeft: parseInset(cs.paddingLeft),
    };
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

    for (const type of ["resize", "orientationchange", "fullscreenchange"] as const) {
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
        window.removeEventListener(type, update);
      }
      window.visualViewport?.removeEventListener("resize", update);
      for (const list of lists) list.removeEventListener?.("change", update);
    };
  }, []);

  return env;
}
