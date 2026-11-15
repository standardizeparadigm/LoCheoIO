import { useI18n } from "../../i18n/useI18n";

/** 0–100, integer; a non-finite value collapses to 0 rather than propagating. */
function clampVolume(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Level control for 0–100 values (SFX / music loudness):
 * −/+ buttons, segmented bar, numeric readout. Steps of 10, min/max clamp.
 */
export default function VolumeStepper({
  id,
  label,
  desc,
  value,
  onChange,
  step = 10,
}: {
  id: string;
  label: string;
  desc?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  const { t } = useI18n();
  /*
   * `Math.min(100, Math.max(0, …))` is a *clamp*, not a guard: `Math.round(NaN)`
   * is `NaN` and both comparisons pass it through. The result renders as
   * `aria-label="… NaN/100"` and paints zero filled segments — a control that
   * looks empty and reports a non-number.
   *
   * `settings.ts` already normalises its own values with `clampInt`, so this is
   * defence in depth rather than a live bug. It is here because the component
   * takes `value: number` from any caller, and because the shape is the same one
   * that produced nine real bugs elsewhere in this release — see
   * `docs/guides/numeric-guards.md`.
   */
  const v = clampVolume(value);
  const set = (next: number) => onChange(clampVolume(next));
  const segs = 10;
  const filled = Math.round((v / 100) * segs);

  return (
    <div className="flex w-full items-center justify-between gap-3 border-2 border-jade-800 bg-jade-900/50 px-3 py-2">
      <span className="min-w-0">
        <span id={`${id}-label`} className="block font-body text-[11px] font-extrabold tracking-[0.14em] text-clay-100 uppercase">
          {label}
        </span>
        {desc && <span className="mt-0.5 block font-body text-[10px] leading-snug text-clay-100/55">{desc}</span>}
      </span>
      <div className="flex shrink-0 items-center gap-2" role="group" aria-labelledby={`${id}-label`}>
        <button
          type="button"
          aria-label={t("settings.decrease")}
          onClick={() => set(v - step)}
          disabled={v <= 0}
          className="press flex h-8 w-8 items-center justify-center border-2 border-jade-700 bg-jade-950 text-brine-300 disabled:opacity-30"
        >
          −
        </button>
        <div className="flex items-center gap-[3px]" role="img" aria-label={`${label} ${v}/100`}>
          {Array.from({ length: segs }, (_, i) => (
            <span
              key={i}
              className={`h-4 w-2 skew-x-[-8deg] border border-jade-800 transition-colors ${
                i < filled ? "bg-brine-500" : "bg-jade-950"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={t("settings.increase")}
          onClick={() => set(v + step)}
          disabled={v >= 100}
          className="press flex h-8 w-8 items-center justify-center border-2 border-jade-700 bg-jade-950 text-brine-300 disabled:opacity-30"
        >
          +
        </button>
        <output className="w-9 text-right font-display text-[11px] text-tumeric-400 tabular-nums">{v}</output>
      </div>
    </div>
  );
}
