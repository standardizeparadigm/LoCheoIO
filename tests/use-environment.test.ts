/**
 * `readEnvironment()` against a hand-built `window` and `document`.
 *
 * No jsdom in this project, so the fakes are written here — the same approach
 * `tests/clipboard.test.ts` takes. The point is not to simulate a browser but to
 * exercise the four failure modes that are invisible in one:
 *
 *   · `matchMedia` absent (SSR, older jsdom);
 *   · `matchMedia` present but *throwing* (Safari on an unknown query);
 *   · `document.body` absent (a very early render);
 *   · `getComputedStyle` returning something `parseInset` cannot read.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readEnvironment } from "../src/components/menu/adaptive/useEnvironment";
import { DESKTOP_ENVIRONMENT } from "../src/components/menu/adaptive/environment";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

/** Install a fake window/document for one test. */
function fake(opts: {
  width?: number;
  height?: number;
  dpr?: number;
  matchMedia?: (q: string) => unknown;
  padding?: string;
  body?: boolean;
}) {
  const listeners: string[] = [];
  const el = {
    style: {} as Record<string, string>,
    remove: () => {},
  };
  (globalThis as Record<string, unknown>).document = {
    createElement: () => el,
    body: opts.body === false ? null : { appendChild: () => {} },
  };
  (globalThis as Record<string, unknown>).window = {
    innerWidth: opts.width,
    innerHeight: opts.height,
    devicePixelRatio: opts.dpr,
    matchMedia: opts.matchMedia,
    getComputedStyle: () => ({
      paddingTop: opts.padding ?? "0px",
      paddingRight: opts.padding ?? "0px",
      paddingBottom: opts.padding ?? "0px",
      paddingLeft: opts.padding ?? "0px",
    }),
    addEventListener: (_: string) => listeners.push(_),
    removeEventListener: () => {},
    visualViewport: undefined,
  };
  return { listeners, el };
}

afterEach(() => {
  (globalThis as Record<string, unknown>).window = originalWindow;
  (globalThis as Record<string, unknown>).document = originalDocument;
  vi.restoreAllMocks();
});

describe("readEnvironment", () => {
  it("returns the desktop defaults when there is no window", () => {
    (globalThis as Record<string, unknown>).window = undefined;
    (globalThis as Record<string, unknown>).document = undefined;
    expect(readEnvironment()).toEqual(DESKTOP_ENVIRONMENT);
  });

  it("reads width/height/orientation", () => {
    fake({ width: 1920, height: 1080 });
    const env = readEnvironment();
    expect(env.landscape).toBe(true);

    fake({ width: 375, height: 667 });
    expect(readEnvironment().landscape).toBe(false);
  });

  it("clamps a zero or absurd devicePixelRatio", () => {
    fake({ width: 800, height: 600, dpr: 0 });
    expect(readEnvironment().dpr).toBe(1);
    fake({ width: 800, height: 600, dpr: 12 });
    expect(readEnvironment().dpr).toBe(4);
  });

  it("survives matchMedia being absent", () => {
    // The SSR smoke test renders with no matchMedia at all.
    fake({ width: 800, height: 600 });
    const env = readEnvironment();
    expect(env.coarse).toBe(false);
    expect(env.reducedMotion).toBe(false);
  });

  it("survives matchMedia throwing on an unknown query", () => {
    fake({
      width: 800,
      height: 600,
      matchMedia: () => {
        throw new Error("unknown query");
      },
    });
    expect(() => readEnvironment()).not.toThrow();
    expect(readEnvironment().coarse).toBe(false);
  });

  it("reads the coarse pointer", () => {
    fake({
      width: 844,
      height: 390,
      matchMedia: (q) => ({ matches: q.includes("coarse") }),
    });
    expect(readEnvironment().coarse).toBe(true);
  });

  it("reads the insets from the probe's computed padding", () => {
    fake({ width: 844, height: 390, padding: "44px" });
    const env = readEnvironment();
    expect(env.insetTop).toBe(44);
    expect(env.insetBottom).toBe(44);
  });

  it("reads an unparseable padding as 0", () => {
    // Desktop Chrome returns "" for an unsupported env().
    fake({ width: 1280, height: 720, padding: "" });
    const env = readEnvironment();
    expect(env.insetTop).toBe(0);
    expect(env.insetBottom).toBe(0);
  });

  it("survives a document with no body", () => {
    // `document.body` is null before the first paint; appendChild would throw.
    fake({ width: 1280, height: 720, body: false });
    expect(() => readEnvironment()).not.toThrow();
    expect(readEnvironment().insetTop).toBe(0);
  });

  it("removes its probe element even when getComputedStyle throws", () => {
    let removed = false;
    const el = { style: {} as Record<string, string>, remove: () => { removed = true; } };
    (globalThis as Record<string, unknown>).document = {
      createElement: () => el,
      body: { appendChild: () => {} },
    };
    (globalThis as Record<string, unknown>).window = {
      innerWidth: 800,
      innerHeight: 600,
      devicePixelRatio: 1,
      matchMedia: undefined,
      getComputedStyle: () => {
        throw new Error("detached");
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    expect(readEnvironment().insetTop).toBe(0);
    expect(removed, "the probe must not leak into the DOM").toBe(true);
  });
});
