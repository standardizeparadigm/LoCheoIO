/**
 * The rings and glow around the mascot.
 *
 * v1.1.7 had a single dashed circle spinning at 14s and a soft pulse. One
 * ring at one speed reads as a loading spinner, and at 14s it was fast enough
 * to be distracting while reading the menu.
 *
 * This draws three rings on 18s / 26s / 34s — durations with no small common
 * multiple, so the arrangement almost never repeats visually — plus a slow
 * breathing glow behind the jar. The rings are decorative: `aria-hidden`,
 * `pointer-events-none`, and they sit at negative z so they can never cover
 * the mascot's face.
 *
 * Sized entirely in `em`, so the caller sets one font-size and the whole halo
 * scales with the jar.
 */
export function JarHalo({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}>
      {/* soft light behind the ceramic */}
      <span className="halo-glow absolute h-[86%] w-[86%] rounded-full bg-[radial-gradient(circle,rgba(245,168,28,0.28),rgba(245,168,28,0.06)_45%,transparent_70%)]" />

      {/* three rings, three speeds */}
      <svg viewBox="0 0 200 200" className="absolute h-full w-full overflow-visible">
        <g className="halo-ring-1">
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="rgba(245,168,28,0.34)"
            strokeWidth="1.4"
            className="halo-arc"
          />
        </g>
        <g className="halo-ring-2">
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="rgba(182,224,122,0.24)"
            strokeWidth="1"
            className="halo-arc"
          />
        </g>
        <g className="halo-ring-3">
          <circle cx="100" cy="100" r="64" fill="none" stroke="rgba(157,107,255,0.18)" strokeWidth="1" strokeDasharray="1 11" />
          {/* two satellites, so the rotation is legible without a solid line */}
          <circle cx="100" cy="36" r="2.6" fill="rgba(245,168,28,0.75)" />
          <circle cx="164" cy="100" r="2" fill="rgba(182,224,122,0.6)" />
        </g>
      </svg>
    </div>
  );
}
