/**
 * Time to mow a lawn by mower type, plus trim/edge and cleanup.
 *
 * Heuristic, calibrated to the prototype's estimate screen (8,400 sq ft, ~310 ft of edges:
 * push 46 min, rider 21, zero-turn 13, trim & edge 12, cleanup 5). Tune against pros'
 * actual job times once visits are logged. Pure TypeScript, no React or network.
 */

export type MowerId = 'push' | 'rider' | 'zeroTurn';

export interface Mower {
  id: MowerId;
  name: string;
  deckIn: number;
  /**
   * Effective forward speed in ft/min after overlap, turns and obstacles.
   * Much lower than top speed: most time on a residential lawn is spent turning.
   */
  effectiveFtPerMin: number;
}

export const MOWERS: Record<MowerId, Mower> = {
  push: { id: 'push', name: 'Push', deckIn: 21, effectiveFtPerMin: 105 },
  rider: { id: 'rider', name: 'Rider', deckIn: 42, effectiveFtPerMin: 115 },
  zeroTurn: { id: 'zeroTurn', name: 'Zero-turn', deckIn: 60, effectiveFtPerMin: 130 },
};

/** String trimmer + edger pace along lawn edges. */
const TRIM_FT_PER_MIN = 26;
/** Blowing clippings off drives and walks: fixed setup plus a little per area. */
const CLEANUP_BASE_MIN = 3;
const CLEANUP_SQFT_PER_MIN = 4000;

export interface MowTimeEstimate {
  mowMin: number;
  trimMin: number;
  cleanupMin: number;
  totalMin: number;
}

export function estimateMowTime(areaSqFt: number, edgeFt: number, mower: MowerId | Mower): MowTimeEstimate {
  const m = typeof mower === 'string' ? MOWERS[mower] : mower;
  if (areaSqFt <= 0) return { mowMin: 0, trimMin: 0, cleanupMin: 0, totalMin: 0 };
  const sqFtPerMin = (m.deckIn / 12) * m.effectiveFtPerMin;
  const mowMin = Math.round(areaSqFt / sqFtPerMin);
  const trimMin = Math.round(edgeFt / TRIM_FT_PER_MIN);
  const cleanupMin = Math.round(CLEANUP_BASE_MIN + areaSqFt / CLEANUP_SQFT_PER_MIN);
  return { mowMin, trimMin, cleanupMin, totalMin: mowMin + trimMin + cleanupMin };
}

/** "1 hr 5 min", "45 min". */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
