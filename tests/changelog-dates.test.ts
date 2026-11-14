import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { CHANGELOG_ENTRIES } from "../src/game/changelog";

/*
 * The release dates have drifted twice.
 *
 * Round 1 shipped every release doc saying `2026-11-13` because the date was
 * copied down the table, and `1.1.6` said `2026-11-13` — a date two days in the
 * future relative to 1.1.8, which makes the whole history read as fiction.
 * The CHANGELOG anchors drifted with them, so `v1.1.6.md` linked to a heading
 * that did not exist.
 *
 * Three sources have to agree, and this file is the check:
 *
 *   1. the data the game renders  (`entries/*.ts`)
 *   2. the long-form doc          (`docs/releases/vX.Y.Z.md`)
 *   3. the short changelog        (`CHANGELOG.md`)
 *
 * Anything else — a README row, a badge — quotes one of these.
 */

/** Every version the changelog data knows about, oldest first. */
function versions(): string[] {
  return CHANGELOG_ENTRIES.map((e) => e.version).slice().reverse();
}

function dateFor(version: string): string {
  const entry = CHANGELOG_ENTRIES.find((e) => e.version === version);
  if (!entry) throw new Error(`no changelog entry for ${version}`);
  return entry.date;
}

describe("release dates", () => {
  it("are in strict ascending order", () => {
    const dates = versions().map(dateFor);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] > dates[i - 1], `${versions()[i]} is not after ${versions()[i - 1]}`).toBe(true);
    }
  });

  it("advance by a plausible gap, not by zero and not by a month", () => {
    /*
     * The series is uneven on purpose: 3 days for a feature, 1 for a hotfix,
     * 2 for a cleanup. The check is only that no gap is impossible — zero,
     * negative, or long enough to be a different project. A future round that
     * forgets to update one date shows up here as one of those.
     */
    const dates = versions().map((v) => new Date(`${dateFor(v)}T00:00:00Z`).getTime());
    for (let i = 1; i < dates.length; i++) {
      const days = (dates[i] - dates[i - 1]) / 86_400_000;
      expect(days, `${versions()[i]} is ${days} days after ${versions()[i - 1]}`).toBeGreaterThan(0);
      expect(days, `${versions()[i]} is ${days} days after ${versions()[i - 1]}`).toBeLessThanOrEqual(14);
    }
  });

  it("never dates a release in the future", () => {
    // 1.1.8 is this patch, so nothing may be later than it.
    const latest = dateFor("1.1.8");
    for (const v of versions()) {
      expect(dateFor(v) <= latest, `${v} is dated after 1.1.8`).toBe(true);
    }
  });

  it("matches the long-form release doc for every version that has one", () => {
    const docs = readdirSync("docs/releases")
      .filter((f) => /^v\d+\.\d+\.\d+\.md$/.test(f))
      .map((f) => f.replace(/^v|\.md$/g, ""));
    expect(docs.length).toBeGreaterThanOrEqual(10);
    for (const version of docs) {
      const body = readFileSync(`docs/releases/v${version}.md`, "utf8");
      const stated = body.match(/\| \*\*Ngày phát hành\*\* \| (20\d\d-\d\d-\d\d) \|/);
      expect(stated, `v${version}.md has no release date row`).not.toBeNull();
      expect(stated![1], `v${version}.md disagrees with the data`).toBe(dateFor(version));
    }
  });

  it("matches the CHANGELOG.md heading for every version", () => {
    const changelog = readFileSync("CHANGELOG.md", "utf8");
    for (const version of versions()) {
      const heading = changelog.match(new RegExp(`## \\[${version.replace(/\./g, "\\.")}\\] — (\\d{4}-\\d{2}-\\d{2})`));
      expect(heading, `CHANGELOG.md has no heading for ${version}`).not.toBeNull();
      expect(heading![1], `CHANGELOG.md disagrees on ${version}`).toBe(dateFor(version));
    }
  });

  it("keeps every release doc's CHANGELOG anchor pointing at its own heading", () => {
    // The anchor is `#<version-without-dots>--<date>`, so a stale date there
    // links to a section that does not exist.
    const changelog = readFileSync("CHANGELOG.md", "utf8");
    for (const version of versions()) {
      const slug = version.replace(/\./g, "");
      let body: string;
      try {
        body = readFileSync(`docs/releases/v${version}.md`, "utf8");
      } catch {
        continue; // no doc for this version
      }
      const anchor = body.match(new RegExp(`CHANGELOG\\.md#${slug}--(\\d{4}-\\d{2}-\\d{2})`));
      if (!anchor) continue; // doc does not link to the changelog
      expect(anchor[1], `v${version}.md links to a stale anchor`).toBe(dateFor(version));
      expect(changelog, `no heading matches #${slug}--${anchor[1]}`).toContain(
        `## [${version}] — ${anchor[1]}`,
      );
    }
  });
});
