/* =====================================================================
   Lọ Chéo — pure gain math for the WebAudio engine (v1.1.6)

   Keeping these calculations pure makes them testable without an
   AudioContext, and pins down one real bug found during the v1.1.6 audit:
   `unlock()` used to wire the music bus at a flat 0.5, ignoring the
   player's `musicVolume` until some later setter happened to run — so the
   first run after a reload always played music louder than configured.
   ===================================================================== */

/** Base music bus level at 100% volume. */
export const MUSIC_BUS_BASE = 0.5;

/** Default master level when not muted. */
export const MASTER_GAIN = 0.85;

/** Clamp an arbitrary number into 0..1 (NaN → fallback). */
export function unit(v: unknown, fallback = 1): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
}

/**
 * Smallest gain that can be passed to `exponentialRampToValueAtTime`.
 *
 * The Web Audio spec rejects `0` there with a `RangeError` — which is exactly
 * what `sfxPeak` returns at volume 0, so a player who dragged the SFX slider to
 * zero got an exception on every sound instead of silence.
 *
 * `0.0001` is the conventional floor: it is inaudible (-80 dB) and it is what
 * the engine already ramps *to* when a sound decays, so nothing about the
 * envelope shape changes.
 */
export const FLOOR_GAIN = 0.0001;

/** A peak safe to hand to an exponential ramp: never zero, never non-finite. */
export function rampPeak(baseGain: number, volume: number): number {
  return Math.max(FLOOR_GAIN, sfxPeak(baseGain, volume));
}

/** Final music bus gain: 0 when the gate is off, else base × volume. */
export function musicBusGain(enabled: boolean, volume: number): number {
  return enabled ? MUSIC_BUS_BASE * unit(volume, 1) : 0;
}

/**
 * Final SFX peak for one sound: base gain × SFX volume (0..1).
 *
 * ROUND 6: the base gain is clamped to 0..1, not merely floored at zero.
 *
 * `Math.max(0, Infinity)` is Infinity, so `sfxPeak(Infinity, 1)` returned
 * Infinity and went straight into `GainNode.gain.value`. WebAudio does not
 * reject that — it clips to full scale and, on some implementations, latches
 * the node into a state that later ramps cannot recover, which presents as
 * "the sound effects stopped working after one loud frame" and is not
 * reproducible without the exact value.
 *
 * Clamping at 1 is also the correct *audio* answer: a peak above unity is
 * digital clipping by definition, so there is nothing to preserve above it.
 * `volume` was already going through `unit()`, which clamps — the base gain
 * simply never got the same treatment.
 */
export function sfxPeak(baseGain: number, volume: number): number {
  return unit(baseGain, 0) * unit(volume, 1);
}

/** Master gain for the muted flag. */
export function masterGain(muted: boolean): number {
  return muted ? 0 : MASTER_GAIN;
}
