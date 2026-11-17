import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MENU_BACKGROUND_LAYERS } from "../src/components/menu/background/layers";

/**
 * The menu scene's durations had three sources and no owner.
 *
 * `docs/design/menu-scene.md` table 7 said `glow-ring` turned every 22s and
 * `jar-glow` breathed for 4.5s; the stylesheet said 9s and 3.4s. The nebula row
 * said 19/26 against 17/19 in the CSS, the ray said 34 against 11, the two star
 * layers were swapped, and the floor was documented as a 12s drift while
 * `src/index.css` had long since stopped animating it. The background README
 * repeated every one of those numbers, so the drift was visible in two places at
 * once — which is worse than one, because two agreeing documents read as
 * verified.
 *
 * None of it is checkable by eye: a 22s ring and a 9s ring look the same in a
 * screenshot, and "the floor drifts" is only false if you watch it. So the two
 * documents are parsed here and compared with the stylesheet, and the floor's
 * stillness becomes an assertion rather than a sentence someone has to trust.
 *
 * The rule this file encodes, for the next layer: **a number in a doc about
 * timing has to be readable from the code that owns it.** If the doc says 9 s,
 * `src/index.css` must contain `animation: … 9s …` on that class, and if the
 * class has no animation the doc has to say so.
 */
const root = resolve(__dirname, "..");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

const indexCss = strip(readFileSync(resolve(root, "src/index.css"), "utf8"));
const animationsCss = strip(readFileSync(resolve(root, "src/styles/animations.css"), "utf8"));
const sceneDoc = readFileSync(resolve(root, "docs/design/menu-scene.md"), "utf8");
const bgReadme = readFileSync(resolve(root, "src/components/menu/background/README.md"), "utf8");

/** Every `selector { body }` pair, including rules nested in media queries. */
function rules(css: string): { selector: string; body: string }[] {
  const out: { selector: string; body: string }[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    out.push({ selector: m[1], body: m[2] });
  }
  return out;
}

const INDEX_RULES = rules(indexCss);

/**
 * Animation durations written on any rule whose selector names `cls`.
 *
 * A class can own more than one rule — `.cta-shine` is the button's glass plate
 * and `.cta-shine::after` is the sweep that actually animates — so the lookup is
 * per-rule, not per-selector-literal.
 */
function durationsOf(cls: string): number[] {
  const re = new RegExp(`(^|[^\\w-])\\.${cls}(?![\\w-])`);
  const out: number[] = [];
  for (const { selector, body } of INDEX_RULES) {
    if (!re.test(selector)) continue;
    for (const a of body.matchAll(/animation:\s*([^;]+);/g)) {
      // The shorthand has one required time (duration); a second time is the
      // delay. Only the first matters here.
      const t = /(\d+(?:\.\d+)?)s\b/.exec(a[1]);
      if (t) out.push(Number(t[1]));
    }
  }
  return out;
}

/** Keyframe names written on any rule whose selector names `cls`. */
function keyframesOf(cls: string): string[] {
  const re = new RegExp(`(^|[^\\w-])\\.${cls}(?![\\w-])`);
  const out: string[] = [];
  for (const { selector, body } of INDEX_RULES) {
    if (!re.test(selector)) continue;
    for (const a of body.matchAll(/animation:\s*([^;]+);/g)) {
      const name = /\b(lc-[a-z0-9-]+)/i.exec(a[1]);
      if (name) out.push(name[1]);
    }
  }
  return out;
}

interface SceneRow {
  index: number;
  label: string;
  classes: string[];
  motion: string;
  periods: number[];
  /** The row says the layer is still, i.e. its period cell is "—". */
  still: boolean;
}

/**
 * Table 7 in the design doc: `| # | Lớp | Class | Chuyển động | Chu kỳ |`.
 *
 * Parsed by position rather than by heading text, so rewording a column label
 * cannot silently empty the test — the row it is looking for is the one with
 * backticked class names and a period cell.
 */
function sceneTable(doc: string): SceneRow[] {
  const rows: SceneRow[] = [];
  for (const line of doc.split("\n")) {
    if (!line.startsWith("| ")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length !== 5) continue;
    if (!/^\d+$/.test(cells[0])) continue;
    const classes = [...cells[2].matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
    if (classes.length === 0) continue;
    const periods = [...cells[4].matchAll(/(\d+(?:\.\d+)?)\s*s\b/g)].map((m) => Number(m[1]));
    rows.push({
      index: Number(cells[0]),
      label: cells[1],
      classes,
      motion: cells[3],
      periods,
      still: periods.length === 0,
    });
  }
  return rows;
}

const TABLE = sceneTable(sceneDoc);

describe("the scene table is still a table", () => {
  it("lists eight layers, numbered once each", () => {
    expect(TABLE.map((r) => r.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("names a class and an animation for every animated row", () => {
    for (const row of TABLE) {
      expect(row.classes.length, `row ${row.index} names no class`).toBeGreaterThan(0);
      if (row.still) {
        expect(row.motion).toMatch(/tĩnh/);
      } else {
        expect(row.motion, `row ${row.index} names no keyframe`).toMatch(/lc-[a-z0-9-]+/);
      }
    }
  });

  it("documents every duration the stylesheet actually uses, and no other", () => {
    for (const row of TABLE) {
      const live = row.classes.flatMap(durationsOf).sort((a, b) => a - b);
      const documented = [...row.periods].sort((a, b) => a - b);
      expect(documented, `row ${row.index} (${row.label}) disagrees with index.css`).toEqual(live);
    }
  });

  it("says the floor is still because it is still", () => {
    // The one row that used to carry a duration it could not justify. If someone
    // animates the floor — the widest layer on screen — the table has to change
    // with it, which is the whole point of keeping the claim in the table.
    const floor = TABLE.find((r) => r.classes.includes("tile-floor"))!;
    expect(floor.still).toBe(true);
    expect(durationsOf("tile-floor")).toEqual([]);
  });
});

describe("every keyframe the table names exists", () => {
  it("resolves each `lc-*` name in the motion column", () => {
    const named = new Set(TABLE.flatMap((r) => [...r.motion.matchAll(/lc-[a-z0-9-]+/g)].map((m) => m[0])));
    expect(named.size).toBeGreaterThanOrEqual(7);
    for (const key of named) {
      expect(animationsCss, `${key} is documented but not defined`).toContain(`@keyframes ${key}`);
    }
  });

  it("agrees with the keyframe each class actually runs", () => {
    for (const row of TABLE) {
      if (row.still) continue;
      const documented = new Set([...row.motion.matchAll(/lc-[a-z0-9-]+/g)].map((m) => m[0]));
      const live = new Set(row.classes.flatMap(keyframesOf));
      for (const key of live) {
        expect(documented.has(key), `row ${row.index} runs ${key} but does not document it`).toBe(true);
      }
    }
  });
});

describe("the background README repeats the same numbers", () => {
  /** The fenced block that lists the stack, back to front. */
  const fenced = (() => {
    const start = bgReadme.indexOf("```");
    const end = bgReadme.indexOf("```", start + 3);
    return bgReadme.slice(start + 3, end);
  })();

  const lines = fenced
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  it("mentions every animated layer", () => {
    for (const layer of MENU_BACKGROUND_LAYERS) {
      const cls = layer.className.split(/\s+/)[0];
      if (durationsOf(cls).length === 0) continue;
      expect(fenced, `${cls} animates but the README list omits it`).toContain(cls);
    }
  });

  it("states the duration each single-class line names", () => {
    for (const line of lines) {
      const first = line.split(/\s+/)[0];
      // Combined lines ("nebula-a / nebula-b") are checked by the design table.
      if (!/^[a-z0-9-]+$/.test(first) || line.includes("/")) continue;
      const documented = Number(/(\d+(?:\.\d+)?)s\b/.exec(line)?.[1]);
      const live = durationsOf(first).sort((a, b) => a - b);
      if (Number.isNaN(documented)) {
        expect(live, `${first} animates but the README calls it static`).toEqual([]);
      } else {
        expect(documented, `${first} disagrees with index.css`).toBe(live[0]);
      }
    }
  });
});

describe("the reduced-motion blocks cover the scene", () => {
  /** The rule that starts at `marker` — selector list included, so class names are visible. */
  function ruleAfter(marker: string): string {
    const at = indexCss.indexOf(marker);
    expect(at, `${marker} is missing`).toBeGreaterThan(-1);
    const open = indexCss.indexOf("{", at);
    let depth = 0;
    for (let i = open; i < indexCss.length; i++) {
      if (indexCss[i] === "{") depth++;
      else if (indexCss[i] === "}" && --depth === 0) return indexCss.slice(at, i);
    }
    throw new Error(`unbalanced rule after ${marker}`);
  }

  const animated = MENU_BACKGROUND_LAYERS.map((l) => l.className.split(/\s+/)[0]).filter(
    (cls) => durationsOf(cls).length > 0,
  );

  it("every animated layer is named by the OS preference", () => {
    const block = ruleAfter("@media (prefers-reduced-motion: reduce)");
    for (const cls of animated) {
      expect(block, `.${cls} animates but the media query does not stop it`).toMatch(
        new RegExp(`\\.${cls}(?![\\w-])`),
      );
    }
  });

  it("every animated layer is named by the in-game switch", () => {
    const block = ruleAfter('[data-reduced-motion="true"] .aurora-bg');
    for (const cls of animated) {
      expect(block, `.${cls} animates but the switch does not stop it`).toMatch(
        new RegExp(`\\.${cls}(?![\\w-])`),
      );
    }
  });
});
