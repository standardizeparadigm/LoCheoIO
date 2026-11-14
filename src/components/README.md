# `src/components/`

The React layer, split by **who owns the state**, not by what the screen looks
like. That single rule is why `StartScreen.tsx` is 375 lines while
`GameCanvas.tsx` is 344 with the whole loop in it — the menu's complexity lives
in `menu/`, and what is left here is a shell.

| File | Owns | Reads | Writes |
| --- | --- | --- | --- |
| `StartScreen.tsx` | the menu's open/close state | `settings`, catalogue | `onStart(mode)` |
| `GameCanvas.tsx` | the canvas, the RAF loop, the input | `run`, `settings` | the engine |
| `PauseScreen.tsx` | nothing — it is a view | `game.phase` | `onResume` / `onQuit` |
| `GameOverScreen.tsx` | the name field | the finished run | `onSubmit(name, score)` |
| `ModeSelector.tsx` | the highlighted mode | `MODE_LIST`, best scores | `onPick(mode)` |
| `AchievementsPanel.tsx` | nothing — it is a list | `ACHIEVEMENTS`, unlock set | never |

## The one thing that must not move

`GameCanvas.tsx` is the **only** component in this folder that touches
`requestAnimationFrame`, and it is the only one that reads raw keyboard state.
Everything else is driven by props. If a subtree under `menu/` ever needs to
know whether a key is down, the request is wrong: the answer belongs in
`game/input.ts` and the component should receive a boolean.

The reason is testability, and the round-6 bugs are the evidence. Both input
bugs — the seven-field release and the typing guard — lived in this file, and
both were invisible to every React test because there are none. They were
findable only by reading the effect, which is why it is deliberately the
smallest number of effects that can work: three.

## Why the split files are not `screens/`

`screens/PauseScreen.tsx` reads better in isolation, but four of the six files
here are not screens (they are panels rendered *inside* one), and a folder name
that describes three of six residents is worse than none. The split is by
ownership, so the name describes ownership.

## Where the rest is

    menu/        the start screen: layout, chrome, panels, modals, scene
    settings/    the six-section settings modal
    ui/          primitives with no game knowledge: button, panel, modal, switch
    ../game/     the engine, reached through GameCanvas and nothing else
