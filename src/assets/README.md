# `src/assets/`

Binary and font assets that Vite bundles. One subfolder: `fonts/`.

Everything else visual is either a CSS scene (`components/menu/background/`) or
an SVG in the repository-level `assets/` — that folder's SVGs are documentation
illustrations for the ten READMEs and are *not* bundled; nothing under `src/`
imports them.

## Why the split

    src/assets/       bundled with the app
    assets/           referenced by Markdown, never by code

Keeping them apart is what lets `scripts/check-assets.mjs` be strict: it asserts
that every SVG in the top-level `assets/` is referenced by some document, which
would be impossible if the app also imported a few of them for its own use.

## `fonts/`

See `fonts/README.md`. The short version: two families, fourteen `.woff2` files,
subset by script, and one of them (`bungee`) is the only place the wordmark's
glyph shapes are guaranteed — which is why the `CHÉO` diacritic bug could not be
fixed by choosing a different fallback.
