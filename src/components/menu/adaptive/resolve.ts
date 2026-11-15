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
import { densityFor, metricsFor, panelHeightFor, panelWidthFor, type Density, type DensityMetrics } from "./density";
import { verticalInset, type Environment, DESKTOP_ENVIRONMENT } from "./environment";
import { heroLayout, type HeroLayout } from "./hero";
import { typeScaleFor, typeVars, type TypeScale } from "./typeScale";
import { tierFor, deviceClass, type DeviceClass, type SizeTier } from "./tiers";
import { aspectClassOf, boxOf, describeBox, roomDriver, type AspectClass, type Box } from "./viewport";

/** The environment the profile was built for; a browser-less default otherwise. */
export interface AdaptiveInput {
  box: Box;
  env?: Environment;
  /** The dialog currently open, if any, asks for the wide layout. */
  wideModal?: boolean;
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
  /** The GAME panel's painted height, px — equal to what the plan reserved. */
  panelHeight: number;
  /** CSS custom properties, ready for a `style` prop. */
  cssVars: Record<string, string>;
  /** True when the safe-area inset moved the plan off the raw window height. */
  insetApplied: boolean;
}

/** Build the profile for a box. */
export function resolveAdaptive({ box, env = DESKTOP_ENVIRONMENT, wideModal = false }: AdaptiveInput): AdaptiveProfile {
  const inset = Math.max(0, verticalInset(env));
  const plan = planMenuLayout({ width: box.width, height: box.height, inset });
  const density = densityFor(plan);
  const metrics = metricsFor(density);
  const type = typeScaleFor({ box, plan });
  const hero = heroLayout({ scene: plan.scene, width: box.width, minimal: plan.minimal });
  const modal = planModal(box, wideModal);
  const playfield = planPlayfield(box.width, box.height, env.dpr);
  const panelHeight = panelHeightFor(density);

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
