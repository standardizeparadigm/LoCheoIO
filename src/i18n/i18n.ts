/* =====================================================================
   Lọ Chéo — i18n runtime.
   - Languages: vi (default), en, zh, ja, ko, es, fr
   - Persisted under storage key `locheo.lang.v1`
   - `t()` reads the module-level active language; call sites can pass
     their own snapshot via `t(key, params, lang)`.
   - React components should subscribe with `useMessages()` (see below)
     so switching language re-renders the tree.
   ===================================================================== */

import vi, { type MessageKey } from "./locales/vi";
import en from "./locales/en";
import zh from "./locales/zh";
import ja from "./locales/ja";
import ko from "./locales/ko";
import es from "./locales/es";
import fr from "./locales/fr";
import { STORAGE_KEYS } from "../game/safeStorage";

export type Language = "vi" | "en" | "zh" | "ja" | "ko" | "es" | "fr";
export const LANGUAGES: Language[] = ["vi", "en", "zh", "ja", "ko", "es", "fr"];

export const LANG_STORAGE_KEY = STORAGE_KEYS.lang;

const messages: Record<Language, Record<MessageKey, string>> = { vi, en, zh, ja, ko, es, fr };

/** Detect the best initial language: stored preference → browser → vi. */
export function detectInitialLanguage(): Language {
  try {
    const raw = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (LANGUAGES.includes(raw as Language)) return raw as Language;
  } catch {
    /* storage unavailable */
  }
  try {
    const nav = (window.navigator?.language || "").toLowerCase();
    if (nav.startsWith("zh")) return "zh";
    if (nav.startsWith("ja")) return "ja";
    if (nav.startsWith("ko")) return "ko";
    if (nav.startsWith("es")) return "es";
    if (nav.startsWith("fr")) return "fr";
    if (nav.startsWith("vi")) return "vi";
    if (nav) return "en"; // any other locale → English
  } catch {
    /* navigator unavailable */
  }
  return "vi";
}

/** Module-level active language — kept in sync by setLanguage(). */
let activeLanguage: Language =
  typeof window !== "undefined" ? detectInitialLanguage() : "vi";

export function getLanguage(): Language {
  return activeLanguage;
}

export const LANGUAGE_CHANGE_EVENT = "locheo:languagechange";

export function setLanguage(lang: Language): void {
  activeLanguage = lang;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* storage unavailable — keep in-memory only */
  }
  try {
    window.dispatchEvent(
      new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: lang }),
    );
  } catch {
    /* non-DOM environment */
  }
}

/** Param values may be string/number; everything is stringified. */
export type Params = Record<string, string | number>;

/**
 * Substitute `{name}` placeholders in one pass.
 *
 * THE BUG THIS FIXES
 * ------------------
 * The previous version looped over the param keys and ran `split().join()` once
 * per key. When the *value* of one param is itself a placeholder for another,
 * object key order decides the result:
 *
 *     interpolate("CẤP {level} · {jars} HŨ", { level: "{jars}", jars: "X" })
 *
 * With `level` first, the template becomes `CẤP {jars} · {jars} HŨ` and the
 * next iteration replaces *both* — turn a param that was meant to be literal
 * text into a substitution. With `jars` first, the output is
 * `CẤP {jars} · X HŨ` and the literal survives. Two call sites passing the
 * same object get different strings, which is undebuggable from a screenshot.
 *
 * A single regular-expression pass over the *template* makes substitution
 * non-recursive by construction: each placeholder is looked up in `params`
 * exactly once, and replacement text is never rescanned.
 *
 * `$` in a value is safe here because the replacer is a function — the
 * `$&` / `$1` expansion only applies to string replacements.
 */
function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (whole, name: string) => {
    const own = Object.prototype.hasOwnProperty;
    return own.call(params, name) ? String(params[name]) : whole;
  });
}

/**
 * Translate a key. Falls back to the vi message when missing (should never
 * happen — key sets are enforced by tests), then to the raw key.
 */
export function t(
  key: MessageKey,
  params?: Params,
  lang: Language = activeLanguage,
): string {
  const table = messages[lang] ?? messages.vi;
  /*
   * Look up with `hasOwnProperty`, not `table[key] ?? fallback`.
   *
   * `messages` is a plain object, so it inherits from `Object.prototype`. A key
   * that is not in the table but *is* a prototype member — `"toString"`,
   * `"valueOf"`, `"constructor"` — reads back as a function, which is neither
   * `undefined` nor a string, so `??` does not catch it. Without params the
   * function escaped into the returned string; with params `interpolate` called
   * `.split` on it and threw a TypeError, i.e. a white screen.
   *
   * `MessageKey` makes this unreachable from typed code, but the key can arrive
   * from outside the type system: a deep link, a query parameter, or a stored
   * value from an older build with a key that has since been renamed.
   */
  const own = Object.prototype.hasOwnProperty;
  if (own.call(table, key)) return interpolate(table[key], params);
  if (own.call(messages.vi, key)) return interpolate(messages.vi[key], params);
  return String(key);
}

/**
 * True when `key` is a real message key in the Vietnamese source table.
 *
 * Was `key in messages.vi`, which reported `"toString"` and `"constructor"` as
 * valid keys for the same prototype-chain reason as `t()` above.
 */
export function hasKey(key: string): key is MessageKey {
  return Object.prototype.hasOwnProperty.call(messages.vi, key);
}

/** Helper to read an entire locale table (used by tests). */
export function localeTable(lang: Language): Record<MessageKey, string> {
  return messages[lang];
}

export type { MessageKey };

/** BCP-47-ish locale used for number grouping per language. */
export function numberLocale(lang: Language = activeLanguage): string {
  switch (lang) {
    case "en":
      return "en-US";
    case "zh":
      return "zh-CN";
    case "ja":
      return "ja-JP";
    case "ko":
      return "ko-KR";
    case "es":
      return "es-ES";
    case "fr":
      return "fr-FR";
    case "vi":
    default:
      return "vi-VN";
  }
}

/**
 * Group a number for the active language (used for score readouts).
 * `toLocaleString` throws on some stripped-down JS engines and renders
 * "NaN" for junk input — both would leak into the HUD and the leaderboard,
 * so the value is normalised first and the Intl call is guarded.
 */
export function fmtNum(n: number, lang: Language = activeLanguage): string {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  try {
    return v.toLocaleString(numberLocale(lang));
  } catch {
    // thousands separators by hand when Intl is unavailable
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}
