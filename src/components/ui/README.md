# `src/components/ui/`

Primitives. Every file here is **game-agnostic** — nothing in this folder
imports from `src/game/`, and nothing imports `useI18n` except `modal.tsx`
(which needs the close button's label). That constraint is what makes them
reusable and what keeps this folder from growing into a second `menu/`.

| File | Lines | What it guarantees |
| --- | --- | --- |
| `button.tsx` | 44 | the three press states and the `hard-shadow` that makes them read |
| `panel.tsx` | 37 | `relative` + four corner ticks; callers pass `panelRef` for the trap |
| `modal.tsx` | 85 | dialog semantics, Escape, the hotkey swallow, the focus trap |
| `switch.tsx` | 52 | `role="switch"` with the full keyboard contract |
| `jar.tsx` | 66 | the mascot jar as SVG, sized by prop, no state |
| `scoreboard.tsx` | 74 | a sorted table with one highlighted row |
| `keycap.tsx` | 22 | `<kbd>` styling used by every shortcut surface |
| `stat.tsx` | 31 | a label/value pair; **not** the panel footer (`menu/panel/stat.ts`) |
| `index.ts` | — | the barrel: the eight primitives and their prop types |

## `modal.tsx` is the only file with behaviour worth explaining

It does five things and every one of them was a bug at some point:

1. **`role="dialog"` + `aria-modal` + `aria-label`** — a div with a backdrop is
   not a dialog to a screen reader, and `aria-label` is the only thing that gives
   it a name, because the title is an `<h2>` inside a scroll box.
2. **Escape closes** — and stops propagation, or the game's own Escape handler
   (which pauses) would fire on the same press.
3. **A backdrop button**, not a click handler on the container. It is a real
   `<button aria-label>` so it is reachable by keyboard and announced; a div with
   `onClick` is neither.
4. **The hotkey swallow.** `Enter`, `Space`, `P`, `R`, `M` are stopped at the
   *capture* phase so the canvas never sees them. They are **not**
   `preventDefault`ed, because that is what would break native button activation
   — the difference matters and is stated in the code comment.
5. **`useFocusTrap(panelRef, true)`.** See `src/utils/useFocusTrap.ts` and
   round 6's fix: an empty container must not `preventDefault` Tab.

## Why `stat.tsx` and `menu/panel/stat.ts` are different files

Same word, different jobs, and confusing them is how the INFO panel ended up
with `mt-auto` twice.

    ui/stat.tsx            a presentational label/value pair
    menu/panel/stat.ts     the arithmetic that decides the values

The arithmetic is in the menu folder because it knows about achievements and
modes; the presentation is here because it knows about nothing. `ui/stat.tsx`
has no tests (it is a `<span>`); `menu/panel/stat.ts` has thirteen, because it
is where `✓NaN/NaN` came from.
