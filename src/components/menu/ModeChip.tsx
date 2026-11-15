/**
 * The mode chip — «CHẾ ĐỘ CHƠI · MUỐI DƯA CỔ ĐIỂN» pinned under the mascot.
 *
 * WHY IT IS A COMPONENT
 * ---------------------
 * It is the only element in the hero that is positioned *absolutely relative to
 * a narrow anchor* while carrying text of a length nobody controls: a
 * translation, in seven locales, where the classic mode's name is 19 characters.
 * That combination is what shipped the bug — the chip was centred on a 160–240px
 * mascot column, and in the row layout the mascot sits at the right end of the
 * band, so half the chip went past `.menu-hero`'s `overflow: hidden` and the
 * right edge, the padding and the end of the name disappeared.
 *
 * The geometry fix is three lines: **align to the inner edge, not the centre**,
 * when the mascot is on the right; **cap the width**; **let the name ellipsis
 * only if the cap is reached**. The reasoning lives in `planModeChip()`; this
 * file is the part that touches the DOM.
 *
 * The two guarantees are deliberately independent — the plan decides the ladder
 * (which words survive), the CSS decides the box (which pixels exist). A 6% error
 * in the width estimate can only pick a smaller chip, never a clipped one.
 */
import { useI18n } from "../../i18n/useI18n";
import type { MessageKey } from "../../i18n/i18n";
import type { ModeId } from "../../game/modes";
import { planModeChip } from "./adaptive";

export default function ModeChip({
  mode,
  bandWidth,
  side,
  onOpen,
}: {
  /** The currently selected mode. */
  mode: ModeId;
  /** Width of the hero's inner row, px — `heroBandWidth(profile.box.width)`. */
  bandWidth: number;
  /** `"right"` when the mascot sits at the right end of a row layout. */
  side: "right" | "center";
  /** Opens the mode picker. */
  onOpen: () => void;
}) {
  const { t } = useI18n();
  const label = t("game.modes");
  const name = t(`mode.${mode}.name` as MessageKey);
  const plan = planModeChip({ heroWidth: bandWidth, side, name, label });

  if (!plan.visible) return null;

  /*
   * `whitespace-nowrap` stays on the button so the three parts cannot wrap into
   * each other, and `min-w-0` + `truncate` move the overflow to the *name* — the
   * only part that has a safe shorter form.
   */
  return (
    <button
      type="button"
      onClick={onOpen}
      title={label}
      aria-label={`${label}: ${name}`}
      data-mode-chip={plan.reason}
      data-mode-chip-align={plan.align}
      data-mode-chip-name={plan.nameSize}
      style={{ maxWidth: plan.maxWidth }}
      className={`press hard-shadow-sm group absolute -bottom-1 z-20 flex max-w-full items-center gap-2 border-[3px] border-jade-700 bg-jade-950/90 px-3 py-1.5 whitespace-nowrap transition-colors hover:border-tumeric-500${
        plan.align === "end" ? " right-0" : " left-1/2 -translate-x-1/2"
      }`}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-tumeric-500 transition-transform group-hover:scale-125"
        aria-hidden="true"
      />
      {plan.showLabel && (
        <span
          className="shrink-0 font-body font-extrabold tracking-[0.2em] text-jade-500 uppercase"
          style={{ fontSize: plan.labelSize }}
        >
          {label}
        </span>
      )}
      <span
        className="min-w-0 truncate font-display tracking-[0.06em] text-tumeric-400"
        style={{ fontSize: plan.nameSize }}
      >
        {name}
      </span>
    </button>
  );
}
