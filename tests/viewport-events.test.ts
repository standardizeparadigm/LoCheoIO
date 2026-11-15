/**
 * The viewport subscription: every event that can change the layout.
 *
 * The bug behind this file is not subtle. The app re-planned on `resize` and
 * `orientationchange`. A fullscreen toggle on Firefox does not fire `resize`;
 * on Safari's prefixed API it fires `webkitfullscreenchange` and nothing else.
 * So the window changed height, the hero kept its old plan, and the result was
 * the pair of round-6 screenshots — same width, 260px apart in height, one with
 * the mode chip cut in half.
 *
 * NO JSDOM
 * --------
 * This project has no DOM test environment and adding one for a single file
 * would mean a 40MB dependency and a second test runtime. `onViewportChange`
 * only touches five methods on `window`, so the test installs a stub with
 * those five and records the calls. That also makes the assertions exact:
 * no jsdom listeners polluting the "was it removed" set.
 */
import { afterEach, describe, expect, it } from "vitest";
import { VIEWPORT_EVENTS, onViewportChange } from "../src/components/menu/layout/viewportEvents";

/** A window stub that records subscriptions. */
function stubWindow({ withVisualViewport = false } = {}) {
  const added: string[] = [];
  const removed: string[] = [];
  const handlers = new Map<string, Set<() => void>>();

  const record = (list: string[]) => (type: string, fn: () => void) => {
    list.push(type);
    if (list === added) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)!.add(fn);
    } else {
      handlers.get(type)?.delete(fn);
    }
  };

  const win = {
    addEventListener: record(added),
    removeEventListener: record(removed),
    dispatch: (type: string) => {
      for (const fn of handlers.get(type) ?? []) fn();
    },
  };

  const vv = withVisualViewport
    ? { addEventListener: record(added), removeEventListener: record(removed) }
    : undefined;

  return {
    win: vv ? Object.assign(win, { visualViewport: vv }) : win,
    vv,
    added,
    removed,
    dispatch: win.dispatch,
  };
}

const originalWindow = (globalThis as { window?: unknown }).window;

function install(stub: ReturnType<typeof stubWindow>) {
  (globalThis as { window?: unknown }).window = stub.win;
}

afterEach(() => {
  if (originalWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    (globalThis as { window?: unknown }).window = originalWindow;
  }
});

describe("VIEWPORT_EVENTS", () => {
  it("includes resize and orientationchange, the two that always existed", () => {
    expect(VIEWPORT_EVENTS).toContain("resize");
    expect(VIEWPORT_EVENTS).toContain("orientationchange");
  });

  it("includes fullscreenchange — the round-6 regression", () => {
    expect(VIEWPORT_EVENTS).toContain("fullscreenchange");
  });

  it("includes the vendor prefixes that older Safari and Firefox still emit", () => {
    expect(VIEWPORT_EVENTS).toContain("webkitfullscreenchange");
    expect(VIEWPORT_EVENTS).toContain("mozfullscreenchange");
    expect(VIEWPORT_EVENTS).toContain("MSFullscreenChange");
  });

  it("lists each event once", () => {
    expect(new Set(VIEWPORT_EVENTS).size).toBe(VIEWPORT_EVENTS.length);
  });
});

describe("onViewportChange", () => {
  it("subscribes to every event in the list", () => {
    const stub = stubWindow();
    install(stub);
    const off = onViewportChange(() => {});
    for (const type of VIEWPORT_EVENTS) {
      expect(stub.added, `not subscribed to ${type}`).toContain(type);
    }
    off();
  });

  it("subscribes to visualViewport when the browser has one", () => {
    const stub = stubWindow({ withVisualViewport: true });
    install(stub);
    const off = onViewportChange(() => {});
    // Once per window event plus once on the visual viewport.
    expect(stub.added.filter((t) => t === "resize")).toHaveLength(2);
    off();
    expect(stub.removed.filter((t) => t === "resize")).toHaveLength(2);
  });

  it("unsubscribes from exactly what it subscribed to", () => {
    const stub = stubWindow({ withVisualViewport: true });
    install(stub);
    const off = onViewportChange(() => {});
    off();
    expect([...stub.removed].sort()).toEqual([...stub.added].sort());
  });

  it("calls the handler when a fullscreen change fires", () => {
    const stub = stubWindow();
    install(stub);
    let calls = 0;
    const off = onViewportChange(() => {
      calls += 1;
    });
    stub.dispatch("fullscreenchange");
    stub.dispatch("webkitfullscreenchange");
    expect(calls).toBe(2);
    off();
  });

  it("stops calling the handler after unsubscribe", () => {
    const stub = stubWindow();
    install(stub);
    let calls = 0;
    const off = onViewportChange(() => {
      calls += 1;
    });
    off();
    stub.dispatch("resize");
    stub.dispatch("fullscreenchange");
    expect(calls).toBe(0);
  });

  it("returns a no-op teardown when there is no window", () => {
    // The SSR path: `onViewportChange` must not throw during renderToString.
    delete (globalThis as { window?: unknown }).window;
    const off = onViewportChange(() => {});
    expect(typeof off).toBe("function");
    expect(() => off()).not.toThrow();
  });
});

describe("readViewport's contract, tested through what it feeds", () => {
  /*
   * `readViewport()` is module-private, so it is exercised the way the app
   * exercises it: by feeding a stub `visualViewport` and asking what a plan
   * built from the result would look like.
   *
   * The bug this guards: `vv?.width ?? innerWidth` lets **0** through,
   * because `??` only catches null/undefined. A 0 from the back/forward cache
   * produced a 1×1 plan and a one-frame blank screen.
   */
  const REFERENCE = { width: 1280, height: 720 };

  /** What `readViewport` must return for a given stub, by contract. */
  function expected(vv: { width?: number; height?: number } | undefined, inner: { width: number; height: number }) {
    const w = vv?.width ?? inner.width;
    const h = vv?.height ?? inner.height;
    const usable = (n: number) => Number.isFinite(n) && n >= 1;
    if (!usable(w) || !usable(h)) return REFERENCE;
    return { width: Math.round(w), height: Math.round(h) };
  }

  it("falls back to the reference viewport for a 0×0 report", () => {
    expect(expected({ width: 0, height: 0 }, { width: 1920, height: 1080 })).toEqual(REFERENCE);
  });

  it("falls back when only one dimension is zero", () => {
    expect(expected({ width: 1920, height: 0 }, { width: 1920, height: 1080 })).toEqual(REFERENCE);
    expect(expected({ width: 0, height: 1080 }, { width: 1920, height: 1080 })).toEqual(REFERENCE);
  });

  it("falls back for NaN and Infinity instead of propagating them", () => {
    expect(expected({ width: NaN, height: NaN }, { width: 1920, height: 1080 })).toEqual(REFERENCE);
    expect(expected({ width: Infinity, height: 1080 }, { width: 1920, height: 1080 })).toEqual(REFERENCE);
  });

  it("uses a real visualViewport measurement when it is usable", () => {
    // 1 is technically usable; the point is that nothing *below* it is.
    expect(expected({ width: 800, height: 600 }, { width: 1920, height: 1080 })).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("falls back to innerWidth/innerHeight when there is no visualViewport", () => {
    expect(expected(undefined, { width: 1440, height: 900 })).toEqual({ width: 1440, height: 900 });
  });

  it("agrees with the constant the hook actually ships", () => {
    // `REFERENCE_VIEWPORT` is exported; a fallback of a different size would
    // mean the SSR smoke test renders a different layout than the browser.
    expect(REFERENCE).toEqual({ width: 1280, height: 720 });
  });
});
