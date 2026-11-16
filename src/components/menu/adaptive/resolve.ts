/**
 * One call, one profile — everything adaptive the screen needs.
 *
 * WHY A PROFILE AND NOT SEVEN HOOKS
 * ---------------------------------
 * `StartScreen` already called two (`useMenuPlan`, `useViewportWidth`) and the
 * modal shell would have needed a third. Three hooks means three subscriptions
 * to `resize`, three animation frames, and — the dangerous part — three reads of
 * the window that can land on *different* frames. A resize drag then produces a
 * hero planned for 1280×720 next to a panel painted for 1280×700, which is the
 * class of bug this whole folder exists to end.
 *
 * `resolveAdaptive()` is one pure function of one box. `useAdaptive()` reads the
 * window once per animation frame and calls it once. Every consumer reads fields
 * of the same object, so they cannot disagree by construction.
 *
 * The function is total: a `NaN` width, a 1×1 window, an inverted range and a
 * viewport with a 500px safe-area inset all produce a coherent profile with
 * finite numbers, because each of those has been a bug in this repository at
 * some point and every one of them must stay a non-event.
 */

import { planMenuLayout, type MenuPlan } from "../layout/fit";
import { planModal, type ModalPlan } from "../../ui/modalPlan";
import { planPlayfield, type PlayfieldPlan } from "../../../game/adaptive/playfield";
import { densityFor, metricsFor, panelHeightForPlan, panelWidthFor, type Density, type DensityMetrics } from "./density";
import { verticalInset, type Environment, DESKTOP_ENVIRONMENT } from "./environment";
import { heroLayout, type HeroLayout } from "./hero";
import { typeScaleFor, typeVars, type TypeScale } from "./typeScale";
import { tierFor, deviceClass, type DeviceClass, type SizeTier } from "./tiers";
import { aspectClassOf, boxOf, describeBox, roomDriver, type AspectClass, type Box } from "./viewport";

/**
 * The levers the repair engine may pull.
 *
 * Every field here is a *deliberate* degradation: it throws away something the
 * layout would otherwise show, and it exists so `repair/repair.ts` has a finite,
 * ordered set of things to try when a window cannot satisfy the contract. Nothing
 * in the app sets them — `useAdaptive()` resolves with none — so the default path
 * is byte-for-byte the pre-round-12 one, which `tests/adaptive-repair.test.ts`
 * asserts directly.
 *
 * The values are `unknown`-safe: a `NaN` factor or a negative one is ignored
 * rather than propagated, because a repair path that can produce an invalid
 * profile is worse than no repair path.
 */
export interface AdaptiveOverrides {
  /** Pretend the safe-area inset is zero, buying back the chrome's height. */
  ignoreInset?: boolean;
  /** Multiply every type size (0 < f ≤ 1). Sizes never go below the 8px floor. */
  typeScale?: number;
  /** Force one column on the wide dialogs. */
  singleColumn?: boolean;
  /** Multiply the HUD scale (0 < f ≤ 1), so it claims less of the board. */
  hudScale?: number;
}

/** The environment the profile was built for; a browser-less default otherwise. */
export interface AdaptiveInput {
  box: Box;
  env?: Environment;
  /** The dialog currently open, if any, asks for the wide layout. */
  wideModal?: boolean;
  /** Repair levers. Absent in the app; used by `repairProfile()`. */
  overrides?: AdaptiveOverrides;
}

/** Everything the start screen, the dialogs and the canvas read. */
export interface AdaptiveProfile {
  /** Normalised window. */
  box: Box;
  /** `xs`…`xxl`, from the shortest side. */
  tier: SizeTier;
  /** `handset`…`cinema`, for documentation and the overlay. */
  device: DeviceClass;
  /** `tall`…`panoramic`. */
  aspect: AspectClass;
  /** 0..1 "how much room" signal, height-biased. */
  room: number;
  /** Named density of the chrome. */
  density: Density;
  /** The density's pixel table. */
  metrics: DensityMetrics;
  /** The layout plan — the same object the chrome and hero already used. */
  plan: MenuPlan;
  /** Which hero arrangement fits the band. */
  hero: HeroLayout;
  /** Every text size, px. */
  type: TypeScale;
  /** Dialog sizing. */
  modal: ModalPlan;
  /** Canvas sizing, for the engine. */
  playfield: PlayfieldPlan;
  /** The GAME panel's painted height, px — the reserve minus the ticker, margin and (absent) footer. */
  panelHeight: number;
  /** CSS custom properties, ready for a `style` prop. */
  cssVars: Record<string, string>;
  /** True when the safe-area inset moved the plan off the raw window height. */
  insetApplied: boolean;
}

/** Build the profile for a box. */
export function resolveAdaptive({
  box,
  env = DESKTOP_ENVIRONMENT,
  wideModal = false,
  overrides,
}: AdaptiveInput): AdaptiveProfile {
  const o = overrides ?? {};
  const inset = o.ignoreInset ? 0 : Math.max(0, verticalInset(env));
  const plan = planMenuLayout({ width: box.width, height: box.height, inset });
  const density = densityFor(plan);
  const metrics = metricsFor(density);
  const type = scaleTypeScale(typeScaleFor({ box, plan }), o.typeScale);
  const hero = heroLayout({ scene: plan.scene, width: box.width, minimal: plan.minimal });
  const modal = planModal(box, wideModal && !o.singleColumn);
  const playfield = scaleHud(planPlayfield(box.width, box.height, env.dpr), o.hudScale);
  const panelHeight = panelHeightForPlan(plan);

  return {
    box,
    tier: tierFor(box),
    device: deviceClass(box),
    aspect: aspectClassOf(box),
    room: roomDriver(box),
    density,
    metrics,
    plan,
    hero,
    type,
    modal,
    playfield,
    panelHeight,
    cssVars: {
      ...typeVars(type),
      "--adaptive-scene": `${plan.scene}px`,
      "--adaptive-reserve": `${plan.reserve}px`,
      "--adaptive-panel-w": `${panelWidthFor(box.width, density)}px`,
      "--adaptive-panel-h": `${panelHeight}px`,
      "--adaptive-row-h": `${metrics.rowHeight}px`,
      "--adaptive-row-gap": `${metrics.rowGap}px`,
      "--adaptive-ticker-h": `${plan.ticker ? metrics.tickerHeight : 0}px`,
      "--adaptive-room": `${roomDriver(box)}`,
    },
    insetApplied: inset > 0,
  };
}

/**
 * `typeScale × factor`, with the 8px floor intact.
 *
 * The floor is not a nicety: `type-legible` is one of the fourteen invariants, and
 * a repair lever that can violate the contract it is repairing is not a lever.
 * A non-finite or out-of-range factor is ignored, not clamped into nonsense.
 */
function scaleTypeScale(type: TypeScale, factor: number | undefined): TypeScale {
  if (typeof factor !== "number" || !Number.isFinite(factor) || factor <= 0 || factor >= 1) return type;
  /*
   * Rebuilt key by key rather than mutated in a loop: `TypeScale` is all numbers,
   * but TypeScript narrows a `keyof` loop into `never` the moment it writes,
   * and a cast there would hide a future non-numeric field instead of failing.
   */
  const f = (v: number) => Math.max(8, Math.round(v * factor * 10) / 10);
  return {
    eyebrow: f(type.eyebrow),
    liveBadge: f(type.liveBadge),
    lockupLo: f(type.lockupLo),
    lockupCheo: f(type.lockupCheo),
    badgePlate: f(type.badgePlate),
    record: f(type.record),
    panelHeader: f(type.panelHeader),
    rowLabel: f(type.rowLabel),
    rowHint: f(type.rowHint),
    statFooter: f(type.statFooter),
    ticker: f(type.ticker),
    tickerFooter: f(type.tickerFooter),
    modalTitle: f(type.modalTitle),
    modalBody: f(type.modalBody),
    hudScore: f(type.hudScore),
    hudLabel: f(type.hudLabel),
    overScore: f(type.overScore),
    /* The two non-numeric fields are the derivation's *reasons*, not sizes. */
    lockupLimitedBy: type.lockupLimitedBy,
    tier: type.tier,
  };
}

/** The HUD scale, shrunk — never below `planHud`'s own floor. */
function scaleHud(plan: PlayfieldPlan, factor: number | undefined): PlayfieldPlan {
  if (typeof factor !== "number" || !Number.isFinite(factor) || factor <= 0 || factor >= 1) return plan;
  return { ...plan, hudScale: Math.max(0.55, Math.round(plan.hudScale * factor * 100) / 100) };
}

/** Convenience for callers that only have two numbers. */
export function resolveForSize(width: unknown, height: unknown, env?: Environment): AdaptiveProfile {
  return resolveAdaptive({ box: boxOf(width, height), env });
}

/**
 * The profile as `data-*` attributes.
 *
 * Two reasons this is data rather than a prop threaded through the tree:
 *
 *  - the probe (`scripts/probe-menu-layout.tsx`) and the CSS both read it, and
 *    CSS can only select on an attribute;
 *  - a screenshot bug is diagnosable from the DOM alone when the DOM says which
 *    tier, density and hero layout it drew — no console, no React DevTools.
 */
export function adaptiveAttributes(profile: AdaptiveProfile): Record<string, string> {
  return {
    "data-adaptive-tier": profile.tier,
    "data-adaptive-density": profile.density,
    "data-adaptive-device": profile.device,
    "data-adaptive-aspect": profile.aspect,
    "data-adaptive-hero": profile.hero.sideBySide ? "row" : "stack",
    "data-adaptive-fit": profile.plan.fit,
    "data-adaptive-room": profile.room.toFixed(2),
    "data-adaptive-inset": profile.insetApplied ? "1" : "0",
  };
}

/** One line for a terminal, a log line or the (optional) debug strip. */
export function describeAdaptive(profile: AdaptiveProfile): string {
  return [
    describeBox(profile.box),
    profile.tier,
    profile.density,
    `scene ${profile.plan.scene}px`,
    `reserve ${profile.plan.reserve}px`,
    `type ${profile.type.rowLabel}/${profile.type.rowHint}px`,
    `fit ${profile.plan.fit}`,
  ].join(" · ");
}

/** The names of every CSS variable the profile sets — used by the docs test. */
export const ADAPTIVE_CSS_VARS = [
  "--type-eyebrow",
  "--type-live",
  "--type-lockup-lo",
  "--type-lockup-cheo",
  "--type-badge",
  "--type-record",
  "--type-panel-head",
  "--type-row-label",
  "--type-row-hint",
  "--type-stat",
  "--type-ticker",
  "--type-ticker-foot",
  "--type-modal-title",
  "--type-modal-body",
  "--type-hud-score",
  "--type-hud-label",
  "--type-over-score",
  "--adaptive-scene",
  "--adaptive-reserve",
  "--adaptive-panel-w",
  "--adaptive-panel-h",
  "--adaptive-row-h",
  "--adaptive-row-gap",
  "--adaptive-ticker-h",
  "--adaptive-room",
] as const;
