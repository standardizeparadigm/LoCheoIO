import type { ReleaseTier } from "./types";

/**
 * SemVer → release tier.
 *
 *   1.0.0 · 2.0.0   → major  (a feature wave; the rarest tier)
 *   1.1.0 · 1.2.0   → minor  (an upgrade; what the UI labels UPDATE)
 *   1.1.1 … 1.1.8   → patch  (fixes/polish; what the UI labels PATCH)
 *
 * The tag on screen is derived here rather than typed into each entry, so a
 * release tag can never contradict the version string printed beside it.
 * Junk input degrades to "patch" instead of throwing — this runs in render.
 */
export function tierFor(version: string): ReleaseTier {
  /*
   * Parse strictly. `Number.parseInt` is not a validator: it reads a numeric
   * prefix and ignores the rest, and it accepts radix-16 and exponent forms.
   * That matters because the three prefixes below all parsed to *zero* and
   * therefore returned **major** — the loudest label in the UI — for input
   * that is not a version at all:
   *
   *     "0x10.0.0"  → 0.0.0  → major
   *     "1e1.0.0"   → 1.0.0  → major
   *     "-0.0.0"    → 0.0.0  → major
   *
   * A junk version reading as MAJOR is the worst possible degradation: the
   * comment above promises junk becomes "patch", and a corrupt entry would
   * have claimed the rarest, most prominent tier.
   *
   * `Number()` is strict about the whole string but still accepts `1e1`, so
   * the shape is checked first: three dot-separated runs of digits, nothing
   * else, no leading sign, no whitespace.
   */
  const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!parts) return "patch";
  const [, major, minor, patch] = parts.map(Number);
  if (!Number.isSafeInteger(major) || !Number.isSafeInteger(minor) || !Number.isSafeInteger(patch)) {
    return "patch";
  }
  if (patch !== 0) return "patch";
  if (minor !== 0) return "minor";
  return "major";
}

/** Display order of the filter chips. */
export const TIER_ORDER: readonly ReleaseTier[] = ["major", "minor", "patch"];

/** i18n key that labels a tier in the UI. */
export const TIER_LABEL_KEY = {
  major: "changelog.tier.major",
  minor: "changelog.tier.minor",
  patch: "changelog.tier.patch",
} as const;
