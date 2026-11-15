# `src/components/menu/` — the start screen

The corner panels, the modals they open, the hero, the chrome, and the four
subsystems the layout is derived from. This is the largest folder in the app and
the one with the most rules, because it is the only screen that has to fit at
every window size without scrolling.

## Files

```
CornerPanel.tsx        the panel frame: uppercase title, four orange ticks, declared height
MenuItemButton.tsx     one compact row (icon · label · hint · trailing) — 5 variants
GameMenu.tsx           GAME (bottom-left):  Play · Continue(gated) · Modes · Scores · Achievements · Settings · How to play
InfoMenu.tsx           INFO (bottom-right): About · Changelog · Shortcuts · Quit + challenge + summary
MenuChrome.tsx         the absolute bottom band that carries both panels and the ticker
StartScreen.tsx        (one level up) mounts the hero, the chrome and the modal host
index.ts               the barrel — what `StartScreen` imports, nothing else should
```

### Modals — one per file, all built on `ui/Modal`

```
ModeSelectModal.tsx    the nine modes, reusing ModeSelector
SettingsModal.tsx      six sections (presets · audio · display · language · backup · data)
LeaderboardModal.tsx   top 8, reusing Scoreboard
AchievementsModal.tsx  the sixteen-badge wall, reusing AchievementsPanel
AboutModal.tsx         author card: role · craft · contact · licence · fonts
ChangelogModal.tsx     the timeline, filterable by tier
HowToModal.tsx         the six rules and the goal line
ShortcutsModal.tsx     the key table (P/R/M/Enter/Space — nothing unbound)
QuitModal.tsx          window.close(), best effort, with a Ctrl/Cmd+W hint
```

### Subfolders

```
adaptive/      pure functions that decide the hero's shape from the plan
layout/        metrics, fit (planMenuLayout), useMenuPlan, viewportEvents
panel/         the two panel footers and their arithmetic
scene/         the fourteen hero decorations, as data
ticker/        the marquee: fourteen strings and a pure tone selector
wordmark/      LỌ CHÉO — the sizing ratio and the diacritic box
about/         the about card's content
background/    the layered CSS scene's component half
howto/         the rule list data
shortcuts/     the key table data
icons/         nine stroke-consistent icons, one file each, plus a barrel
```

## Rules that are not negotiable

1. **No scrolling.** `.menu-pane` uses `overflow: clip`. If content does not
   fit, the plan degrades — it does not scroll. `tests/menu-no-scroll.test.ts`
   asserts this at every breakpoint.
2. **Rows go through `MenuItemButton`; icons through `./icons`.** A one-off
   button in a panel gets its own padding, and two rows with different padding
   is how a panel starts lying about its height.
3. **The panel body never carries a `justify-` utility.** Distribution is a CSS
   decision scoped by `data-panel`; a Tailwind class on the element would win by
   declaration order and break the economy table.
4. **No child of a `space-between` body may carry `margin-top: auto`.** It asks
   for the leftover space a second time. Both `.panel-footer` and
   `panel/PanelSummary.tsx` got this wrong once.
5. **Text only through `t()`**, with the key added to all seven locales. A
   hardcoded string is invisible to `check:i18n` and to every reviewer who does
   not read that language.
6. **GAME is play, INFO is the project.** Mixing them is what the v1.1.5
   redesign existed to stop.

## What was here and is not

`deck/` — the three-column band under the hero — was built in round 3 and
deleted in round 6. Three columns of prose cannot live in a fixed-height band:
at 1920×1080 the right column was cut mid-sentence, and at 1920×821 the corner
panels covered it entirely. Its data moved to `game/daily/` and one line in
INFO's `panel/PanelChallenge.tsx`.

`stage/` — the `9 · 14 · 16` counter strip — was removed earlier for repeating
the tagline. `tests/menu-deck` (now `daily-challenge.test.ts`) asserts both stay
gone.
