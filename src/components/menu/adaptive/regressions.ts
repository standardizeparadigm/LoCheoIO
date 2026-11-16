/**
 * The windows that broke, as data — one entry per screenshot this project has ever
 * been sent.
 *
 * WHY THIS EXISTS ALONGSIDE `presets.ts`
 * --------------------------------------
 * `presets.ts` answers "which sizes do we support". This file answers a different
 * question: "which sizes have already gone wrong, and what was wrong". The two
 * overlap (1920×820 is both a preset and a bug report) and that is fine — a preset
 * is a device class, a regression is an incident, and an incident has a *round*,
 * a *symptom* and a *fix* attached to it.
 *
 * The corpus in `tests/fixtures/regressions/` snapshots the profile of each of
 * these windows. It is the smallest corpus in the project and the one most likely
 * to catch a real regression, because every entry is a window where the layout was
 * once *visibly* wrong.
 *
 * WHAT IS NOT HERE
 * ----------------
 * No expected numbers. A fixture that carried its own expectations would be a
 * second source of truth for the layout; the snapshot is generated from
 * `resolveAdaptive()`, so this file only has to say *which* window and *why it
 * matters*.
 */

/** One incident. */
export interface RegressionWindow {
  /** Stable kebab-case id — the fixture filename. */
  id: string;
  /** Round of v1.1.8 that fixed it. */
  round: number;
  /** Window width, CSS px. */
  width: number;
  /** Window height, CSS px. */
  height: number;
  /** The symptom, in the words of the report that produced it. */
  symptom: string;
  /** What now has to stay true. Checked as a sentence in the corpus test. */
  guard: string;
}

/**
 * The list, oldest incident first.
 *
 * Sizes are the *reported* sizes, not the sizes that reproduce best: a bug report
 * that says 1920×820 is a bug at 1920×820.
 */
export const REGRESSIONS: readonly RegressionWindow[] = [
  {
    id: "r01-windowed-1920x820",
    round: 1,
    width: 1920,
    height: 820,
    symptom: "windowed: the hero laid out as a row and its lower half sat under the corner panels; the mode chip was cut in half",
    guard: "the band seats the arrangement the hero chose, and the chip is fully drawn",
  },
  {
    id: "r06-start-overflow-1280x720",
    round: 6,
    width: 1280,
    height: 720,
    symptom: "the start screen overflowed: four layout bugs with one cause, the hero left with 250px of band",
    guard: "scene + reserve is exactly the usable height, so there is nothing to scroll",
  },
  {
    id: "r06-scroll-320x568",
    round: 6,
    width: 320,
    height: 568,
    symptom: "«LỌ» was clipped and could not be scrolled to, because a centred scroll box put its top above the scroll origin",
    guard: "the smallest supported phone gets a real band, not a crop",
  },
  {
    id: "r06-tight-320x480",
    round: 6,
    width: 320,
    height: 480,
    symptom: "the tier below the scroll fix: every economy on, and a wordmark that still had to fit",
    guard: "the wordmark's box is inside the band even with every economy enabled",
  },
  {
    id: "r07-low-window-1920x400",
    round: 7,
    width: 1920,
    height: 400,
    symptom: "on a 400px-tall window the hero was a row with nowhere to put it, and the HUD drew under the board",
    guard: "a short window is never given the row arrangement",
  },
  {
    id: "r08-deck-band-1280x640",
    round: 8,
    width: 1280,
    height: 640,
    symptom: "the deck band claimed height the hero needed, at exactly the size Chrome windowed gives you",
    guard: "the chrome's reserve leaves the hero at least its floor",
  },
  {
    id: "r09-hud-compressed-1280x720",
    round: 9,
    width: 1280,
    height: 720,
    symptom: "the HUD's chips overlapped the combo label as soon as the combo reached two digits",
    guard: "the reference window plans an uncompressed HUD",
  },
  {
    id: "r10-chip-row-1920x820",
    round: 10,
    width: 1920,
    height: 820,
    symptom: "«MUỐI DƯA CỔ ĐIỂN» lost the right side of the chip: border, padding and the end of the name",
    guard: "the chip is drawn in full at the window from the report",
  },
  {
    id: "r10-chip-phone-320x480",
    round: 10,
    width: 320,
    height: 480,
    symptom: "the same chip bug on the narrowest supported phone, where the band is only 288px",
    guard: "the name survives without an ellipsis even here",
  },
  {
    id: "r11-diacritics-390x844",
    round: 11,
    width: 390,
    height: 844,
    symptom: "the circumflex vanished from «CỔ ĐIỂN» — a `truncate` clip box shaved the mark off the top of the glyph",
    guard: "the chip plans a full line box for a name with two stacked marks",
  },
  {
    id: "r11-diacritics-phone-360x640",
    round: 11,
    width: 360,
    height: 640,
    symptom: "the same missing mark on the commonest Android size, where the label is dropped instead",
    guard: "diacritics survive the rung that drops the label",
  },
  {
    id: "r12-audit-floor-320x320",
    round: 12,
    width: 320,
    height: 320,
    symptom: "the tightest window the audit finds: scene 140px, room 0, a crop, and a hero with no mascot",
    guard: "even the floor of the space satisfies every invariant",
  },
  {
    id: "r12-landscape-fold-717x512",
    round: 12,
    width: 717,
    height: 512,
    symptom: "a foldable mid-rotation: wide enough to feel like a tablet, too short for the tablet layout",
    guard: "no arrangement is chosen that the band cannot seat",
  },
  {
    id: "r12-4k-3840x2160",
    round: 12,
    width: 3840,
    height: 2160,
    symptom: "the other end: the clamp stops growing, so a 4K window must not scale past its ceiling",
    guard: "type stays at its cap and the dialog stays inside a 3840px window",
  },
];

/** The regression with this id, if it exists. */
export function regressionFor(id: string): RegressionWindow | undefined {
  return REGRESSIONS.find((r) => r.id === id);
}

/** Every round the corpus covers — used by the docs test to check the release note. */
export function regressionRounds(): number[] {
  return [...new Set(REGRESSIONS.map((r) => r.round))].sort((a, b) => a - b);
}
