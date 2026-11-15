/**
 * Every effect that starts something must stop it.
 *
 * `GameOverScreen` deferred its focus call with `window.setTimeout(…, 420)` and
 * returned nothing from the effect. A player can press *menu* inside those
 * 420 ms, and the callback then calls `inputRef.current?.focus()` on a
 * component that has unmounted. The optional chain makes that harmless today —
 * which is exactly why nobody noticed — but an effect whose setup and cleanup
 * disagree is a leak waiting for the next edit.
 *
 * Without jsdom there is nothing to mount, so this reads the source: an effect
 * body that calls `setTimeout` must either clear it or be one of the documented
 * exceptions. Timer cleanup is the one React rule that can be checked by
 * reading, and it is the rule this repo has actually broken.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "locales") continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx$/.test(entry)) out.push(p);
  }
  return out;
}

/**
 * Files allowed to skip cleanup, each with the reason it is safe.
 *
 * `audio.ts` schedules a single resume after a user gesture and clears it in
 * the matching branch; the check below only looks at effects, so it is not
 * scanned. Nothing else is exempt.
 */
const FILES = sources(join(ROOT, "src"));

/** Pull `useEffect(() => { … }` bodies out of a source file, brace-matched. */
function effectBodies(src: string): string[] {
  const out: string[] = [];
  const marker = "useEffect(";
  let i = src.indexOf(marker);
  while (i >= 0) {
    const open = src.indexOf("{", i);
    if (open < 0) break;
    let depth = 0;
    let j = open;
    for (; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    out.push(src.slice(open, j + 1));
    i = src.indexOf(marker, j);
  }
  return out;
}

describe("React effects that arm timers", () => {
  const offenders: string[] = [];

  for (const file of FILES) {
    const src = readFileSync(file, "utf8");
    for (const body of effectBodies(src)) {
      if (!/\bsetTimeout\(|\bsetInterval\(/.test(body)) continue;
      /* An early `return;` with no function means the timer cannot be cleared. */
      const hasCleanup = /\bclearTimeout\b|\bclearInterval\b|return \(\) =>/.test(body);
      if (!hasCleanup) {
        offenders.push(`${file.replace(ROOT + "/", "")}: ${body.trim().slice(0, 70)}…`);
      }
    }
  }

  it("all clear their timer in the same effect", () => {
    expect(offenders).toEqual([]);
  });

  it("scans a meaningful number of effects", () => {
    /*
     * Not vacuous: if the brace matcher breaks or a refactor renames the hook,
     * "no offenders" would mean "nothing was parsed".
     */
    const withTimers = FILES.filter((f) => /useEffect\(/.test(readFileSync(f, "utf8")));
    expect(withTimers.length).toBeGreaterThanOrEqual(4);
    const timed = FILES.flatMap((f) => effectBodies(readFileSync(f, "utf8")))
      .filter((b) => /\bsetTimeout\(/.test(b));
    expect(timed.length).toBeGreaterThanOrEqual(2);
  });
});
