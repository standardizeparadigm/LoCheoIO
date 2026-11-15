/**
 * `viewport.ts` — the box every adaptive rule reads.
 *
 * The three things that can go wrong with a normaliser are the three this file
 * tests: it can disagree with itself (shortest ≠ min(w, h)), it can leak a
 * non-finite number (the release's most repeated bug), and it can classify the
 * same window two different ways depending on the order the checks run in.
 */
import { describe, expect, it } from "vitest";
import {
  MAX_SIDE,
  aspectClassOf,
  boxOf,
  describeBox,
  isShortLandscape,
  orientationOf,
  roomDriver,
  saneSide,
} from "../src/components/menu/adaptive/viewport";

describe("saneSide", () => {
  it("rounds, floors at 1 and caps at MAX_SIDE", () => {
    expect(saneSide(1280)).toBe(1280);
    expect(saneSide(1280.4)).toBe(1280);
    expect(saneSide(1280.6)).toBe(1281);
    expect(saneSide(0)).toBe(1);
    expect(saneSide(-40)).toBe(1);
    expect(saneSide(1e9)).toBe(MAX_SIDE);
  });

  it("refuses everything that is not a finite positive number", () => {
    for (const bad of [NaN, Infinity, -Infinity, "1280", null, undefined, {}, []]) {
      expect(saneSide(bad), String(bad)).toBe(1);
    }
  });

  it("takes a fallback for the SSR path without letting it be zero", () => {
    expect(saneSide(undefined, 1280)).toBe(1280);
    expect(saneSide(undefined, 0)).toBe(1);
    expect(saneSide(undefined, NaN)).toBe(1);
  });
});

describe("boxOf", () => {
  it("derives every field from the two edges", () => {
    const box = boxOf(1280, 720);
    expect(box).toMatchObject({
      width: 1280,
      height: 720,
      shortest: 720,
      longest: 1280,
      area: 1280 * 720,
      aspect: 1.778,
      orientation: "landscape",
    });
  });

  it("keeps the edges consistent for 4 000 windows", () => {
    for (let w = 240; w <= 4200; w += 37) {
      for (let h = 240; h <= 2400; h += 53) {
        const box = boxOf(w, h);
        expect(box.shortest).toBe(Math.min(box.width, box.height));
        expect(box.longest).toBe(Math.max(box.width, box.height));
        expect(box.shortest).toBeLessThanOrEqual(box.longest);
        expect(box.area).toBe(box.width * box.height);
        expect(Number.isFinite(box.aspect)).toBe(true);
        expect(box.aspect).toBeGreaterThan(0);
      }
    }
  });

  it("never produces a non-finite field, whatever it is handed", () => {
    const bad: Array<[unknown, unknown]> = [
      [NaN, NaN],
      [Infinity, 0],
      [-1, -2],
      [undefined, null],
      ["800", "600"],
    ];
    for (const [w, h] of bad) {
      const box = boxOf(w, h);
      for (const [k, v] of Object.entries(box)) {
        if (typeof v === "number") expect(Number.isFinite(v), `${k} of ${String(w)}×${String(h)}`).toBe(true);
      }
      expect(box.width).toBeGreaterThanOrEqual(1);
      expect(box.height).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("orientation and aspect", () => {
  it("treats a 4% difference as square", () => {
    expect(orientationOf(1000, 1000)).toBe("square");
    expect(orientationOf(1010, 1000)).toBe("square");
    expect(orientationOf(1050, 1000)).toBe("landscape");
    expect(orientationOf(950, 1000)).toBe("portrait");
  });

  it("names the aspect bands in one direction only", () => {
    const cases: Array<[number, number, string]> = [
      [390, 844, "tall"],
      [768, 1024, "portrait"],
      [1000, 1000, "square"],
      [1280, 720, "wide"],
      [2560, 1080, "ultrawide"],
      [3840, 1080, "panoramic"],
    ];
    for (const [w, h, expected] of cases) {
      expect(aspectClassOf(boxOf(w, h)), `${w}×${h}`).toBe(expected);
    }
  });

  it("is total over a sweep of degenerate boxes", () => {
    for (let w = 1; w <= 5000; w += 97) {
      for (let h = 1; h <= 5000; h += 211) {
        const cls = aspectClassOf(boxOf(w, h));
        expect(["tall", "portrait", "square", "wide", "ultrawide", "panoramic"]).toContain(cls);
      }
    }
  });
});

describe("roomDriver", () => {
  it("is 0 at the smallest window and 1 at the largest", () => {
    expect(roomDriver(boxOf(320, 320))).toBe(0);
    expect(roomDriver(boxOf(1920, 1080))).toBe(1);
    expect(roomDriver(boxOf(3840, 2160))).toBe(1);
  });

  it("is monotonic in both axes", () => {
    let previous = -1;
    for (let w = 320; w <= 2000; w += 40) {
      const value = roomDriver(boxOf(w, 900));
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
    previous = -1;
    for (let h = 320; h <= 1400; h += 40) {
      const value = roomDriver(boxOf(1400, h));
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it("survives an inverted or absurd range", () => {
    for (const [below, above] of [
      [1080, 320],
      [0, 0],
      [NaN, 100],
      [100, Infinity],
    ]) {
      const v = roomDriver(boxOf(1280, 720), below, above);
      expect(Number.isFinite(v), `${below}..${above}`).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("helpers", () => {
  it("spots a short landscape window but not a short desktop one", () => {
    expect(isShortLandscape(boxOf(844, 390))).toBe(true);
    expect(isShortLandscape(boxOf(1920, 480))).toBe(true);
    expect(isShortLandscape(boxOf(390, 844))).toBe(false);
    expect(isShortLandscape(boxOf(1920, 1080))).toBe(false);
  });

  it("describes a box in one line", () => {
    expect(describeBox(boxOf(1280, 720))).toBe("1280×720 · wide · landscape");
  });
});
