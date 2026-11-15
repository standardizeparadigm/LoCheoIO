import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { capToCode, keyBindings, unknownCaps } from "../src/components/menu/shortcuts";
import { localeTable } from "../src/i18n/i18n";

/*
 * A shortcuts panel is a promise: every key it prints must do something.
 *
 * Round 1 shipped a «hoặc nhấn ENTER» hint for a shortcut that was never wired
 * up, and the report caught it. This file is the guard against repeating that,
 * and it has already earned its place: while writing `keys.ts` the first draft
 * listed SHIFT for "boost", which sounds like a real control and is not one —
 * `grep shiftKey src/components/GameCanvas.tsx` returns nothing.
 */

/** Every key code the game's handler actually switches on. */
function handledCodes(): string[] {
  const src = readFileSync("src/components/GameCanvas.tsx", "utf8");
  return [...src.matchAll(/case "([^"]+)":/g)].map((m) => m[1]);
}

describe("the shortcut list", () => {
  it("has a binding for movement, strike, pause and mute", () => {
    const actions = keyBindings().map((b) => b.action);
    for (const required of ["shortcuts.move", "shortcuts.slam", "shortcuts.pause", "shortcuts.mute"]) {
      expect(actions, `${required} missing`).toContain(required);
    }
  });

  it("only prints keys the game actually handles", () => {
    const handled = handledCodes();
    expect(handled.length, "no key codes found in GameCanvas").toBeGreaterThan(4);
    const unknown = unknownCaps(keyBindings(), handled);
    expect(unknown, `these caps do nothing: ${unknown.join(", ")}`).toEqual([]);
  });

  it("maps every printed cap back to a handled code", () => {
    // A second route to the same claim: catches a cap that unknownCaps()
    // would pass only because the raw string happened to match.
    const handled = new Set(handledCodes());
    const printed = keyBindings()
      .filter((b) => b.kind === "key")
      .flatMap((b) => b.caps);
    for (const cap of printed) {
      expect(handled.has(capToCode(cap)), `${cap} -> ${capToCode(cap)} is not handled`).toBe(true);
    }
  });

  it("does not advertise a boost key", () => {
    // SHIFT was invented once. It must not come back without a handler.
    const caps = keyBindings().flatMap((b) => b.caps);
    expect(caps).not.toContain("SHIFT");
  });

  it("mentions the pointer controls exactly once", () => {
    const pointer = keyBindings().filter((b) => b.kind === "pointer");
    expect(pointer).toHaveLength(1);
    expect(pointer[0].action).toBe("shortcuts.touch");
  });

  it("has a translated action for every binding, in every locale", () => {
    const tables = ["vi", "en", "zh", "ja", "ko", "es", "fr"].map((l) =>
      localeTable(l as never),
    );
    for (const table of tables) {
      for (const binding of keyBindings()) {
        expect(table[binding.action as never], `${binding.action} untranslated`).toBeTruthy();
      }
    }
  });

  it("keeps the modal out of the how-to panel", () => {
    // The how-to modal explains the rules; this one explains the controls.
    // They must not merge back into one screen.
    const howto = readFileSync("src/components/menu/HowToModal.tsx", "utf8");
    expect(howto).not.toContain("keyBindings");
  });
});

describe("the list is complete, not just correct", () => {
  /*
   * The check above proves nothing is *invented*. This one proves nothing is
   * *missing* — the opposite failure, and the one that actually happened: the
   * first draft left out `P`, `R` and `Enter`, all three of which `GameCanvas`
   * handles and the README's control table has documented since 1.1.0.
   *
   * A panel that is merely correct is not useful. It has to be enough.
   */
  it("covers every action key the game switches on", () => {
    // `Space` and the four arrow codes have no single-letter form, and the
    // movement block is claimed by WASD as well — so map back to the action.
    const ACTION_CODES = [
      "Space", "KeyP", "Escape", "KeyR", "Enter", "KeyM",
    ];
    const printed = new Set(
      keyBindings()
        .filter((b) => b.kind === "key")
        .flatMap((b) => b.caps)
        .map(capToCode),
    );
    for (const code of ACTION_CODES) {
      expect(printed.has(code), `${code} is handled but not shown in the panel`).toBe(true);
    }
  });

  it("names the restart and start actions", () => {
    const actions = keyBindings().map((b) => b.action);
    expect(actions).toContain("shortcuts.restart");
    expect(actions).toContain("shortcuts.start");
  });

  it("groups P and Escape under one pause row", () => {
    // Both keys call the same handler; two rows would be noise.
    const pauseRows = keyBindings().filter((b) => b.action === "shortcuts.pause");
    expect(pauseRows).toHaveLength(1);
    expect(pauseRows[0].caps).toEqual(["P", "ESC"]);
  });
});
