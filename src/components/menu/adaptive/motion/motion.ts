/**
 * How much decorative motion this device should get — a *grade*, not a switch.
 *
 * THE GAP THIS FILLS
 * ------------------
 * Round 15 made the menu honour "reduce motion" properly: `preferencesFor()`
 * OR-s the OS preference and the player's switch into one `motion` field, and
 * `index.css` stops twenty-seven decorative animations when it says `reduced`.
 *
 * That is a switch with one bit, and screens do not come in two kinds. A
 * 1600 px desktop and a 390 px phone run the *same* seventeen infinitely
 * animating layers; the phone has a fifth of the GPU, a battery, and a hero band
 * so short that a 34-second rotation reads as a frozen frame anyway. The
 * adaptive system knew the window was a `handset` — `deviceClass()` has said so
 * since round 11 — and then animated it exactly like a cinema display.
 *
 * So: three grades, and a factor the CSS multiplies its durations by.
 *
 *   `vivid`  factor 1     desktop, tablet, anything with room — full speed
 *   `steady` factor 1.6   handset or coarse pointer — same motion, ~40% slower
 *   `still`  factor 1     the player or the OS asked for less motion — stopped,
 *                         but by the `animation: none` hooks, **not** by the
 *                         multiplier
 *
 * `still` keeps a factor of 1 on purpose. `calc(14s * 0)` is a zero-duration
 * *infinite* animation, which is a specification edge case rather than a stop:
 * some engines drop it, some busy-loop it, and none of them agree. Stopping is
 * the job of the two reduced-motion hooks that already exist and are already
 * tested; the factor only ever *scales*, and it is always ≥ 1.
 *
 * WHY SLOW RATHER THAN OFF
 * ------------------------
 * On a phone the problem is not that a rotating halo is *offensive*, it is that
 * it is expensive per frame and too fast to read in a 170 px band. Halving the
 * frame cost by stopping is the wrong trade: the ornament is part of the
 * identity (see `docs/design/menu-scene.md`). Slowing it costs the same per
 * frame — a CSS transform is composited either way — and reads *better* at
 * small sizes.
 *
 * `still` is a hard stop, and it is the only grade that is allowed to be: it is
 * what the accessibility preference means.
 *
 * THE FACTOR IS A CSS NUMBER
 * --------------------------
 * `--adaptive-motion-factor` is emitted as a bare number so a rule can write
 * `animation-duration: calc(14s * var(--adaptive-motion-factor, 1))`. It is
 * published from the same object the grade is read from, so the attribute a
 * screenshot shows and the number the stylesheet multiplies cannot disagree —
 * the failure mode `constraints.ts` exists to catch.
 */
import type { Preferences } from "../preferences";
import type { DeviceClass } from "../tiers";

/** The three intensities. Ordered loudest to quietest — `MOTION_GRADES[0]` is the default. */
export type MotionGrade = "vivid" | "steady" | "still";

/** Every grade, loudest first. */
export const MOTION_GRADES: readonly MotionGrade[] = ["vivid", "steady", "still"];

/**
 * The duration multiplier per grade.
 *
 * Never 0: see the header. `still` is stopped by the reduced-motion hooks, and a
 * multiplier of 0 would be a second, weaker way of saying the same thing.
 */
export const MOTION_FACTORS: Readonly<Record<MotionGrade, number>> = {
  vivid: 1,
  steady: 1.6,
  still: 1,
};

/** What the menu should do with its decoration on this device. */
export interface MotionPlan {
  /** The grade itself. */
  grade: MotionGrade;
  /** Duration multiplier for `--adaptive-motion-factor`. */
  factor: number;
  /** Why, in a sentence a diagnostic strip can print. */
  why: string;
}

/** Inputs: the resolved preference, the device class, and whether the pointer is coarse. */
export interface MotionInput {
  prefs: Preferences;
  device: DeviceClass;
  /** `env.coarse` — a touch-first pointer, which usually means a small GPU behind it. */
  coarse?: boolean;
}

/**
 * Devices that get `steady` even at a large window.
 *
 * `handset` is the obvious one. `tablet` is deliberately *not* here: an iPad at
 * 1024×1366 has more GPU than most laptops and a hero band tall enough to read a
 * full-speed halo, so slowing it would be a downgrade with no cost to save.
 */
const STEADY_DEVICES: readonly DeviceClass[] = ["handset"];

/** Grade the decoration for one screen. */
export function planMotion({ prefs, device, coarse = false }: MotionInput): MotionPlan {
  if (prefs.motion !== "full") {
    return {
      grade: "still",
      factor: MOTION_FACTORS.still,
      why: "the player or the operating system asked for less motion",
    };
  }
  if (STEADY_DEVICES.includes(device)) {
    return {
      grade: "steady",
      factor: MOTION_FACTORS.steady,
      why: `a ${device} has the smallest band and the least GPU headroom`,
    };
  }
  if (coarse) {
    return {
      grade: "steady",
      factor: MOTION_FACTORS.steady,
      why: "a coarse pointer usually means a phone-sized GPU behind it",
    };
  }
  return { grade: "vivid", factor: MOTION_FACTORS.vivid, why: "room to spare" };
}

/**
 * The factor as it is written into the stylesheet.
 *
 * A string with a decimal point, not a locale-formatted number: `1,6` in a
 * `calc()` is a parse error, and `toFixed` is the cheap way to be sure.
 */
export function motionFactorVar(plan: MotionPlan): string {
  return plan.factor.toFixed(2).replace(/\.?0+$/, "") || "0";
}

/** One line for `describeAdaptive()` and the debug strip. */
export function describeMotion(plan: MotionPlan): string {
  return plan.factor > 1 ? `motion ${plan.grade} ×${motionFactorVar(plan)}` : `motion ${plan.grade}`;
}

/**
 * Does a `animation-duration` written as `calc(Ns * factor)` resolve to a
 * running animation?
 *
 * Used by the CSS test instead of a browser: `calc(14s * 0)` is `0s`, and a
 * zero-duration *infinite* animation is not "stopped" — it is a specification
 * edge case that some engines busy-loop and others drop. The stylesheet must
 * therefore keep `still` on `animation: none` (which the reduced-motion hooks
 * already do) and only ever multiply by a positive number.
 */
export function multipliesSafely(factor: number): boolean {
  return Number.isFinite(factor) && factor >= 1;
}
