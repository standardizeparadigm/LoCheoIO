/**
 * In-game changelog — the public surface.
 *
 * Entries live one-per-file under `./entries` so each release reads like a
 * document and each translation is a small, reviewable diff. The order here
 * is the render order: newest first, strictly descending SemVer (enforced by
 * tests/changelog.test.ts and tests/changelog-tiers.test.ts).
 */
import type { ChangelogEntry, ReleaseTier } from "./types";
import { tierFor } from "./tiers";

import { V1_1_8 } from "./entries/v1_1_8";
import { V1_1_7 } from "./entries/v1_1_7";
import { V1_1_6 } from "./entries/v1_1_6";
import { V1_1_5 } from "./entries/v1_1_5";
import { V1_1_4 } from "./entries/v1_1_4";
import { V1_1_3 } from "./entries/v1_1_3";
import { V1_1_2 } from "./entries/v1_1_2";
import { V1_1_1 } from "./entries/v1_1_1";
import { V1_1_0 } from "./entries/v1_1_0";
import { V1_0_0 } from "./entries/v1_0_0";

export type { ChangelogEntry, LegacyKind, ReleaseTier } from "./types";
export { copyFor } from "./types";
export { tierFor, TIER_ORDER, TIER_LABEL_KEY } from "./tiers";

export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  V1_1_8,
  V1_1_7,
  V1_1_6,
  V1_1_5,
  V1_1_4,
  V1_1_3,
  V1_1_2,
  V1_1_1,
  V1_1_0,
  V1_0_0,
];

/** Versions in descending order (as declared). */
export function changelogVersions(): string[] {
  return CHANGELOG_ENTRIES.map((e) => e.version);
}

/** The newest entry — the one the menu hint should advertise. */
export function latestEntry(): ChangelogEntry {
  return CHANGELOG_ENTRIES[0];
}

/** How many releases fall into each tier — drives the filter chips. */
export function tierCounts(): Record<ReleaseTier, number> {
  const counts: Record<ReleaseTier, number> = { major: 0, minor: 0, patch: 0 };
  for (const entry of CHANGELOG_ENTRIES) counts[tierFor(entry.version)] += 1;
  return counts;
}

/** Entries whose SemVer tier equals `tier` (or every entry for `null`). */
export function entriesForTier(tier: ReleaseTier | null): readonly ChangelogEntry[] {
  return tier === null ? CHANGELOG_ENTRIES : CHANGELOG_ENTRIES.filter((e) => tierFor(e.version) === tier);
}

/** Look one release up by exact version string. */
export function entryFor(version: string): ChangelogEntry | undefined {
  return CHANGELOG_ENTRIES.find((e) => e.version === version);
}
