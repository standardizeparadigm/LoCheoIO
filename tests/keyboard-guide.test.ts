/**
 * `docs/guides/keyboard-shortcuts.md` and the code must agree.
 *
 * The key table is the one document where a wrong row directly costs a player
 * something: they press a key, nothing happens, and they conclude the game is
 * broken. v1.1.7 shipped exactly that — «hoặc nhấn ENTER» under the start
 * tagline, with `Enter` handled only on the game-over screen.
 *
 * These cases check the three claims in the table that are easy to get wrong:
 * which contexts each key works in, that no modifier is listed, and that the
 * two-choice controls the arrow keys move are the two that exist.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const guide = readFileSync("docs/guides/keyboard-shortcuts.md", "utf8");
const canvas = readFileSync("src/components/GameCanvas.tsx", "utf8");
const app = readFileSync("src/App.tsx", "utf8");
const settings = readFileSync("src/game/settings.ts", "utf8");

describe("every key the guide lists is handled", () => {
  it("handles all six codes", () => {
    for (const code of ["Space", "KeyP", "Escape", "KeyR", "Enter", "KeyM"]) {
      expect(canvas, `GameCanvas does not handle ${code}`).toContain(`case "${code}"`);
    }
  });

  it("moves with both WASD and arrows", () => {
    // The guide lists ten movement keys; the input state has four axes.
    for (const k of ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"]) {
      expect(canvas, `${k} is not bound`).toContain(k);
    }
  });

  it("advertises no modifier combination as a game binding", () => {
    /*
     * `Shift`+`Tab` *is* in the guide and is legitimate: it is the browser's own
     * reverse-tab, and the focus trap has to handle it. A first version of this
     * test banned the string outright and failed on that row.
     *
     * The claim is narrower — **no game action requires a modifier**. No
     * handler reads `shiftKey`, `ctrlKey` or `metaKey`, so any line presenting
     * one as a way to play would be the v1.1.7 «hoặc nhấn ENTER» mistake again.
     */
    expect(canvas).not.toContain("shiftKey");
    expect(canvas).not.toContain("ctrlKey");
    expect(canvas).not.toContain("metaKey");
    // `Shift`+`Tab` may appear, but only on the Tab row.
    for (const line of guide.split("\n")) {
      if (!/`Shift`\s*\+/.test(line)) continue;
      expect(line, "a modifier binding outside the Tab row").toContain("Tab");
    }
  });
});

describe("the contexts in the table are the real ones", () => {
  it("R works from Pause, not only Game over", () => {
    /*
     * The table said "Game over" and the guard says otherwise:
     * `if (!g || g.phase === "menu") return;` — everything except menu.
     */
    const guard = app.slice(app.indexOf("const onRestartKey"));
    const earlyReturn = guard.slice(0, guard.indexOf("startRun()"));
    expect(earlyReturn).toContain('phase === "menu"');
    expect(earlyReturn).not.toContain('"gameover"');
    expect(guide).toMatch(/Game over, Pause/);
  });

  it("Enter works from the start screen because App renders the canvas always", () => {
    // The trap: `GameCanvas` reads like a game-only component, but App renders
    // it in every phase and `onStartKey` accepts "menu".
    expect(app).toContain("<GameCanvas");
    const start = app.slice(app.indexOf("const onStartKey"));
    expect(start.slice(0, 300)).toContain('phase === "menu"');
    expect(guide).toContain("Enter` ở menu có tác dụng thật");
  });

  it("the arrow keys move exactly the two choices the guide names", () => {
    const display = readFileSync("src/components/settings/DisplaySection.tsx", "utf8");
    // Two SegmentedControls: shakeLevel and visualQuality.
    expect(display.match(/<SegmentedControl/g)?.length).toBe(2);
    expect(settings).toContain("shakeLevel");
    expect(settings).toContain("visualQuality");
    expect(guide).toContain("mức rung");
    expect(guide).toContain("chất lượng hình");
  });
});

describe("the guide explains why it can be trusted", () => {
  it("names the v1.1.7 contradiction", () => {
    // The reason the section exists; losing it loses the argument.
    expect(guide).toContain("hoặc nhấn ENTER");
  });

  it("points at the single source of truth and its test", () => {
    expect(guide).toContain("shortcuts/keys.ts");
    expect(guide).toContain("tests/shortcuts.test.ts");
  });
});
