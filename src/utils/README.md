# `src/utils/`

Small, dependency-free helpers. Nothing here imports from `src/game/` or
`src/components/` — the point of the folder is that any layer can use it without
dragging the next layer in. `tests/barrels.test.ts` enforces the React half of
that rule for `src/game/`; this folder follows it by convention.

| File | What it is |
| --- | --- |
| `math.ts` | `clamp`, `clamp01`, `lerp`, `damp` — the four numeric operations the game repeats |
| `time.ts` | `fmtTime`, `fmtCountdown` — clock formatting for the HUD and the run summary |
| `mediaQuery.ts` | Safe wrappers around `window.matchMedia`, which throws in some webviews |
| `clipboard.ts` | `copyText`: modern API first, `execCommand` fallback second, truth about which succeeded |
| `useFocusTrap.ts` | Keeps Tab inside a modal |
| `cn.ts` | Tailwind class joining, without a dependency |
| `index.ts` | the barrel — the folder's only import surface |

## Why `mediaQuery.ts` exists

`window.matchMedia` is not guaranteed to exist — it is absent in SSR and jsdom,
and it throws outright in a few embedded webviews. Every call site used to wrap
it in its own `try/catch` or sprinkle `?.`, which meant six different fallbacks
with three different behaviours. One module now owns the answer, and
`tests/mediaQuery.test.ts` covers the missing-API path.

## The clipboard fallback that was documented before it existed

`copyText` is worth a paragraph because it is the clearest case in this repo of
documentation running ahead of code.

The table above has said "with the `execCommand` fallback" since the helper was
written. The helper had one branch: `navigator.clipboard` present → write, else
`false`. Nothing failed, because nothing checks a table cell.

The cost only shows up off the happy path: the launcher's first menu item builds
`dist/index.html` and opens it from disk, and `file://` is not a secure context in
every browser — so the copy button in the backup section did nothing in the
single most common way to play this game.

Two lessons, both applied:

1. A claim in a README is a spec. If it describes a fallback, the fallback has to
   exist, and a test has to hold it.
2. The fallback's *order* is the bug-prone part, not its existence: the textarea
   must be attached before it is selected, and `execCommand`'s return value must
   be reported rather than assumed. Both are asserted in
   `tests/clipboard.test.ts`.

## Conventions

- No default exports in this folder. A default export can be renamed at the
  import site, which makes a grep for the helper lie.
- No side effects at module scope. Everything here is a pure function or a hook.
- If a helper needs more than one import from outside this folder, it is
  probably not a util.
