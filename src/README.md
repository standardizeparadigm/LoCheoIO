# `src/` — map of the source tree

Seven top-level entries. The three files at the root are the entry points; the
four folders are layers, and the arrows between them only point one way.

```
main.tsx        mounts <App/>; nothing else
App.tsx         screen switch: start → playing → paused → over
version.ts      APP_VERSION and APP_NAME — the single source of truth
index.css       the design system: tokens, the CSS scene, all @keyframes

components/     React. The only place that may import React.
game/           rules, storage, progression. No React — enforced by tests.
i18n/           seven locales and the lookup that never throws
styles/         the split-out stylesheets the token file imports
utils/          dependency-free helpers any layer may use
assets/         bundled fonts
```

## The import rule

```
components  →  game, i18n, utils        (may import down)
game        →  utils only                (never components)
i18n        →  nothing
utils       →  nothing
```

`game` never imports a component, and `tests/barrels.test.ts` asserts it: a
React import anywhere under `game/` fails the suite. The direction is not
decorative — it is what makes `game/` testable in a Node process with no DOM,
which is how a 680-test suite runs in 14 seconds.

## Where the version lives

`version.ts` exports `APP_VERSION = "1.1.8"` and it is the **only** place the
string appears in code. The ten READMEs, the release doc and the SVG badges are
checked against it by `scripts/check-readme-sync.mjs`, which reads the
TypeScript file rather than a duplicate constant.

That check exists because v1.1.7 shipped with a version baked into the sync
script — so bumping `version.ts` left the badge saying the old number, and the
gate passed.

## Where the CSS lives

`index.css` is imported once by `main.tsx` and is large by design: design tokens,
the layered menu scene, every `@keyframes` the app uses, and the `data-*`
selectors that scope panel behaviour. `styles/` holds what has been split out of
it (currently the wordmark), and the split happened when the file crossed 1200
lines — the threshold is "large enough that a diff is hard to review", not a
target.

Rule-of-thumb for adding: a rule that a component's behaviour depends on (a
`data-` selector, a layout constraint) belongs in `index.css` next to its
siblings, not inline. A one-off utility belongs in the JSX. The round-6 bugs
included one from each side.
