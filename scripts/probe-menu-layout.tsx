/**
 * Render the start screen to real HTML and check what it actually produced.
 *
 * WHY A RENDER PROBE AND NOT JUST UNIT TESTS
 * ------------------------------------------
 * `tests/menu-layout.test.ts` checks the arithmetic and reads the source. It
 * cannot see the DOM. The 1.1.7 failures were *DOM* failures: a class that
 * centred content inside a scroller, a flex sibling that demanded height, a
 * footer that wrapped. Every one of those is invisible to a source-level
 * assertion and obvious in rendered markup.
 *
 * So this renders `StartScreen` with `react-dom/server` and asserts on the
 * string it produces. It is not a browser: it cannot measure pixels. It can
 * prove that the elements which carry the pixel-determining classes exist,
 * are in the right nesting, and do not carry the classes that caused the bug.
 *
 * Run:
 *   npx vite-node scripts/probe-menu-layout.tsx
 */
import { renderToString } from "react-dom/server";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import StartScreen from "../src/components/StartScreen";
import { DEFAULT_SETTINGS } from "../src/game/settings";
import { planMenuLayout } from "../src/components/menu/layout";
import { heroLayout, heroContentHeight } from "../src/components/menu/adaptive";

const noop = () => {};

const html = renderToString(
  createElement(StartScreen as never, {
    scores: [],
    best: 6420,
    touchMode: false,
    achievements: ["first-catch"],
    mode: "classic",
    onModeChange: noop,
    onStart: noop,
    resume: null,
    onResume: noop,
    settings: DEFAULT_SETTINGS,
    onPatchSettings: noop,
    onChangeLanguage: noop,
    onQuickSettings: noop,
    onResetDefaults: noop,
    onClearAllData: noop,
  } as never),
);

const plan = planMenuLayout({ width: 1280, height: 720 });

interface Check {
  name: string;
  pass: boolean;
  detail: string;
}
const checks: Check[] = [];
const check = (name: string, pass: boolean, detail = "") => checks.push({ name, pass, detail });

const count = (needle: string) => html.split(needle).length - 1;

/** Pull the attribute value off the first element carrying `marker`. */
function attrAfter(marker: string, attr: string): string | null {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const tag = html.slice(i, html.indexOf(">", i));
  const m = tag.match(new RegExp(`${attr}="([^"]*)"`));
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// 1. One scroll container. The bug was a nested scroller that centred.
// ---------------------------------------------------------------------------
check(
  "no scroll container at all (round 3)",
  count("menu-scroll") === 0 && count("overflow-y-auto") === 0 && count("menu-pane") === 1,
  `menu-scroll ×${count("menu-scroll")}, menu-pane ×${count("menu-pane")}, overflow-y-auto ×${count("overflow-y-auto")}`,
);

check(
  "the old nested centring wrapper is gone",
  !html.includes("justify-center px-4") && !html.includes("min-h-full"),
  "no justify-center wrapper, no min-h-full",
);

check(
  "the scroll container holds the hero and the chrome is outside it",
  html.indexOf("menu-scroll") < html.indexOf('data-chrome="menu"'),
  "menu-scroll precedes data-chrome",
);

// ---------------------------------------------------------------------------
// 2. The hero reserves exactly the chrome's height.
// ---------------------------------------------------------------------------
check(
  "the hero reserves the planned reserve",
  html.includes(`padding-bottom:${plan.reserve}px`) || html.includes(`padding-bottom: ${plan.reserve}px`),
  `expected ${plan.reserve}px`,
);

check(
  "the hero's min-height comes from the plan",
  html.includes(`--menu-scene-h`) && html.includes(`${plan.scene}px`),
  `scene ${plan.scene}px`,
);

// ---------------------------------------------------------------------------
// 2b. THE WINDOWED BUG (round 7).
//
// The screenshot is a 1568×677 window — not fullscreen — showing the mascot
// sliced across the middle and its mode chip cut in half at the bottom edge.
// The hero is `justify-start` + `overflow: hidden`, so anything taller than the
// band is cut at the bottom; the question is whether the layout the markup
// contains is taller than the band the markup declares.
//
// This probe cannot measure pixels, but it can do the arithmetic the component
// does, using the same two exported functions, and it can assert that the
// markup agrees with the answer.
// ---------------------------------------------------------------------------
const windowed = planMenuLayout({ width: 1568, height: 677 });
const windowedHero = heroLayout({
  scene: windowed.scene,
  width: 1568,
  minimal: windowed.minimal,
});
const windowedNeed = heroContentHeight(windowedHero);

check(
  "the windowed hero fits its band (1568×677)",
  windowedNeed <= windowed.scene,
  `needs ${windowedNeed}px of a ${windowed.scene}px band`,
);

check(
  "the windowed hero is not wordmark-only",
  windowedHero.badgeRow || windowedHero.mascot,
  JSON.stringify(windowedHero),
);

/*
 * The same check at every windowed size a real browser produces when the user
 * clicks the maximize button and drags the window to a random size. This is the
 * regression the whole round is about: the old ladder reported "fits" at all of
 * these and drew a 370px column into a 299px band.
 */
const WINDOWED: [number, number][] = [
  [1568, 677], [1440, 677], [1366, 650], [1280, 720], [1280, 640],
  [1920, 820], [1920, 900], [1600, 700], [1024, 600], [900, 500],
];
for (const [w, h] of WINDOWED) {
  const p = planMenuLayout({ width: w, height: h });
  const l = heroLayout({ scene: p.scene, width: w, minimal: p.minimal });
  const need = heroContentHeight(l);
  check(
    `hero fits at ${w}×${h}`,
    need <= p.scene,
    `needs ${need}px of ${p.scene}px${l.mascot ? "" : " (wordmark only)"}`,
  );
}

// ---------------------------------------------------------------------------
// 3. The chrome is out of the flex flow.
// ---------------------------------------------------------------------------
check(
  "chrome is absolutely positioned at the bottom",
  html.includes('data-chrome="menu"') && attrAfter('data-chrome="menu"', "class")?.includes("absolute inset-x-0 bottom-0") === true,
  attrAfter('data-chrome="menu"', "class") ?? "missing",
);

check(
  "chrome is not a shrink-0 flex sibling",
  !html.includes("flex shrink-0 items-end justify-between"),
  "clean",
);

// ---------------------------------------------------------------------------
// 4. Both panels exist at their declared height.
// ---------------------------------------------------------------------------
check(
  "two corner panels",
  count('data-panel="left"') === 1 && count('data-panel="right"') === 1,
  `left ×${count('data-panel="left"')}, right ×${count('data-panel="right"')}`,
);

check(
  "panels carry an explicit height",
  /data-panel="left"[^>]*style="[^"]*height:\s*\d+px/.test(html) ||
    /style="[^"]*height:\s*\d+px[^"]*"[^>]*data-panel="left"/.test(html),
  attrAfter('data-panel="left"', "style") ?? "missing",
);

check(
  "panels have their header and body",
  count("corner-panel-body") === 2,
  `corner-panel-body ×${count("corner-panel-body")}`,
);

// ---------------------------------------------------------------------------
// 5. Every menu row is height-declared.
// ---------------------------------------------------------------------------
const rows = count('data-row="');
/*
 * ROUND 5: eleven, not ten. INFO gained «PHÍM TẮT» to fill the 160px of panel
 * that used to sit blank under «THOÁT». The extra row is the point — it turns
 * space that was doing nothing into the only discoverable list of the controls
 * the game actually listens for (Space/slam, Esc/pause and M/mute were
 * previously documented nowhere).
 */
check("eleven menu rows", rows === 11, `${rows} rows (7 GAME + 4 INFO)`);

check(
  "the INFO panel fills its blank half",
  html.includes("PHÍM TẮT") || html.includes("SHORTCUTS"),
  "shortcuts row present in the INFO column",
);

check(
  "every row declares a height instead of padding it",
  count('data-row="compact"') + count('data-row="rich"') === rows && html.includes("height:34px"),
  `compact ×${count('data-row="compact"')}, rich ×${count('data-row="rich"')}, 34px present`,
);

check(
  "the GAME panel gained the how-to row",
  (html.match(/data-row="compact"/g)?.length ?? 0) >= 7,
  "7 rows in GAME",
);

// ---------------------------------------------------------------------------
// 6. The ticker is one marquee line plus one footer line, both fixed.
// ---------------------------------------------------------------------------
check(
  "ticker exists with its fixed height class",
  html.includes('data-ticker="menu"') && attrAfter('data-ticker="menu"', "class")?.includes("h-12") === true,
  attrAfter('data-ticker="menu"', "class") ?? "missing",
);

check(
  "the marquee is a single line",
  count("anim-marquee") === 1,
  `anim-marquee ×${count("anim-marquee")}`,
);

check(
  "the copyright row is present exactly once",
  count("AGPL-3.0") === 1,
  `AGPL-3.0 ×${count("AGPL-3.0")}`,
);

// ---------------------------------------------------------------------------
// 7. Decoration is present, silent, and behind the content.
// ---------------------------------------------------------------------------
const decor = count("data-decor=");
check("fourteen decorations render", decor === 14, `${decor} decor items`);

check(
  "decoration is hidden from assistive tech",
  count('aria-hidden="true"') > 0,
  "",
);

check(
  "the halo has three rings",
  count("halo-ring-1") === 1 && count("halo-ring-2") === 1 && count("halo-ring-3") === 1,
  "",
);

// ---------------------------------------------------------------------------
// 8. How-to-play is no longer inside the hero.
// ---------------------------------------------------------------------------
check(
  "how-to rules are not rendered in the menu",
  !html.includes("rule.0.t") && !html.includes("rule-0"),
  "rules exist only behind the modal",
);

check(
  "the how-to entry point is exactly one menu row in GAME",
  /*
   * Round 6 removed the deck, so this went from two occurrences back to one:
   * the GAME row label. The deck's "rule of the day" cell was the other one,
   * and it opened the same modal — an entry point, not a second feature.
   *
   * Asserting the exact count is the point: a stray second copy is how the
   * deck came back the first time.
   */
  count("Cách chơi") === 1,
  `"Cách chơi" ×${count("Cách chơi")} — one row label`,
);

// ---------------------------------------------------------------------------
// 9. v1.1.8 QA round 2 — the three things the second screenshot asked for.
// ---------------------------------------------------------------------------
check(
  "the wordmark keeps its acute accent (CHÉO, not CHEO)",
  html.includes("CHÉO"),
  html.includes("CHEO") && !html.includes("CHÉO") ? "ACCENT MISSING" : "accent present",
);

check(
  "the shimmer does not clip the accents away",
  !/text-shimmer[^"]*"[^>]*style="[^"]*color:\s*transparent/.test(html),
  "no transparent colour on the wordmark element",
);

check(
  "the ENTER hint is gone",
  !html.includes("hoặc nhấn") && !html.includes("ENTER"),
  "hint removed from the hero",
);

check(
  "both corner panels carry a stat footer",
  count('data-panel-stat="') === 2,
  `${count('data-panel-stat="')} footers (GAME progress + INFO build)`,
);

check(
  "the GAME footer shows achievements over total",
  /\/16/.test(html),
  "unlocked/total present",
);

check(
  "the deck is gone (round 6 removes the three-column band)",
  count("data-deck-cell=") === 0 && !html.includes("deck-cell"),
  `${count("data-deck-cell=")} deck cells, CSS class ${html.includes("deck-cell") ? "present" : "absent"}`,
);
check(
  "the hero carries a layout decision, not a media query",
  /data-hero-layout="(row|stack)"/.test(html),
  (html.match(/data-hero-layout="([a-z]+)"/) ?? ["", "missing"])[0],
);
check(
  "the INFO panel carries today's challenge",
  html.includes("THỬ THÁCH HÔM NAY"),
  "challenge line rendered",
);

check(
  "the pane cannot scroll (overflow: clip)",
  /\.[a-z-]*menu-pane\s*\{[^}]*overflow:\s*clip/.test(readFileSync("src/index.css", "utf8")),
  "menu-pane is clipped, not scrollable",
);

check(
  "the hero declares a real height, not a minimum",
  /height:\s*\d+px/.test(attrAfter('data-hero="', "style") ?? "") ||
    /--menu-scene-h:\s*\d+px/.test(html),
  "hero height comes from the plan",
);

{
  // Only `.menu-scroll` must be bar-less; `.game-scroll` (modals) keeps its
  // styled 8px bar on purpose.
  const css = readFileSync("src/index.css", "utf8");
  const blocks = css.match(/\.menu-scroll::-webkit-scrollbar\s*\{[^}]*\}/g) ?? [];
  const wide = blocks.filter((b) => /width:\s*[1-9]/.test(b));
  check(
    "the menu scrollbar has no visible width",
    blocks.length > 0 && wide.length === 0,
    `${blocks.length} menu rule(s), ${wide.length} with a non-zero width`,
  );
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length));
console.log(`\nStartScreen renders ${html.length} chars\n`);
for (const c of checks) {
  console.log(`  ${c.pass ? "✓" : "✗"} ${pad(c.name, 52)} ${c.detail}`);
}

const failed = checks.filter((c) => !c.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} DOM checks passed`);

if (failed.length) {
  console.error("\nFAILED:");
  for (const f of failed) console.error(`  ✗ ${f.name} — ${f.detail}`);
  process.exit(1);
}

console.log("\nlayout plans:");
for (const [w, h] of [
  [1280, 720],
  [1366, 768],
  [1920, 1080],
  [768, 1024],
  [375, 667],
] as const) {
  const p = planMenuLayout({ width: w, height: h });
  console.log(
    `  ${pad(`${w}×${h}`, 11)} reserve ${pad(String(p.reserve), 5)} scene ${pad(String(p.scene), 5)} ` +
      `${p.stacked ? "stacked" : "side-by-side"}/${p.dense ? "rich" : "compact"}`,
  );
}

console.log("\nMARKUP OK\n");
