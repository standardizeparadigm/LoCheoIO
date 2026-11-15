/**
 * The one-line summary strips under both corner panels.
 *
 * WHY THIS IS DATA
 * ----------------
 * v1.1.8 removed `justify-around` from the panel body (it spread three INFO
 * rows over a height sized for seven, which the report reads as "phần thông
 * tin tự nhiên bị chia ra"). Removing the spread leaves the leftover height
 * visible, and the report then asks for it to be filled: "phần ở dưới menu
 * vẫn còn hơi trống, thêm cái gì gì đó vào".
 *
 * Both answers live here as plain strings so they can be unit tested without
 * a DOM, and so the two panels stay symmetric:
 *
 *   GAME — a progress line: `achievements · modes`
 *   INFO — a status line:   `version · tier`
 *
 * Everything is derived from values the caller already has (no hardcoded
 * version, no hardcoded counts) so the strip can never contradict the panel
 * it sits under.
 */

/** A `label: value` pair rendered as two spaced halves of the strip. */
export interface PanelStat {
  label: string;
  value: string;
}

/**
 * GAME footer: how much of the catalogue the player has seen.
 *
 * `unlocked` is clamped to `[0, total]` — a corrupt localStorage record used
 * to be able to print "18/16", and a footer is a terrible place to discover
 * that the save file is lying.
 */
export function progressStat(unlocked: number, total: number, modeCount: number): PanelStat[] {
  /*
   * `Math.max(0, Math.trunc(x))` is the shape this file used, and it is the
   * exact shape `docs/guides/numeric-guards.md` warns about: `Math.trunc(NaN)`
   * is NaN, `Math.max(0, NaN)` is NaN, and the strip prints `✓NaN/NaN`.
   * `Infinity` survives too — `Math.trunc(Infinity)` is Infinity, so the
   * footer can read `✓5/Infinity`.
   *
   * Both are reachable from a corrupt save: the achievements count comes from
   * localStorage, and `max` of an empty list is `-Infinity` before the clamp.
   *
   * A footer is the worst possible place to learn the save file is lying, so
   * the fallback is the *caller's* total rather than zero: a missing unlocked
   * count should read "0/16", not "0/0".
   */
  const safeTotal = whole(total);
  const safeUnlocked = Math.min(safeTotal, whole(unlocked));
  return [
    { label: "✓", value: `${safeUnlocked}/${safeTotal}` },
    { label: "◆", value: String(whole(modeCount)) },
  ];
}

/** Truncate to a non-negative integer; NaN and ±Infinity collapse to 0. */
function whole(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

/**
 * INFO footer: what this build is.
 *
 * The tier comes from the changelog module (`tierFor`), so it is the same
 * `PATCH` chip the changelog panel shows — one source, two surfaces.
 */
export function buildStat(version: string, tier: string): PanelStat[] {
  /*
   * `tier` is typed `string`, but it arrives through `tierFor()`, whose return
   * type narrows only if every call site is typed — and one of them reads a
   * changelog entry field. An undefined tier used to throw here, inside the
   * INFO panel's footer, which takes the whole panel down with it: a crash in
   * the corner of the screen rather than a missing glyph.
   */
  return [
    { label: "v", value: version || "—" },
    { label: "◆", value: String(tier || "—").toUpperCase() },
  ];
}

/** Join a stat pair the way the strip renders it — used by the tests. */
export function statText(stats: readonly PanelStat[]): string {
  return stats.map((s) => `${s.label}${s.value}`).join(" · ");
}
