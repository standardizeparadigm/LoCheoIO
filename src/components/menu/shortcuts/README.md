# `src/components/menu/shortcuts/`

The key table: one data file, one barrel, no component. `ShortcutsModal` (one
level up) renders it.

| File | What it is |
| --- | --- |
| `keys.ts` | the rows: keycap label · i18n key for the action |
| `index.ts` | the barrel |

## Every row is bound

This is the rule the folder exists to enforce, and it was written after a
counter-example. An earlier version of the menu advertised **Enter** on the
start screen — "hoặc nhấn ENTER" under the tagline — and no handler existed.
`Enter` started a run only from the game-over screen. The hint promised a key
that did nothing.

So the table only lists keys with a real handler, and there is a test that
checks it against `GameCanvas.tsx` and `StartScreen.tsx`:

    WASD / arrows   move
    Space           slam
    P / Escape      pause
    R               restart
    Enter           start (game over) / begin a run
    M               mute

**No Shift.** It was never bound and it is not listed. Neither is any modifier
combination — the app has none, and a table that lists them costs a player a
minute of pressing keys that do nothing.

## Why the labels are cap-tokens, not sentences

`keys.ts` stores `"P"`, `"Space"`, `"Enter"` as literal keycap text, not as
translatable strings. A keycap is a picture of a key: `Space` does not become
`Espacio` because the keyboard in front of the player does not change with the
UI language. The *action* column is translated; the key column is not.

That is the one place in the app where hardcoded English is correct, and it is
worth stating because every other string goes through `t()` and a reviewer would
otherwise flag it.
