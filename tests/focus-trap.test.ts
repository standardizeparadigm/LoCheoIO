/**
 * `useFocusTrap` — the modal's keyboard containment.
 *
 * There is no jsdom in this project (see `tests/README.md`): a hook that needs
 * a mounted component cannot be exercised directly. What *can* be checked is
 * the part that has no runtime dependency at all — the selector list, and the
 * shapes of the two decisions that are wrong in a way no screenshot shows:
 *
 *   1. what happens when the container has no focusable child;
 *   2. what happens when the element to restore focus to is gone.
 *
 * Both were bugs. Both are visible here as source structure, because the fix
 * for each is a guard that must not be deleted.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync("src/utils/useFocusTrap.ts", "utf8");
/** Comments explain the guards and name the old code, so strip them first. */
const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the focusable selector", () => {
  const list = code.slice(code.indexOf("const FOCUSABLE"), code.indexOf("].join"));

  it("includes contenteditable, which has no tag name to match", () => {
    expect(list).toContain("contenteditable");
  });

  it("excludes disabled controls from every tag rule", () => {
    for (const tag of ["button", "input", "select", "textarea"]) {
      expect(list).toContain(`${tag}:not([disabled])`);
    }
  });

  it("honours tabindex=-1 as a deliberate opt-out", () => {
    expect(list).toContain("[tabindex]:not([tabindex='-1'])");
  });

  it("requires the href on anchors", () => {
    // A bare `<a>` is not a tab stop; trapping Tab on one would strand focus.
    expect(list).toContain("a[href]");
    expect(list).not.toMatch(/"a",/);
  });
});

describe("an empty container does not hold Tab hostage", () => {
  it("returns without preventDefault when there is nothing to focus", () => {
    /*
     * The old shape was:
     *
     *     if (list.length === 0) { e.preventDefault(); return; }
     *
     * With no focusable child (a scrolled-away control list, a panel whose
     * only button is hidden), that made Tab a no-op — no movement, no
     * feedback, and the dialog never mentions Escape. Native Tab must be
     * allowed through.
     */
    const at = code.indexOf("if (list.length === 0)");
    // The guard is a single statement; take up to the next line break.
    const guard = code.slice(at, code.indexOf("\n", at));
    expect(guard).not.toContain("preventDefault");
    expect(guard).toContain("return");
  });
});

describe("focus restore checks that the target is still usable", () => {
  it("does not call focus() unconditionally on the previous element", () => {
    // The old line was `previous?.focus?.({ preventScroll: true })` — which is
    // a silent no-op on a detached or disabled element.
    expect(code).not.toMatch(/previous\?\.focus\?\.\(/);
  });

  it("requires the target to be connected", () => {
    expect(code).toContain("isConnected");
  });

  it("requires the target not to be disabled", () => {
    // «Chơi tiếp» disables itself when the snapshot is consumed — the exact
    // element that opened the modal, and still connected.
    expect(code).toMatch(/disabled/);
  });
});

describe("the trap is still a trap", () => {
  it("wraps forward from the last element to the first", () => {
    expect(code).toContain("!e.shiftKey");
    expect(code).toContain("firstEl.focus()");
  });

  it("wraps backward from the first element to the last", () => {
    expect(code).toContain("e.shiftKey");
    expect(code).toContain("lastEl.focus()");
  });

  it("removes its listener on unmount", () => {
    expect(code).toContain('removeEventListener("keydown"');
  });

  it("stays inert until activated", () => {
    expect(code).toContain("if (!active) return");
  });
});
