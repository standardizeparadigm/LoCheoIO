# `src/i18n/`

Seven languages, one flat key table, and the hooks that read it.

| File | Owns |
| --- | --- |
| `i18n.ts` | The table itself, `t()`, language detection, persistence |
| `useI18n.ts` | The React binding — re-renders the tree when the language changes |
| `languageMeta.ts` | Display name, native name and flag glyph per language |
| `locales/*.ts` | One file per language: `vi`, `en`, `zh`, `ja`, `ko`, `es`, `fr` |

## The parity rule

Every locale must define exactly the same key set. `tests/i18n.test.ts` asserts
this, and it is the reason `t()` can take a `MessageKey` type instead of a
string: a missing translation is a **type error**, not a runtime fallback to the
key name.

When adding a key:

1. Add it to `vi.ts` first — Vietnamese is the source of truth.
2. Add it to the other six in the same commit, or the test fails.
3. Run `npm run check:i18n`. It prints the exact key that is missing from which
   file, which is faster than reading the assertion diff.

## Why the locale files are not imported anywhere else

Only `i18n.ts` may import from `locales/`. A component that reaches into
`locales/vi` directly bypasses the parity check and ships a screen that works in
one language. `src/i18n/index.ts` deliberately does not re-export the locale
modules for the same reason, and `tests/barrels.test.ts` asserts it.

## Adding a language

Four places: the `Language` union in `i18n.ts`, `SUPPORTED_LANGUAGES` in
`game/settings.ts`, a new file in `locales/`, and `LANGUAGE_META`. The settings
schema and the storage migration both key off `SUPPORTED_LANGUAGES`, so skipping
that step produces a language picker that resets on reload.
