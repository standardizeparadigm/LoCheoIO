/**
 * Headless boot for `LoCheoGame` — the engine driven without a browser.
 *
 * WHY THIS EXISTS
 * ---------------
 * The engine is the one part of the app no test could instantiate: the
 * constructor wants a canvas with a 2D context, `requestAnimationFrame`, and
 * (through `buildBackground()`) `document.createElement("canvas")`. So the
 * mode system — nine balance records feeding `pickKind()`, `updateSpawns()`,
 * `resolveCatch()` and `damage()` — was only ever covered *as data*. A mode
 * whose wiring was broken (a record the engine misreads, a time limit that
 * never fires, a one-crack mode that allows two) looked exactly like a mode
 * that works until a screenshot proved otherwise.
 *
 * HOW
 * ---
 * A fake canvas whose `getContext("2d")` returns a Proxy that absorbs every
 * drawing call (gradients, paths, text measure) and stores every property.
 * `document` and `requestAnimationFrame` exist only in this file's module
 * scope — the rest of the suite still runs without a DOM, and this file is
 * the single place that opts in.
 *
 * Deterministic enough: frames are stepped manually with a fixed 16ms delta,
 * so a simulated 60 seconds is ~3 600 frames of pure CPU on the fake context.
 */
import type { LoCheoGame } from "../../src/game/engine";

/** A no-op gradient — `addColorStop` is called on it, nothing else. */
function fakeGradient() {
  return { addColorStop() {} };
}

/** The 2D context: any method call is absorbed; any property is stored. */
function fake2d(canvas: unknown) {
  const target: Record<PropertyKey, unknown> = {};
  return new Proxy(target, {
    get(t, prop) {
      if (prop === "canvas") return canvas;
      if (
        prop === "createLinearGradient" ||
        prop === "createRadialGradient" ||
        prop === "createConicGradient" ||
        prop === "createPattern"
      ) {
        return fakeGradient;
      }
      if (prop === "measureText") return () => ({ width: 16 });
      if (prop === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
      if (prop in t) return t[prop];
      if (typeof prop !== "string") return undefined;
      // Any other property is a method we have not seen: absorb it.
      const noop = () => undefined;
      t[prop] = noop;
      return noop;
    },
    set(t, prop, value) {
      t[prop] = value;
      return true;
    },
  });
}

/** A canvas element, enough of one for the engine to boot and draw into. */
export function makeFakeCanvas(): HTMLCanvasElement {
  const canvas: Record<PropertyKey, unknown> = {};
  canvas.width = 300;
  canvas.height = 150;
  canvas.style = {};
  canvas.clientWidth = 800;
  canvas.clientHeight = 600;
  canvas.getContext = () => fake2d(canvas);
  canvas.addEventListener = () => undefined;
  canvas.removeEventListener = () => undefined;
  canvas.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0,
    toJSON: () => "",
  });
  return canvas as unknown as HTMLCanvasElement;
}

/** Install the minimum globals the engine touches. Idempotent. */
export function installEngineGlobals(): void {
  const g = globalThis as Record<PropertyKey, unknown>;
  if (!g.window) {
    g.window = {
      devicePixelRatio: 1,
      setTimeout,
      clearTimeout,
      addEventListener() {},
      removeEventListener() {},
      // AudioContext deliberately absent — `audio.unlock()` must no-op cleanly.
    };
  }
  if (!g.document) {
    g.document = { createElement: () => makeFakeCanvas() };
  }
  if (!g.requestAnimationFrame) g.requestAnimationFrame = () => 1;
  if (!g.cancelAnimationFrame) g.cancelAnimationFrame = () => undefined;
}

export interface BootedEngine {
  game: LoCheoGame;
  /** Access the class internals the way a white-box test needs to. */
  internals: Record<string, any>;
}

/** Import the engine *after* the globals exist, then boot it. */
export async function bootEngine(): Promise<BootedEngine> {
  installEngineGlobals();
  const mod = await import("../../src/game/engine");
  const game = new mod.LoCheoGame(makeFakeCanvas());
  return { game, internals: game as unknown as Record<string, any> };
}

/** Step `frames` frames of 16ms from a fixed starting timestamp. */
export function stepFrames(booted: BootedEngine, frames: number, startAt = 1_000): void {
  let now = startAt;
  const frame = booted.internals.frame.bind(booted.game) as (now: number) => void;
  for (let i = 0; i < frames; i += 1) {
    now += 16;
    frame(now);
  }
}
