import { describe, expect, it } from 'vitest';
import {
  fromLocalFt,
  insertMidpoint,
  polygonAreaSqFt,
  polygonPerimeterFt,
  rectangleAround,
  removeVertex,
  toLocalFt,
} from './lawnGeometry';
import { estimateMowTime, formatMinutes } from './mowTime';

// Salem, VA (pilot area).
const SALEM = { latitude: 37.2935, longitude: -80.0548 };

describe('lawn geometry', () => {
  it('measures a 100 × 84 ft rectangle as 8,400 sq ft with 368 ft of edge', () => {
    const rect = rectangleAround(SALEM, 100, 84);
    expect(polygonAreaSqFt(rect)).toBeCloseTo(8400, -1);
    expect(polygonPerimeterFt(rect)).toBeCloseTo(368, 0);
  });

  it('gives the same area regardless of corner order direction', () => {
    const rect = rectangleAround(SALEM, 60, 40);
    expect(polygonAreaSqFt([...rect].reverse())).toBeCloseTo(polygonAreaSqFt(rect), 6);
  });

  it('round-trips local feet', () => {
    const p = fromLocalFt({ x: 123, y: -45 }, SALEM);
    const back = toLocalFt(p, SALEM);
    expect(back.x).toBeCloseTo(123, 6);
    expect(back.y).toBeCloseTo(-45, 6);
  });

  it('adding a midpoint keeps the area; removing a corner of a rectangle halves it', () => {
    const rect = rectangleAround(SALEM, 100, 50);
    const withMid = insertMidpoint(rect, 1);
    expect(withMid).toHaveLength(5);
    expect(polygonAreaSqFt(withMid)).toBeCloseTo(5000, -1);
    expect(polygonAreaSqFt(removeVertex(rect, 0))).toBeCloseTo(2500, -1);
  });

  it('never removes below a triangle', () => {
    const tri = removeVertex(rectangleAround(SALEM, 10, 10), 0);
    expect(removeVertex(tri, 0)).toHaveLength(3);
  });

  it('returns 0 for degenerate outlines', () => {
    expect(polygonAreaSqFt([SALEM, SALEM])).toBe(0);
  });
});

describe('mow time', () => {
  // Anchor: the prototype's estimate screen for 1427 Maple Ridge Rd.
  it('matches the prototype for 8,400 sq ft and ~310 ft of edges', () => {
    expect(estimateMowTime(8400, 310, 'push')).toEqual({ mowMin: 46, trimMin: 12, cleanupMin: 5, totalMin: 63 });
    expect(estimateMowTime(8400, 310, 'rider').mowMin).toBe(21);
    expect(estimateMowTime(8400, 310, 'zeroTurn').mowMin).toBe(13);
  });

  it('is zero for an empty lawn and grows with area', () => {
    expect(estimateMowTime(0, 0, 'rider').totalMin).toBe(0);
    expect(estimateMowTime(20000, 500, 'rider').totalMin).toBeGreaterThan(estimateMowTime(8400, 310, 'rider').totalMin);
  });

  it('formats minutes', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(60)).toBe('1 hr');
    expect(formatMinutes(65)).toBe('1 hr 5 min');
  });
});
