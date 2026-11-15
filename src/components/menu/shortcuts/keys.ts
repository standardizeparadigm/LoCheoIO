/**
 * The keyboard and pointer bindings, as data.
 *
 * WHY THIS IS DATA
 * ----------------
 * The bindings were only ever written down in two places: the `switch` in
 * `GameCanvas.tsx` and a four-key row inside the how-to modal. Neither is
 * discoverable from the menu, and neither is a complete list — `Space` (slam)
 * and `Escape` (pause) were documented nowhere at all.
 *
 * This module is the single list. `GameCanvas` still owns the *handling*; what
 * it does not own is the answer to "what can I press?", which is a question the
 * menu should be able to answer without opening the game.
 *
 * `tests/shortcuts.test.ts` asserts that every binding listed here that names a
 * `key`, actually appears in the game's key handler — so the panel cannot
 * advertise a key that does nothing (the round-1 «hoặc nhấn ENTER» bug).
 */

/** How a binding is presented in the panel. */
export type BindingKind = "key" | "pointer";

/** One row of the shortcut list. */
export interface KeyBinding {
  /** The keys as printed, one cap per entry. */
  caps: readonly string[];
  /** i18n key for what it does. */
  action: string;
  /** Keyboard, or a pointer gesture. */
  kind: BindingKind;
}

/**
 * The bindings the game actually listens for.
 *
 * Order is by how often a new player needs them: steer, strike, mute, pause.
 * A list sorted alphabetically would put `Escape` first, which is the one thing
 * nobody opens the panel to find.
 *
 * THERE IS NO BOOST KEY. A first draft listed `SHIFT` for it because "boost"
 * is a real mechanic (speed builds as you weave) and it *felt* like there should
 * be a key for it. There is not: `grep -n shiftKey src/components/GameCanvas.tsx`
 * returns nothing. That is exactly the class of mistake the removed «hoặc nhấn
 * ENTER» hint made in round 1 — advertising a control that was never wired up —
 * and it is why `tests/shortcuts.test.ts` checks every cap against the game's
 * own key handler instead of trusting this comment.
 */
export function keyBindings(): readonly KeyBinding[] {
  return [
    { caps: ["W", "A", "S", "D"], action: "shortcuts.move", kind: "key" },
    { caps: ["←", "↑", "↓", "→"], action: "shortcuts.move", kind: "key" },
    { caps: ["SPACE"], action: "shortcuts.slam", kind: "key" },
    /*
     * P and ESC are the same action, and both are real: `GameCanvas` switches
     * on `KeyP` and `Escape` in one case-block. A first draft listed only ESC,
     * which made the panel wrong about a key the README has documented since
     * 1.1.0 — the panel must not be *less* complete than the docs.
     */
    { caps: ["P", "ESC"], action: "shortcuts.pause", kind: "key" },
    /*
     * R restarts from any state, including mid-run. It was missing from the
     * first draft of this list, and the README's control table already had it.
     * That is the failure mode this whole module exists to prevent, caught by
     * comparing the list against `GameCanvas` rather than against memory.
     */
    { caps: ["R"], action: "shortcuts.restart", kind: "key" },
    { caps: ["ENTER"], action: "shortcuts.start", kind: "key" },
    { caps: ["M"], action: "shortcuts.mute", kind: "key" },
    { caps: ["TAP", "DRAG"], action: "shortcuts.touch", kind: "pointer" },
  ];
}

/**
 * The key codes behind the printed caps.
 *
 * A cap is what a player reads (`W`, `←`, `SPACE`); a code is what the DOM puts
 * in `KeyboardEvent.code` (`KeyW`, `ArrowLeft`, `Space`). They are different
 * vocabularies and the mapping between them is a fact about this game, not
 * about the test — which is why it lives here.
 *
 * The first version of `unknownCaps()` compared the two vocabularies directly
 * and reported every single binding as "does nothing". The test caught it,
 * which is the whole reason the check exists in the module and not inline in
 * the panel.
 */
const CAP_TO_CODE: Readonly<Record<string, string>> = {
  "←": "ArrowLeft",
  "↑": "ArrowUp",
  "↓": "ArrowDown",
  "→": "ArrowRight",
  SPACE: "Space",
  ESC: "Escape",
  ENTER: "Enter",
};

/** The `KeyboardEvent.code` a printed cap stands for. */
export function capToCode(cap: string): string {
  if (CAP_TO_CODE[cap]) return CAP_TO_CODE[cap];
  if (/^[A-Z]$/.test(cap)) return `Key${cap}`;
  return cap;
}

/**
 * Caps the game does not listen for.
 *
 * `known` is the list of `KeyboardEvent.code` values the game switches on;
 * `GameCanvas.tsx` is the source. A pointer binding is never checked — it has
 * no key code.
 */
export function unknownCaps(bindings: readonly KeyBinding[], known: readonly string[]): string[] {
  const pool = new Set(known);
  return bindings
    .filter((b) => b.kind === "key")
    .flatMap((b) => b.caps)
    .filter((cap) => !pool.has(capToCode(cap)));
}
