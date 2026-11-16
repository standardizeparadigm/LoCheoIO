# `src/components/menu/adaptive/preferences/` — what the player asked for

Two questions, two answers, one place that computes them:

    motion    "full" | "reduced"     stop the decorative animation
    contrast  "normal" | "more"      lift the copy and the borders

| File | Owns |
| --- | --- |
| `preferences.ts` | `preferencesFor()` · `preferenceVars()` · `preferenceAttributes()` · `describePreferences()` |
| `index.ts` | the barrel — the adaptive barrel re-exports all of it |

## Three sources, two values

`preferencesFor(env, playerReducedMotion)` takes **three** inputs and returns two
names:

| source | example | what it means |
| --- | --- | --- |
| `env.reducedMotion` | `prefers-reduced-motion: reduce` | what the OS says the person needs |
| `playerReducedMotion` | `settings.reducedMotion` | what the player chose in this app |
| `env.moreContrast` | `prefers-contrast: more` | what the OS says about legibility |

The two motion sources are **OR-ed, never AND-ed**. A player who turns the switch
off on a machine whose OS asks for reduced motion still gets reduced motion: the OS
preference is a statement about the person, and an app does not get to overrule it
with a default. The opposite direction — a switch that works on a machine that asks
for nothing — is the whole reason the setting exists.

## The bug this folder exists for

Round 5 made `settings.reducedMotion` reach the canvas: `GameCanvas` put
`data-reduced-motion="true"` on its own element and `index.css` stopped three
animation classes under it. The **menu** never carried the attribute, so:

- turning the switch on left the hero bobbing, the halo rotating and the ticker
  scrolling — the toggle looked broken from the start screen;
- the attribute rule stopped **3** class names while the OS media query stopped
  **27**, so even the canvas' coverage was a fraction of what "reduce motion" means;
- `prefers-contrast: more` was read by `App.tsx` for the document root and by nothing
  in the adaptive tree, so no profile, diagnostic or screenshot could report it.

Round 15 resolves both into the profile, publishes them as two CSS variables and two
`data-*` attributes, and extends the attribute rule to the same list as the media
query. `[data-adaptive-contrast="more"]` raises the corner panels' 3px border and the
panel heads — the two largest surfaces where contrast actually costs legibility.

## Why `prefs-respected` is an invariant

A profile that *states* `motion: "reduced"` while *publishing*
`--adaptive-motion: full` would leave every animation running under an attribute that
says they stopped — a silent disagreement between two fields derived from one call.
`constraints.ts` cross-checks them on all 578 audited windows, and the check can only
fail after a refactor, which is exactly when a contract earns its keep.

## What it does not do

- **No `prefers-color-scheme`.** The palette is the brand; there is no dark/light pair
  to switch between.
- **No forced-colors support.** Windows High Contrast is a different mechanism (it
  replaces colours wholesale, borders included) and it needs a browser to verify.
- **No motion *level*.** Two states, not three: the animations are either running or
  stopped, and a "half speed" tier would need a measurement nobody has.
