/* =====================================================================
   Lọ Chéo — clipboard helper (v1.1.6)

   `navigator.clipboard` is missing on plain-HTTP origins, in older Safari,
   and inside some embedded webviews. The settings backup button used to
   `await navigator.clipboard?.writeText(...)` and then *claim* success even
   when nothing was copied (`await undefined` resolves happily) — players got
   a "Copied to clipboard" toast with an empty clipboard. This helper reports
   the truth and never throws.
   ===================================================================== */

/**
 * Copy text to the clipboard. Resolves `true` only when it really happened.
 *
 * TWO PATHS, AND THE ORDER MATTERS
 * --------------------------------
 * `navigator.clipboard` is missing on plain-HTTP origins, in older Safari, and
 * inside some embedded webviews — and present-but-rejected when the page is not
 * focused or the permission was denied. So it is tried first and, on any
 * failure, the deprecated `document.execCommand("copy")` path is tried before
 * the call gives up.
 *
 * The fallback is not decoration: this app is played from a file
 * (`dist/index.html`) as often as from a server, and `file://` is not a secure
 * context in every browser. With only the modern API, "Sao chép" on the backup
 * section silently does nothing there.
 *
 * `src/utils/README.md` advertised this fallback before it existed — the
 * documentation was written from the intent, and the code only ever had the
 * first branch. It is here now, and `tests/clipboard.test.ts` covers it.
 */
export async function copyText(text: string): Promise<boolean> {
  const clip =
    typeof navigator !== "undefined" && typeof navigator.clipboard !== "undefined"
      ? navigator.clipboard
      : undefined;

  if (clip && typeof clip.writeText === "function") {
    try {
      await clip.writeText(text);
      return true;
    } catch {
      /* fall through — permission denied, insecure context, not focused */
    }
  }

  return legacyCopy(text);
}

/**
 * `document.execCommand("copy")` against a hidden, off-screen textarea.
 *
 * Deprecated, still the only thing that works in the contexts above, and it has
 * three requirements that are easy to miss:
 *
 *   1. the textarea must be **in the document** — a detached node cannot be
 *      selected, and `select()` on it is a no-op;
 *   2. it must be focusable and selected — `select()` alone leaves the caret
 *      where it was in some browsers;
 *   3. the original selection must be restored, or copying from the backup
 *      field loses the user's place in the string they were editing.
 *
 * `readOnly` keeps the mobile keyboard from opening for a field the user never
 * sees.
 */
function legacyCopy(text: string): boolean {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    return false;
  }

  const active = document.activeElement as HTMLElement | null;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  // Off-screen rather than `display: none` — a hidden element is not selectable.
  area.style.position = "fixed";
  area.style.top = "-9999px";
  area.style.opacity = "0";

  let copied = false;
  try {
    document.body.appendChild(area);
    area.focus({ preventScroll: true });
    area.select();
    area.setSelectionRange(0, text.length);
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    area.remove();
    active?.focus?.({ preventScroll: true });
  }

  return copied;
}
