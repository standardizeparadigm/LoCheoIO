/**
 * The glossary defines words, so its definitions have to match the thing.
 *
 * Two were wrong in the same row pair:
 *
 *     | **gate**  | một trong 9 bước kiểm tra (… `probe` …) |
 *     | **probe** | scripts/probe-menu-layout.tsx — 33 cỡ cửa sổ, đọc DOM thật |
 *
 * The probe takes 14 viewports, not 33. And it is not a gate: it renders the
 * menu in a real DOM and prints measurements for a human to read, which is why no
 * workflow calls it. Someone learning the vocabulary here would come away
 * believing a manual, merge-blocking-nothing script is one of the checks that
 * protect `main` — and believing the layout is tested at more than twice the
 * resolutions it is.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const GLOSSARY = readFileSync(join(ROOT, "docs/guides/glossary.md"), "utf8");
const PROBE = readFileSync(join(ROOT, "scripts/probe-menu-layout.tsx"), "utf8");

/** Distinct `[width, height]` pairs the probe plans for. */
function probeViewports(): number {
  const pairs = PROBE.match(/\[\d{3,4},\s*\d{3,4}\]/g) ?? [];
  return new Set(pairs.map((p) => p.replace(/\s/g, ""))).size;
}

describe("docs/guides/glossary.md", () => {
  it("states the probe's real viewport count", () => {
    const real = probeViewports();
    expect(real).toBeGreaterThanOrEqual(10);
    const claimed = Number(/probe-menu-layout\.tsx` — (\d+) cỡ cửa sổ/.exec(GLOSSARY)?.[1]);
    expect(claimed).toBe(real);
  });

  it("does not list the probe among the CI gates", () => {
    /*
     * The definition row used to include `probe` in its parenthesised list of
     * gates. It runs by hand: `npm run smoke` covers SSR rendering in CI, and
     * nothing in `.github/workflows/ci.yml` mentions the probe.
     */
    const ci = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");
    expect(ci).not.toContain("probe-menu-layout");
    const gateRow = GLOSSARY.split("\n").find((l) => l.startsWith("| **gate**"))!;
    expect(gateRow, "the gate row should say the probe is not one").toContain("không phải gate");
    /* Everything the row does name must appear in CI. */
    for (const gate of ["tsc", "vitest", "build", "smoke", "check:readme", "check:i18n", "check:assets", "check-svg"]) {
      expect(gateRow, `the gate row names ${gate}, which must be a real gate`).toContain(gate);
    }
    for (const named of ["tsc", "vitest", "build", "smoke", "check-i18n", "check-assets", "check-svg", "check-readme-sync"]) {
      expect(ci, `the gate row implies ${named} runs in CI`).toContain(named);
    }
  });

  it("defines the words it uses elsewhere", () => {
    /* A glossary that drops a term breaks every document that links to it. */
    for (const term of ["gate", "probe", "deck", "stage", "tip"]) {
      expect(GLOSSARY).toContain(`| **${term}** |`);
    }
  });
});

/*
 * The `plan` row described a shape that changed twice and was counted once.
 *
 *     | **plan** | MenuPlan — … Năm cờ + bốn con số |
 *
 * `MenuPlan` has seven booleans and three numbers. Two flags arrived after that
 * sentence was written (`compact` in round 7, `stacked` with the corner panels)
 * and one number left. Nobody edits a shape description when they add a field:
 * the field has a comment, a test and a call site, and the glossary row has none
 * of those.
 */
describe("the plan row", () => {
  const fit = readFileSync(join(ROOT, "src/components/menu/layout/fit.ts"), "utf8");
  const row = GLOSSARY.split("\n").find((l) => l.startsWith("| **plan**"))!;
  const iface = fit.slice(fit.indexOf("export interface MenuPlan"), fit.indexOf("}", fit.indexOf("export interface MenuPlan")));

  it("states the number of flags the interface has", () => {
    const flags = (iface.match(/^\s+\w+: boolean;/gm) ?? []).length;
    const numbers = (iface.match(/^\s+\w+: number;/gm) ?? []).length;
    expect(flags).toBeGreaterThanOrEqual(7);
    expect(numbers).toBeGreaterThanOrEqual(3);
    /* The row now spells both counts in words — Vietnamese numerals. */
    expect(row).toContain("Bảy cờ");
    expect(row).toContain("ba con số");
  });

  it("names every flag, so adding one is visible here", () => {
    const flags = [...iface.matchAll(/^\s+(\w+): boolean;/gm)].map((m) => m[1]);
    const missing = flags.filter((f) => !row.includes(f));
    expect(missing, "flags the glossary row omits").toEqual([]);
  });
});
