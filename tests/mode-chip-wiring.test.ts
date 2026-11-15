/**
 * The planner was never the hard part — the wiring was.
 *
 * `planModeChip()` can be perfect and the chip still clipped, because the bug was
 * a *class name*: `-translate-x-1/2` applied unconditionally on an element that
 * sits at the right end of the row. No unit test of the planner can catch that,
 * and no DOM test exists in this repo (there is no jsdom): the component is
 * covered by the SSR smoke render, which checks that it renders, not where.
 *
 * So this file reads the two files as text and asserts the four decisions that
 * make the fix real. It is the same technique as `check-adaptive-script.test.ts`,
 * and for the same reason: some invariants live in the wiring.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const chip = readFileSync("src/components/menu/ModeChip.tsx", "utf8");
const start = readFileSync("src/components/StartScreen.tsx", "utf8");

describe("ModeChip applies the plan", () => {
  it("clamps its width with the plan's number", () => {
    expect(chip).toContain("style={{ maxWidth: plan.maxWidth }}");
    // …and the class list keeps `max-w-full`, so the clamp survives a flex parent.
    expect(chip).toContain("max-w-full");
  });

  it("switches alignment on the plan's answer, not on a breakpoint", () => {
    // The two branches must both exist and both be conditional.
    expect(chip).toContain('plan.align === "end" ? " right-0" : " left-1/2 -translate-x-1/2"');
    // A translate that is not conditional is the original bug.
    expect(chip).not.toMatch(/className="[^"]*-translate-x-1\/2[^"]*"\s*\n?\s*(?!.*plan\.align)/s);
  });

  it("stamps the rung it chose", () => {
    expect(chip).toContain("data-mode-chip={plan.reason}");
    expect(chip).toContain("data-mode-chip-align={plan.align}");
    expect(chip).toContain("data-mode-chip-name={plan.nameSize}");
  });

  it("does not render a chip the plan hid", () => {
    expect(chip).toContain("if (!plan.visible) return null;");
  });

  it("lets the name ellipsis but not the box", () => {
    expect(chip).toContain("min-w-0 truncate");
    expect(chip).toContain("whitespace-nowrap");
  });
});

describe("StartScreen feeds it the honest numbers", () => {
  it("passes the band width, not the window width", () => {
    expect(start).toContain("heroBandWidth(profile.box.width)");
    expect(start).not.toContain('bandWidth={profile.box.width}');
  });

  it("tells the chip which side the mascot is on", () => {
    expect(start).toContain('side={hero.sideBySide ? "right" : "center"}');
  });

  it("keeps the chip out of the minimal layout, as before", () => {
    expect(start).toContain("{!plan.minimal && (");
  });
});
