/*
 * `src/i18n/` — the seven-language translation table and the hooks that read it.
 *
 * Barrel added in round 4. The locale files are deliberately *not* re-exported:
 * they are large, and only `i18n.ts` should know which keys exist in which
 * language. Importing `./locales/vi` straight from a component is a bug — it
 * bypasses the parity check that `tests/i18n.test.ts` enforces.
 */

export type { Language } from "./i18n";
export { LANGUAGES, LANG_STORAGE_KEY, detectInitialLanguage, getLanguage, t } from "./i18n";
export { useI18n } from "./useI18n";
export type { LanguageMeta } from "./languageMeta";
export { LANGUAGE_META, LANGUAGE_META_MAP, metaFor } from "./languageMeta";
