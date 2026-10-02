/**
 * Lawn growth projection.
 *
 * Projects grass height day by day from the last cut, using grass type,
 * temperature, recent rain and sun hours, then finds the first day the
 * grass reaches the homeowner's "mow at" height.
 *
 * This is a first-pass heuristic model, not agronomy. The coefficients in
 * GRASS_TYPES are starting guesses and should be calibrated against real
 * after-mow photos once the app has data (see docs/SPEC.md, "Model calibration").
 */

export type GrassTypeId = 'tallFescue' | 'kentuckyBluegrass' | 'bermuda' | 'zoysia';

export interface GrassType {
  id: GrassTypeId;
  name: string;
  season: 'cool' | 'warm';
  /** Daily high (°F) where growth peaks. */
  optimalTempF: number;
  /** Peak growth in inches/day under ideal temp, water and full sun. */
  baseGrowthInPerDay: number;
  /** Recommended cut height range (inches). */
  cutRangeIn: [number, number];
  /** Recommended cut height for spring/fall. */
  recommendedCutIn: number;
}

export const GRASS_TYPES: Record<GrassTypeId, GrassType> = {
  tallFescue: {
    id: 'tallFescue', name: 'Tall fescue', season: 'cool',
    optimalTempF: 68, baseGrowthInPerDay: 0.27, cutRangeIn: [3, 4], recommendedCutIn: 3.5,
  },
  kentuckyBluegrass: {
    id: 'kentuckyBluegrass', name: 'Kentucky bluegrass', season: 'cool',
    optimalTempF: 66, baseGrowthInPerDay: 0.23, cutRangeIn: [2.5, 3.5], recommendedCutIn: 3,
  },
  bermuda: {
    id: 'bermuda', name: 'Bermuda', season: 'warm',
    optimalTempF: 86, baseGrowthInPerDay: 0.3, cutRangeIn: [1, 2], recommendedCutIn: 1.5,
  },
  zoysia: {
    id: 'zoysia', name: 'Zoysia', season: 'warm',
    optimalTempF: 84, baseGrowthInPerDay: 0.16, cutRangeIn: [1.5, 2.5], recommendedCutIn: 2,
  },
};

export interface WeatherDay {
  /** ISO date, e.g. "2026-10-09". */
  date: string;
  highF: number;
  rainIn: number;
  /** Hours of direct sun in the open (before yard shade is applied). */
  sunHours: number;
}

export interface LawnZone {
  name: string;
  areaSqFt: number;
  /** Fraction of open-sky sun this zone receives (1 = full sun, 0.5 = half shaded). */
  sunFraction: number;
}

export interface ProjectionInput {
  grass: GrassTypeId;
  /** Height the lawn is cut to (inches). Also the starting height after the last cut. */
  cutHeightIn: number;
  /**
   * Mow when height reaches cutHeight × this ratio.
   * 1.5 = remove one third of the blade (healthy default); 1.33 = remove a quarter (tidier).
   */
  mowAtRatio: number;
  /** Weather starting the day after the last cut. */
  weather: WeatherDay[];
  zones: LawnZone[];
  /**
   * Share of total lawn area that must reach the mow-at height before a mow is due.
   * Default 0.5: mow once most of the lawn needs it; slower shady zones get cut along.
   */
  dueWhenAreaShare?: number;
}

export interface ZoneProjection {
  zone: LawnZone;
  heightsIn: number[];
  /** Index into weather[] of the first day this zone reaches mow height, or null. */
  dueIndex: number | null;
}

export interface Projection {
  mowAtHeightIn: number;
  /** Index into weather[] of the projected mow day, or null if not within the window. */
  dueIndex: number | null;
  dueDate: string | null;
  zones: ZoneProjection[];
  cutAdvice: CutAdvice;
}

export interface CutAdvice {
  status: 'recommended' | 'inRange' | 'tooLow' | 'tooHigh';
  message: string;
}

const RAIN_LOOKBACK_DAYS = 3;
const RAIN_SATURATION_IN = 0.75;
const FULL_SUN_HOURS = 7;

/** 0.15–1: how close the day's high is to the grass's ideal. */
export function temperatureFactor(highF: number, optimalTempF: number): number {
  return Math.max(0.15, 1 - Math.abs(highF - optimalTempF) / 22);
}

/** 0.75–1.25: more rain over the previous few days speeds growth. */
export function moistureFactor(recentRainIn: number): number {
  return 0.75 + 0.5 * Math.min(1, recentRainIn / RAIN_SATURATION_IN);
}

/** 0.55–1: shade slows growth but never stops it. */
export function sunFactor(effectiveSunHours: number): number {
  return 0.55 + 0.45 * Math.min(1, effectiveSunHours / FULL_SUN_HOURS);
}

export function adviseCutHeight(grass: GrassTypeId, cutHeightIn: number): CutAdvice {
  const g = GRASS_TYPES[grass];
  const [lo, hi] = g.cutRangeIn;
  if (cutHeightIn < lo) {
    return { status: 'tooLow', message: `Below the ${lo}–${hi} in range for ${g.name.toLowerCase()}. Expect more mows, weeds and stress.` };
  }
  if (cutHeightIn > hi) {
    return { status: 'tooHigh', message: `Above the ${lo}–${hi} in range for ${g.name.toLowerCase()}. Fewer mows, but it can mat down.` };
  }
  if (cutHeightIn === g.recommendedCutIn) {
    return { status: 'recommended', message: `Recommended for ${g.name.toLowerCase()}.` };
  }
  return { status: 'inRange', message: `In range. We suggest ${g.recommendedCutIn} in for ${g.name.toLowerCase()}.` };
}

export function projectGrowth(input: ProjectionInput): Projection {
  const g = GRASS_TYPES[input.grass];
  const mowAt = round2(input.cutHeightIn * input.mowAtRatio);
  const share = input.dueWhenAreaShare ?? 0.5;
  const totalArea = input.zones.reduce((s, z) => s + z.areaSqFt, 0);

  const zones: ZoneProjection[] = input.zones.map((zone) => {
    let h = input.cutHeightIn;
    let dueIndex: number | null = null;
    const heightsIn = input.weather.map((day, i) => {
      let recentRain = 0;
      for (let k = Math.max(0, i - RAIN_LOOKBACK_DAYS); k < i; k++) recentRain += input.weather[k].rainIn;
      const growth =
        g.baseGrowthInPerDay *
        temperatureFactor(day.highF, g.optimalTempF) *
        moistureFactor(recentRain) *
        sunFactor(day.sunHours * zone.sunFraction);
      h += growth;
      if (dueIndex === null && h >= mowAt) dueIndex = i;
      return round2(h);
    });
    return { zone, heightsIn, dueIndex };
  });

  // Due on the first day the zones that have reached mow height cover enough of the lawn.
  let dueIndex: number | null = null;
  for (let i = 0; i < input.weather.length && dueIndex === null; i++) {
    const readyArea = zones
      .filter((z) => z.dueIndex !== null && z.dueIndex <= i)
      .reduce((s, z) => s + z.zone.areaSqFt, 0);
    if (totalArea > 0 && readyArea / totalArea >= share) dueIndex = i;
  }

  return {
    mowAtHeightIn: mowAt,
    dueIndex,
    dueDate: dueIndex === null ? null : input.weather[dueIndex].date,
    zones,
    cutAdvice: adviseCutHeight(input.grass, input.cutHeightIn),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
