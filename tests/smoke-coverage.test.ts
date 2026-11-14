/**
 * `npm run smoke` is a gate: it renders every screen to static HTML and fails
 * on a render crash. Gates rot in one direction — someone deletes a line
 * because it was failing for an unrelated reason, or a new screen is added and
 * nobody remembers the gate exists.
 *
 * This file does not run the smoke test (that is `npm run smoke`, and it needs
 * vite-node). It checks the *shape* of the file: that the four screens reached
 * by playing are in it, and that the fixture is a real run rather than a row of
 * zeroes. A zeroed stats object takes every `if (!count)` early return and
 * renders a screen no player will ever see.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const SRC = "scripts/smoke-ssr.tsx";
const body = readFileSync(SRC, "utf8");

describe("the smoke gate's coverage", () => {
  it("renders the four screens a player reaches by playing", () => {
    // These were added in one commit; before it, the gate covered menus only.
    for (const screen of ["PauseScreen", "GameOverScreen", "ModeSelector", "AchievementsPanel"]) {
      expect(body, `${screen} is not in the smoke gate`).toContain(screen);
    }
  });

  it("renders the start screen and every menu modal", () => {
    for (const screen of [
      "StartScreen", "GameMenu", "InfoMenu", "ModeSelectModal",
      "SettingsModal", "LeaderboardModal", "AchievementsModal",
      "AboutModal", "ChangelogModal", "QuitModal", "HowToModal",
    ]) {
      expect(body, `${screen} is not in the smoke gate`).toContain(screen);
    }
  });

  it("feeds the in-run screens a realistic stats object, not zeroes", () => {
    /*
     * A stats object of all zeroes renders the "empty" branch of every
     * conditional in PauseScreen and GameOverScreen — which is not the screen.
     * The fixture is asserted by its fields rather than by a magic object,
     * because adding a field to RunStats should not fail this test.
     */
    const fixture = body.match(/const RUN_STATS: RunStats = \{([\s\S]*?)\}/);
    expect(fixture, "RUN_STATS fixture is missing").not.toBeNull();
    for (const field of ["score", "catches", "bestCombo", "level", "jars", "sliced", "time"]) {
      expect(fixture![1], `RUN_STATS has no ${field}`).toContain(field);
    }
    expect(fixture![1], "RUN_STATS score is zero, so no branch is exercised").not.toMatch(
      /score:\s*0\b/,
    );
  });

  it("still prints SMOKE OK, which is the only success signal the gate has", () => {
    expect(body).toContain('"SMOKE OK"');
  });
});
