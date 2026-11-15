/**
 * The windows the project is tested against, as data.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The same 21 viewports were written out three times: once in
 * `scripts/check-adaptive.ts` (the table a person reads), once in the release
 * notes (the table a reviewer reads) and once in `docs/design/adaptive-v2.md` (the
 * table the contract describes). Three copies of one list drift in exactly the
 * way this folder's other files exist to prevent — a size gets added to the probe
 * and never to the doc, and the doc then teaches a reviewer that a window behaves
 * in a way nothing checks.
 *
 * A preset is a *named* window: a phone, a laptop, the two sizes from the bug
 * report. Naming them is what lets a failure say "iPhone SE 1 loses the ticker"
 * instead of "320×568 loses the ticker", and it lets the table be verified
 * against the list rather than against someone's memory.
 *
 * WHAT IS NOT HERE
 * ----------------
 * No thresholds, no pixel values. A preset knows only its size and why it exists;
 * everything it *does* is `resolveAdaptive()`'s answer. A preset that carried its
 * own expectations would be a second source of truth for the layout.
 */

/** A named window. */
export interface ViewportPreset {
  /** Stable id, kebab-case — used by the probe, the docs test and the corpus. */
  id: string;
  /** Window width, CSS px. */
  width: number;
  /** Window height, CSS px. */
  height: number;
  /** Which family it belongs to; the probe prints it and the docs group by it. */
  group: PresetGroup;
  /** Why this window is in the list — usually the device, or the bug report. */
  note: string;
}

/** The families a preset can belong to. */
export type PresetGroup = "phone" | "tablet" | "laptop" | "desktop" | "report" | "stress";

/**
 * The 21 windows.
 *
 * Ordering is deliberate: ascending by the shortest side, so the table reads as
 * the ladder it is. The two `report` entries sit where their *height* puts them,
 * not at the end, because a reviewer looking for "the window from the screenshot"
 * scans the height column.
 */
export const PRESETS: readonly ViewportPreset[] = [
  { id: "iphone-4", width: 320, height: 480, group: "phone", note: "smallest phone still worth supporting" },
  { id: "iphone-se-1", width: 320, height: 568, group: "phone", note: "iPhone SE 1 — the 568px class" },
  { id: "android-small", width: 360, height: 640, group: "phone", note: "the commonest Android size" },
  { id: "iphone-se-2", width: 375, height: 667, group: "phone", note: "iPhone SE 2 / 8" },
  { id: "iphone-12", width: 390, height: 844, group: "phone", note: "iPhone 12/13/14 baseline" },
  { id: "phone-landscape", width: 844, height: 390, group: "phone", note: "notched iPhone in landscape" },
  { id: "iphone-max", width: 414, height: 896, group: "phone", note: "iPhone 11 Pro Max" },
  { id: "short-window", width: 900, height: 500, group: "stress", note: "a browser window dragged short" },
  { id: "laptop-small", width: 1024, height: 600, group: "laptop", note: "netbook / small laptop" },
  { id: "720p-chrome", width: 1280, height: 640, group: "laptop", note: "720p minus browser chrome" },
  { id: "window-1366", width: 1366, height: 650, group: "report", note: "the first windowed report window" },
  { id: "window-1568", width: 1568, height: 677, group: "report", note: "windowed report 1 — compact chrome" },
  { id: "720p", width: 1280, height: 720, group: "laptop", note: "the reference window" },
  { id: "ipad-portrait", width: 768, height: 1024, group: "tablet", note: "iPad portrait" },
  { id: "ipad-landscape", width: 1024, height: 768, group: "tablet", note: "iPad landscape" },
  { id: "laptop-1366", width: 1366, height: 768, group: "laptop", note: "1366×768 laptop" },
  { id: "window-1920", width: 1920, height: 820, group: "report", note: "windowed report 2 — the clipped chip" },
  { id: "macbook-air", width: 1440, height: 900, group: "laptop", note: "MacBook Air" },
  { id: "1080p", width: 1920, height: 1080, group: "desktop", note: "1080p fullscreen" },
  { id: "1440p", width: 2560, height: 1440, group: "desktop", note: "1440p monitor, the first size with no chrome pressure" },
  { id: "4k", width: 3840, height: 2160, group: "desktop", note: "4K — the dialog ceiling" },
];

/** Presets by id, built once. */
const BY_ID = new Map(PRESETS.map((p) => [p.id, p]));

/** A preset by id, or `undefined` — callers that care decide what a miss means. */
export function presetFor(id: string): ViewportPreset | undefined {
  return BY_ID.get(id);
}

/** The presets of one family, in ladder order. */
export function presetsIn(group: PresetGroup): ViewportPreset[] {
  return PRESETS.filter((p) => p.group === group);
}

/** `"1280×720"` — the label the probe and the docs print. */
export function presetSize(preset: ViewportPreset): string {
  return `${preset.width}×${preset.height}`;
}

/**
 * The presets whose *shortest side* is at least `px`.
 *
 * Exists because half the docs want "the windows that can show the ticker" and
 * the honest way to ask is by height, not by a hand-kept subset.
 */
export function presetsTallEnough(px: number): ViewportPreset[] {
  return PRESETS.filter((p) => Math.min(p.width, p.height) >= px);
}

/**
 * The presets as `[width, height, note]` tuples.
 *
 * `check-adaptive.ts` and the older sweeps use this shape, and keeping the
 * conversion here means the *only* place a tuple list exists is this one line.
 */
export function presetTuples(): Array<[number, number, string]> {
  return PRESETS.map((p) => [p.width, p.height, p.note] as [number, number, string]);
}
