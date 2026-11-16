/**
 * JarLogo — the mascot jar, drawn inline as SVG.
 *
 * Two moods: `happy` (default) and `hurt` (used by the game-over and quit
 * screens, where the ceramic is cracked). The art is pure markup — no canvas,
 * no image file — so it renders identically in the app, in the SSR smoke test
 * and in a screenshot diff.
 *
 * Split out of `components/ui.tsx` in v1.1.7.
 */
import { useId } from "react";

export function JarLogo({ className = "", mood = "happy" }: { className?: string; mood?: "happy" | "hurt" }) {
  /*
   * ONE JAR IS NOT THE ONLY JAR.
   *
   * The defs below used to carry the literal ids `lc-glaze`, `lc-brine` and
   * `lc-body`. Two jars are on screen at once whenever a modal is open — the
   * hero mascot behind the dialog and the copy inside it — so the document held
   * two `<clipPath id="lc-body">` and two of each gradient. Ids must be unique,
   * and every `url(#lc-body)` resolves to the *first* one in document order.
   *
   * That renders correctly only while both copies are identical, which they
   * were — until the modal's jar is drawn at a different scale or the hurt mood
   * is shown beside the happy one. Then the second jar silently borrows the
   * first one's clip and its brine level jumps.
   *
   * `useId()` makes each instance self-contained. The colons React puts in the
   * id are stripped: they are legal in an id, but not in a CSS `url(#…)`
   * reference without escaping.
   */
  const uid = useId().replace(/:/g, "");
  const glaze = `lc-glaze-${uid}`;
  const brine = `lc-brine-${uid}`;
  const body = `lc-body-${uid}`;
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={glaze} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="55%" stopColor="#f3e3c8" />
          <stop offset="100%" stopColor="#d9c09c" />
        </linearGradient>
        <linearGradient id={brine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b6e07a" />
          <stop offset="100%" stopColor="#5f9c33" />
        </linearGradient>
        <clipPath id={body}>
          <path d="M40 26C16 44 18 100 34 122h52c16-22 18-78-6-96z" />
        </clipPath>
      </defs>
      <ellipse cx="60" cy="128" rx="34" ry="6" fill="#04100f" opacity="0.35" />
      <path d="M40 26C16 44 18 100 34 122h52c16-22 18-78-6-96z" fill={`url(#${glaze})`} stroke="#0b2a28" strokeWidth="5" />
      <g clipPath={`url(#${body})`}>
        <rect x="10" y="62" width="100" height="70" fill={`url(#${brine})`} opacity="0.85" />
        <path d="M10 62q12-7 25 0t25 0 25 0 25 0v8H10z" fill="#d9f2c8" opacity="0.6" />
        <rect x="10" y="92" width="100" height="9" fill="#10403a" opacity="0.85" />
        <circle cx="34" cy="80" r="4" fill="#fdf3e0" opacity="0.8" />
        <circle cx="72" cy="74" r="3.4" fill="#e63b2e" opacity="0.85" />
        <circle cx="86" cy="86" r="3" fill="#fdf3e0" opacity="0.7" />
      </g>
      <g fill="#f5a81c" stroke="#0b2a28" strokeWidth="4">
        <ellipse cx="60" cy="24" rx="22" ry="7" />
      </g>
      <ellipse cx="60" cy="24" rx="14" ry="4" fill="#0b2a28" opacity="0.55" />
      {mood === "happy" ? (
        <>
          <g fill="#fffdf6" stroke="#0b2a28" strokeWidth="3">
            <ellipse cx="49" cy="50" rx="6.4" ry="7.6" />
            <ellipse cx="71" cy="50" rx="6.4" ry="7.6" />
          </g>
          <circle cx="50.5" cy="51.5" r="3" fill="#0b2a28" />
          <circle cx="72.5" cy="51.5" r="3" fill="#0b2a28" />
          <path d="M52 62q8 8 16 0" stroke="#0b2a28" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <ellipse cx="40" cy="60" rx="5" ry="3" fill="#e63b2e" opacity="0.3" />
          <ellipse cx="80" cy="60" rx="5" ry="3" fill="#e63b2e" opacity="0.3" />
        </>
      ) : (
        <>
          <g stroke="#0b2a28" strokeWidth="3.4" strokeLinecap="round">
            <path d="M44 45l10 10M54 45l-10 10M66 45l10 10M76 45l-10 10" />
            <path d="M52 66q8-7 16 0" fill="none" />
          </g>
          <path d="M84 30l-8 16 6 2-9 18" stroke="#7a5b41" strokeWidth="2.6" fill="none" />
        </>
      )}
    </svg>
  );
}
