/**
 * The prose-count sweep, run *inside* the suite.
 *
 * THE FAILURE THIS FILE EXISTS FOR
 * --------------------------------
 * `assets/adaptive-stability.svg` landed, the ten READMEs were brought to "27
 * SVGs" by hand, and four other files — `scripts/README.md`, `tests/README.md`,
 * `docs/README.md`, `CONTRIBUTING.md` — kept saying 26. Nothing caught it until
 * CI ran:
 *
 *     Run node scripts/sync-prose-counts.mjs --verify
 *     scripts/README.md: prose count is stale
 *     ...
 *     4 problem(s). Expected 1458 tests / 139 files.
 *
 * The gate existed the whole time. It was simply in a job that nobody runs while
 * writing a README, while `npm run check` (typecheck + vitest + svg + adaptive +
 * audit + build) is the command in every contributor's fingers.
 *
 * WHY THIS DOES NOT SPAWN THE SCRIPT
 * ----------------------------------
 * The script learns the test count by *running the suite*, which from inside the
 * suite is a fork bomb with extra steps. So the rules moved to
 * `scripts/lib/prose-counts.mjs`, and this file imports them: same patterns, same
 * guards, same four extra targets — no re-implementation, because a second copy
 * of a rule is how the numbers drifted apart in the first place.
 *
 * The counts come from what the repo already publishes rather than from a run:
 *
 *     tests, files   the README badge (`sync-test-badge.mjs` writes it from a run)
 *     svgs           `readdirSync("assets")`
 *     keys           the Vietnamese locale table, via `localeTable("vi")`
 *
 * A stale file therefore fails here with a message that names the file and the
 * command that fixes it, in `npm run check`, before CI is ever involved.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { localeTable } from "../src/i18n/i18n";
import { EXTRA_TARGETS, rewrite, staleCounts } from "../scripts/lib/prose-counts.mjs";

const ROOT = resolve(__dirname, "..");

/** The suite size, read from the badge the repo already generates. */
function badgeCounts(): { tests: number; files: number } {
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  const m = readme.match(/badge\/tests-(\d+)%20%C2%B7%20(\d+)%20files/);
  if (!m) throw new Error("README badge is missing or has an unexpected shape");
  return { tests: Number(m[1]), files: Number(m[2]) };
}

const counts = {
  ...badgeCounts(),
  svgs: readdirSync(join(ROOT, "assets")).filter((f) => f.endsWith(".svg")).length,
  keys: Object.keys(localeTable("vi")).length,
};

/** The ten root READMEs plus the four procedure files, in one place. */
const TARGETS = [
  ...readdirSync(ROOT).filter((f) => /^README(\.[a-z]{2})?\.md$/.test(f)),
  ...EXTRA_TARGETS,
];

const bodyOf = (file: string) => readFileSync(join(ROOT, file), "utf8");

describe("prose counts, verified inside the suite", () => {
  it("covers the ten languages and the four files that drifted last time", () => {
    /*
     * A gate is only as wide as its file list. The four extra targets were the
     * ones CI caught, so their presence is asserted rather than assumed: an
     * `EXTRA_TARGETS` entry deleted to silence a failure should fail here.
     */
    expect(TARGETS.filter((f) => /^README\.[a-z]{2}\.md$/.test(f)).length).toBe(9);
    expect(TARGETS.filter((f) => f === "README.md").length).toBe(1);
    expect(TARGETS.length).toBe(14);
    expect(TARGETS).toEqual(expect.arrayContaining(EXTRA_TARGETS));
    expect(EXTRA_TARGETS.length).toBeGreaterThanOrEqual(4);
  });

  it.each(TARGETS)("%s states today's counts", (file) => {
    const { body, changed } = rewrite(bodyOf(file), counts);
    /*
     * When this fails, the fix is one command:
     *     node scripts/sync-prose-counts.mjs
     * and the diff it produces is the number that moved.
     */
    const moved = body
      .split("\n")
      .filter((line, i) => line !== bodyOf(file).split("\n")[i])
      .slice(0, 6)
      .map((line) => `  → ${line.trim().slice(0, 110)}`);
    expect(
      changed,
      `${file} has a stale prose count (expected ${counts.tests} tests / ${counts.files} files / ` +
        `${counts.svgs} SVGs / ${counts.keys} keys). Run: node scripts/sync-prose-counts.mjs\n` +
        moved.join("\n"),
    ).toBe(false);
  });

  it.each(TARGETS)("%s has no leftover half-updated pair", (file) => {
    /* The output check the script runs on itself, run here on the same bytes. */
    expect(staleCounts(bodyOf(file), counts)).toEqual([]);
  });
});
