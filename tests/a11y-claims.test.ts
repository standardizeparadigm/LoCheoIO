/**
 * The accessibility guide makes claims about the code, so the code is checked.
 *
 * `docs/guides/accessibility.md` exists to answer "what does this app do for
 * keyboard and screen-reader users". Half of it was wrong: it described a focus
 * trap that worked and ARIA roles that were not there. A guide that is not
 * checked against the source degrades into a wish list.
 *
 * Every case here corresponds to one sentence in the guide.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const guide = read("docs/guides/accessibility.md");

describe("the guide and the code agree on ARIA", () => {
  const segmented = read("src/components/settings/SegmentedControl.tsx");
  const stepper = read("src/components/settings/VolumeStepper.tsx");

  it("SegmentedControl is a group with aria-pressed, not a radiogroup", () => {
    expect(segmented).toContain('role="group"');
    expect(segmented).toContain("aria-pressed");
    expect(segmented).not.toContain("radiogroup");
    expect(segmented).not.toContain("aria-checked");
  });

  it("SegmentedControl still has the full roving keyboard model", () => {
    /*
     * The distinction the guide draws is subtle — same keyboard model, different
     * announced role — and a careless "simplify to a plain group" would delete
     * the arrow keys while the guide kept claiming the behaviour. Pin it.
     */
    expect(segmented).toContain("tabIndex={active ? 0 : -1}");
    for (const key of ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"]) {
      expect(segmented, `SegmentedControl lost ${key}`).toContain(key);
    }
  });

  it("the guide does not claim the stepper has arrow keys", () => {
    // The two cases are not symmetrical and the guide says so.
    expect(stepper).not.toContain("ArrowLeft");
    expect(guide).toMatch(/Khác trường hợp trên|không.*phím mũi tên/);
  });

  it("the guide says so, and explains why", () => {
    expect(guide).toContain("radiogroup");
    // The rule, not just the fact: a role promises keys.
    expect(guide).toMatch(/hứa.*phím|promises.*key/i);
  });

  it("VolumeStepper is buttons around a role=img read-out", () => {
    expect(stepper).toContain('role="img"');
    expect(stepper).not.toContain('role="slider"');
    expect(stepper).not.toContain("aria-valuenow");
  });

  it("the modal is a labelled dialog with a real backdrop button", () => {
    const modal = read("src/components/ui/modal.tsx");
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain("aria-label");
    // Backdrop as <button>, not a div with onClick — it must be Tab-reachable.
    const backdrop = modal.slice(modal.indexOf("aria-label={t(\"close.aria\")}"));
    expect(backdrop.slice(0, 120)).not.toContain("<div");
  });

  it("the canvas has a role and a label", () => {
    const canvas = read("src/components/GameCanvas.tsx");
    expect(canvas).toContain('role="img"');
    expect(canvas).toContain("aria-label");
  });
});

describe("the guide's three failures are still fixed", () => {
  const trap = read("src/utils/useFocusTrap.ts");

  it("the empty-container branch does not preventDefault", () => {
    // Failure 1. A guide that documents a fix must not outlive the fix.
    expect(guide).toContain("Tab bị giữ làm con tin");
    const at = trap.indexOf("if (list.length === 0)");
    const guard = trap.slice(at, trap.indexOf("\n", at));
    expect(guard).not.toContain("preventDefault");
  });

  it("the restore checks isConnected and disabled", () => {
    // Failure 2.
    expect(guide).toContain("phần tử đã chết");
    expect(trap).toContain("isConnected");
    expect(trap).toContain("disabled");
  });

  it("the typing guard exists and reads e.target", () => {
    // Failure 3.
    expect(guide).toContain("Gõ tên");
    const canvas = read("src/components/GameCanvas.tsx");
    expect(canvas).toContain("isTyping");
    expect(canvas).toContain("e.target");
    // The explicit anti-claim: activeElement is the wrong test.
    expect(canvas).not.toContain("document.activeElement === e.target");
  });
});

describe("the guide admits what is missing", () => {
  it("says the canvas HUD has no text alternative", () => {
    expect(guide).toMatch(/Canvas HUD/);
  });

  it("says it has not been tested with a real screen reader", () => {
    // A guide with no limitations section is marketing, not documentation.
    expect(guide).toMatch(/screen reader thật|NVDA/);
  });
});
