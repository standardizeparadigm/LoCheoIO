# `src/assets/fonts/`

Two families, fourteen `.woff2` files, self-hosted.

| Family | Weights | Scripts | Used for |
| --- | --- | --- | --- |
| Be Vietnam Pro | 300 · 400 · 600 · 700 · 800 · 900 | latin, vietnamese | body text, names, modes |
| Bungee | 400 | latin, vietnamese | the wordmark and display headers |

## Why self-hosted

The app builds to a **single `dist/index.html`**. A Google Fonts link would be
one network request at load, which is exactly what a single-file build exists to
avoid — and it would fail offline, which is the other half of the same promise.

## Why six weights of one family

`Be Vietnam Pro` is the only Latin family in the set that ships a full
**Vietnamese** subset: `ế`, `ộ`, `ữ`, `ặ` at every weight. A fallback to a Latin
sans would render the wordmark's diacritics in a different family at a
noticeably different weight, and the wordmark is the one element the whole
screen is arranged around.

Six weights is not greed: 300 is the ticker, 400 is body, 600 is menu labels, 700
is the mode names, 800 is the headings, 900 is the score. Removing one means the
browser synthesising it, and synthetic bold on Vietnamese diacritics is visibly
wrong — the accents thicken into the glyph above them.

## Why `bungee-vietnamese-400-normal.woff2` is load-bearing

`CHÉO` is set in Bungee, and the `É` is a precomposed glyph in the Vietnamese
subset. The v1.1.8 diacritic bug — `CHÉO` rendering as `CHEO` — was caused by a
CSS technique (`background-clip: text`), not by this file; but the fix depended
on the accent existing as **part of the glyph's outline** rather than as a
combining mark, because only then does the accent survive every rendering path.

That is why the fix was "stop masking the text", not "pick a safer fallback":
there is no fallback with this shape.

## Subsetting

`latin` and `vietnamese` only. The Chinese, Japanese and Korean UI locales use
the system stack — bundling CJK would add megabytes to a 876 kB single file for
three of seven languages.
