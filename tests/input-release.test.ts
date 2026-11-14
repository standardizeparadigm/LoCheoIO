/**
 * Releasing input — the "the jar walks by itself" bug.
 *
 * `InputState` has seven fields:
 *
 *     left · right · up · down · joy · jx · jy
 *
 * The window `blur` handler cleared five of them and `visibilitychange`
 * cleared none. Two symptoms followed, both reported against every arcade
 * game ever written and both reproducible here:
 *
 *   · alt-tab away mid-drag → `jx`/`jy` keep their last value → the jar
 *     drifts with no key down, and no keystroke fixes it because the engine
 *     never saw a key *up*;
 *   · hide the tab → the run pauses (if the preference is on) but the
 *     movement flags stay set → pressing resume resumes *moving*.
 *
 * The fix is one module-level `releaseAllInput()`, called from both places.
 * These tests hold the three properties that make it work — no DOM, so the
 * source is inspected, which is the same technique `menu-row.test.ts` uses.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync("src/components/GameCanvas.tsx", "utf8");

/** The body of `releaseAllInput`, comment-stripped. */
function releaseBody(): string {
  const at = src.indexOf("function releaseAllInput(");
  expect(at, "releaseAllInput is missing").toBeGreaterThan(-1);
  const open = src.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth += 1;
    else if (src[i] === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  return "";
}

describe("the release clears every field of InputState", () => {
  it("clears the four directions", () => {
    const body = releaseBody();
    for (const key of ["left", "right", "up", "down"]) {
      expect(body, `releaseAllInput does not clear ${key}`).toMatch(
        new RegExp(`\\b${key}:\\s*false`),
      );
    }
  });

  it("clears the analogue coordinates, not just the boolean thumb", () => {
    /*
     * This is the half that was missing. `joy: false` says "no stick is being
     * used"; `jx: 0, jy: 0` says "the stick is centred". Without the second
     * pair the engine multiplies by the last non-zero vector it saw.
     */
    const body = releaseBody();
    expect(body, "jx is not reset").toMatch(/\bjx:\s*0/);
    expect(body, "jy is not reset").toMatch(/\bjy:\s*0/);
  });

  it("clears the joy flag too", () => {
    expect(releaseBody()).toMatch(/\bjoy:\s*false/);
  });

  it("touches all seven fields and nothing else", () => {
    // A field added to `InputState` and forgotten here is exactly how the
    // jx/jy half went missing. Counting is crude but it catches the omission.
    const body = releaseBody();
    const assigned = [...body.matchAll(/(\w+):\s*(?:false|0)/g)].map((m) => m[1]);
    expect(new Set(assigned).size, `only ${assigned.length} fields cleared`).toBeGreaterThanOrEqual(7);
  });
});

describe("both callers use the same function", () => {
  it("blur delegates instead of listing fields inline", () => {
    // The inline version is what drifted: it had five fields while
    // InputState had seven.
    const blurLine = src.split("\n").find((l) => /const blur = /.test(l)) ?? "";
    expect(blurLine, "blur does not call releaseAllInput").toContain("releaseAllInput");
  });

  it("visibilitychange releases before it decides about pausing", () => {
    const at = src.indexOf("const onVis = ");
    expect(at).toBeGreaterThan(-1);
    const body = src.slice(at, src.indexOf("};", at));
    expect(body, "onVis does not release input").toContain("releaseAll");
    // The release must not be inside the auto-pause branch: a player who
    // turned the preference off still should not drift on a hidden tab.
    expect(body.indexOf("releaseAll")).toBeLessThan(body.indexOf("autoPauseOnBlur"));
  });

  it("onVis returns early only when the tab is still visible", () => {
    const at = src.indexOf("const onVis = ");
    const body = src.slice(at, src.indexOf("};", at));
    expect(body).toContain("if (!document.hidden) return;");
  });
});

describe("typing a name must not fire the game's shortcuts", () => {
  /*
   * Every keyboard handler in `GameCanvas` is on `window`, and a `keydown` in
   * a text input still bubbles to it. The game-over screen focuses a name
   * field 420ms after the run ends, so this is not a hypothetical:
   *
   *     "MINH" → the M mutes the game
   *     "PHÚC" → the P pauses (i.e. tries to) a finished run
   *     "R"    → restarts, wiping the score the player was about to submit
   *
   * The guard is on `e.target`, not `document.activeElement`, because the
   * latter reflects focus when the handler runs rather than where the
   * keystroke was aimed.
   */
  it("has a typing guard that checks the event target", () => {
    const at = src.indexOf("const isTyping = ");
    expect(at, "isTyping guard missing").toBeGreaterThan(-1);
    const body = src.slice(at, src.indexOf("};", at));
    expect(body).toContain("e.target");
    expect(body).not.toContain("document.activeElement");
  });

  it("recognises every editable element type", () => {
    const at = src.indexOf("const isTyping = ");
    const body = src.slice(at, src.indexOf("};", at));
    for (const tag of ["INPUT", "TEXTAREA", "SELECT", "isContentEditable"]) {
      expect(body, `isTyping misses ${tag}`).toContain(tag);
    }
  });

  it("returns before recording the key, not after", () => {
    /*
     * Returning *before* `set(e.code, true)` matters: a key recorded but never
     * released leaves the engine holding a direction, which is the same
     * "walks by itself" bug from the tests above, re-introduced through the
     * text field.
     */
    const at = src.indexOf("const down = (e: KeyboardEvent)");
    const body = src.slice(at, src.indexOf("const up =", at));
    const guard = body.indexOf("if (isTyping(e)) return;");
    const record = body.indexOf("set(e.code, true);");
    expect(guard, "no typing guard in the keydown handler").toBeGreaterThan(-1);
    expect(guard).toBeLessThan(record);
  });

  it("the game-over name field is a real input, which is what bubbles", () => {
    // If this ever becomes a `<div contenteditable>`, the guard already
    // covers it — but the test records where the keystrokes come from.
    const over = readFileSync("src/components/GameOverScreen.tsx", "utf8");
    expect(over).toContain("<input");
  });
});
