import { describe, expect, it } from 'vitest';
import { adviseCutHeight, projectGrowth, sunFactor, temperatureFactor } from './growth';
import { SAMPLE_WEATHER, SAMPLE_ZONES } from './sampleData';

const base = {
  grass: 'tallFescue' as const,
  cutHeightIn: 3.5,
  mowAtRatio: 1.5,
  weather: SAMPLE_WEATHER,
  zones: SAMPLE_ZONES,
};

describe('projectGrowth', () => {
  it('projects Fri Oct 9 for fescue cut to 3.5 in (matches the prototype)', () => {
    const p = projectGrowth(base);
    expect(p.mowAtHeightIn).toBe(5.25);
    expect(p.dueDate).toBe('2026-10-09');
  });

  it('a lower cut height comes due sooner', () => {
    const tall = projectGrowth(base).dueIndex!;
    const short = projectGrowth({ ...base, cutHeightIn: 2.5 }).dueIndex!;
    expect(short).toBeLessThan(tall);
  });

  it('a tidier mow-at ratio comes due sooner', () => {
    const healthy = projectGrowth(base).dueIndex!;
    const tidy = projectGrowth({ ...base, mowAtRatio: 1.33 }).dueIndex!;
    expect(tidy).toBeLessThan(healthy);
  });

  it('shaded zones grow slower than sunny ones', () => {
    const p = projectGrowth(base);
    const sunny = p.zones.find((z) => z.zone.name === 'Front')!;
    const shady = p.zones.find((z) => z.zone.name === 'Back (oak shade)')!;
    expect(shady.heightsIn.at(-1)!).toBeLessThan(sunny.heightsIn.at(-1)!);
  });

  it('warm-season grass in cool October weather may not come due', () => {
    const p = projectGrowth({ ...base, grass: 'bermuda', cutHeightIn: 1.5 });
    expect(p.dueDate).toBeNull();
  });
});

describe('factors and advice', () => {
  it('temperature factor peaks at the optimum and is floored', () => {
    expect(temperatureFactor(68, 68)).toBe(1);
    expect(temperatureFactor(20, 68)).toBe(0.15);
  });

  it('sun factor never drops below 0.55', () => {
    expect(sunFactor(0)).toBe(0.55);
    expect(sunFactor(10)).toBe(1);
  });

  it('flags cut heights outside the range for the grass', () => {
    expect(adviseCutHeight('tallFescue', 2).status).toBe('tooLow');
    expect(adviseCutHeight('tallFescue', 3.5).status).toBe('recommended');
    expect(adviseCutHeight('bermuda', 3).status).toBe('tooHigh');
  });
});
