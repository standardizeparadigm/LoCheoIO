# `src/i18n/locales/`

Seven UI locales, one file each. `vi.ts` is the source: it defines the key set,
and the other six must match it exactly.

| File | Language | Notes |
| --- | --- | --- |
| `vi.ts` | Tiếng Việt | **the reference** — every key is defined here first |
| `en.ts` | English | |
| `zh.ts` | 中文 | |
| `ja.ts` | 日本語 | |
| `ko.ts` | 한국어 | |
| `es.ts` | Español | |
| `fr.ts` | Français | |

327 keys. Read by `src/i18n/i18n.ts`, checked by `scripts/check-i18n.mjs` and
`tests/i18n.test.ts`.

## The parity rule

A locale must have **exactly** the key set of `vi.ts` — no missing keys, no
extra ones. A missing key renders as the key itself (`menu.play` on screen); an
extra key is dead weight that makes the next parity check ambiguous.

Two checks enforce it, on purpose:

    npm run check:i18n        40ms, reads the files as text, no build
    npx vitest run tests/i18n  full TS import, checks the runtime table

The first runs in CI on every push and the second in the suite. They are not
redundant: the fast one catches a forgotten key in a diff, the slow one catches
a key that exists in both files but is empty or has the wrong placeholder.

## Placeholders are part of the contract

`{n}`, `{jars}`, `{score}` — a translation must use **the same set** as the
Vietnamese string, in any order. `check-i18n.mjs` compares the sets; a
translation that drops `{jars}` renders "3 hũ" as "3" and the plural is gone.

Extra placeholders are rejected too: a translator who invents `{count}` gets an
error rather than a literal `{count}` in the UI, because `interpolate()` leaves
unknown placeholders alone and the string would render with braces visible.

## Why `vi.ts` is first and not `en.ts`

The project's source language is Vietnamese — the wordmark, the jar pun, and the
names of the nine modes are all Vietnamese-first, and translating *from*
Vietnamese keeps the tone. `en.ts` is a full translation, not a source.

## Adding a key

1. Add it to `vi.ts` with a comment if the context is not obvious.
2. Add the same key to the other six, same placeholders.
3. `npm run check:i18n` must print "All 7 locales in parity."

That is the whole procedure, and step 2 is the one that gets skipped — which is
why the check is a gate and not a suggestion.
