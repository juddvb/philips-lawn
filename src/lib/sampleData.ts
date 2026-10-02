import type { LawnZone, WeatherDay } from './growth';

/**
 * Sample lawn and weather matching the clickable prototype
 * (1427 Maple Ridge Rd, Salem VA — a made-up address). Last cut Sep 30, 2026.
 * Replace with live data from Open-Meteo once the weather service exists.
 */
export const SAMPLE_ZONES: LawnZone[] = [
  { name: 'Front', areaSqFt: 3100, sunFraction: 1 },
  { name: 'Back (sunny part)', areaSqFt: 3200, sunFraction: 1 },
  { name: 'Back (oak shade)', areaSqFt: 1400, sunFraction: 0.5 },
  { name: 'Sides', areaSqFt: 700, sunFraction: 0.35 },
];

const raw: [number, number, number, number][] = [
  // [day of October, high °F, rain in, sun hours]
  [1, 70, 0, 9], [2, 68, 0, 8], [3, 71, 0, 9], [4, 64, 0.6, 2],
  [5, 60, 0.4, 3], [6, 63, 0, 7], [7, 66, 0, 8], [8, 67, 0.1, 5],
  [9, 65, 0, 8], [10, 62, 0, 9], [11, 58, 0.3, 4], [12, 56, 0, 7],
  [13, 59, 0, 8], [14, 61, 0.5, 3], [15, 57, 0.2, 4], [16, 55, 0, 8],
];

export const SAMPLE_WEATHER: WeatherDay[] = raw.map(([d, highF, rainIn, sunHours]) => ({
  date: `2026-10-${String(d).padStart(2, '0')}`,
  highF,
  rainIn,
  sunHours,
}));
