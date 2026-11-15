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
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

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

/*
 * The gate covered eleven modals and missed the twelfth.
 *
 * `ShortcutsModal` opens from `StartScreen` at `modal === "shortcuts"`, renders
 * 7 191 characters, and was in no gate at all: not in the list below, and not as
 * a child of anything that is. Nothing pointed at the omission because the
 * existing assertions name four screens and check they are present — a rule
 * about a list cannot notice a missing entry.
 *
 * The fix is the inverse assertion: find every `*Modal.tsx` in the tree and
 * require the smoke gate to name it. That rule fails the day someone adds a
 * modal and forgets the gate, which is the case that actually happens.
 */
describe("every modal is in the smoke gate", () => {
  const files = (dir: string, out: string[] = []): string[] => {
    for (const entry of readdirSync(join(__dirname, "..", dir))) {
      const rel = `${dir}/${entry}`;
      const st = statSync(join(__dirname, "..", rel));
      if (st.isDirectory()) files(rel, out);
      else if (entry.endsWith("Modal.tsx")) out.push(entry.replace(/\.tsx$/, ""));
    }
    return out;
  };

  it("names each one", () => {
    const modals = files("src/components");
    // Nine today; a floor so adding a modal is allowed, removing them all is not.
    expect(modals.length).toBeGreaterThanOrEqual(9);
    const missing = modals.filter((m) => !body.includes(m));
    expect(missing, `not in scripts/smoke-ssr.tsx: ${missing.join(", ")}`).toEqual([]);
  });

  it("still reports the count it renders", () => {
    /*
     * Counted from the real output, not from the source. Entries span one line
     * or six, and a regex tight enough to match only the one-line form found 17
     * of 21 — which is exactly the kind of undercount this file exists to catch
     * in other people's work.
     *
     * `npm run smoke` prints one `ok <name> <n> chars` line per piece; that is
     * its only success signal, so it is also the honest thing to count.
     */
    const out = execFileSync("npx", ["vite-node", "scripts/smoke-ssr.tsx"], {
      cwd: join(__dirname, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    /* Only the per-component lines: `ok <name> <chars> chars`. The gate also
       prints inline `ok <assertion>` lines for its DOM checks. */
    const ok = out.split("\n").filter((l) => /^ok .+ \d+ chars$/.test(l));
    /*
     * 17 render pieces today: 13 screens/modals plus the four screens reached
     * by playing, with HowToModal, AchievementsPanel and SettingsModal each
     * rendered twice (touch, fresh, defaults). A floor, not an equality.
     */
    expect(ok.length).toBeGreaterThanOrEqual(17);
    expect(out).toMatch(/SMOKE OK/);
    /* A render that returns nothing is not a render. */
    for (const line of ok) {
      const chars = Number(/ (\d+) chars$/.exec(line)?.[1] ?? 0);
      expect(chars, line).toBeGreaterThan(500);
    }
  }, 120_000);
});
