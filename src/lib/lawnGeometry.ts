/**
 * Lawn outline geometry: area and edge length of zone polygons in square feet / feet.
 *
 * Pure TypeScript (no React, no network) so the same math can run in a backend function.
 * Lawns are small, so a local flat projection around the polygon's mean latitude is accurate
 * to well under 1%, which is far below the error in where a homeowner drags a corner.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Local east/north offset in feet from an origin. */
export interface PointFt {
  x: number;
  y: number;
}

const EARTH_RADIUS_M = 6_371_008.8;
const FT_PER_M = 3.28084;
const RAD = Math.PI / 180;

/** Project a point to feet east (x) and north (y) of `origin`. */
export function toLocalFt(p: LatLng, origin: LatLng): PointFt {
  const cosLat = Math.cos(origin.latitude * RAD);
  return {
    x: (p.longitude - origin.longitude) * RAD * EARTH_RADIUS_M * cosLat * FT_PER_M,
    y: (p.latitude - origin.latitude) * RAD * EARTH_RADIUS_M * FT_PER_M,
  };
}

/** Inverse of toLocalFt. */
export function fromLocalFt(p: PointFt, origin: LatLng): LatLng {
  const cosLat = Math.cos(origin.latitude * RAD);
  return {
    latitude: origin.latitude + p.y / FT_PER_M / EARTH_RADIUS_M / RAD,
    longitude: origin.longitude + p.x / FT_PER_M / EARTH_RADIUS_M / cosLat / RAD,
  };
}

export function centroid(points: LatLng[]): LatLng {
  const n = points.length || 1;
  return {
    latitude: points.reduce((s, p) => s + p.latitude, 0) / n,
    longitude: points.reduce((s, p) => s + p.longitude, 0) / n,
  };
}

/** Area of a simple polygon in square feet (shoelace in local feet). Order and closure don't matter. */
export function polygonAreaSqFt(points: LatLng[]): number {
  if (points.length < 3) return 0;
  const origin = centroid(points);
  const ft = points.map((p) => toLocalFt(p, origin));
  let twice = 0;
  for (let i = 0; i < ft.length; i++) {
    const a = ft[i];
    const b = ft[(i + 1) % ft.length];
    twice += a.x * b.y - b.x * a.y;
  }
  return Math.abs(twice) / 2;
}

/** Perimeter of a closed polygon in feet. Used as a stand-in for edges to trim. */
export function polygonPerimeterFt(points: LatLng[]): number {
  if (points.length < 2) return 0;
  const origin = centroid(points);
  const ft = points.map((p) => toLocalFt(p, origin));
  let total = 0;
  for (let i = 0; i < ft.length; i++) {
    const a = ft[i];
    const b = ft[(i + 1) % ft.length];
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

/** Axis-aligned rectangle of `widthFt` × `depthFt` centered on `center`, as 4 corners (NW, NE, SE, SW). */
export function rectangleAround(center: LatLng, widthFt: number, depthFt: number): LatLng[] {
  const w = widthFt / 2;
  const d = depthFt / 2;
  return [
    { x: -w, y: d },
    { x: w, y: d },
    { x: w, y: -d },
    { x: -w, y: -d },
  ].map((p) => fromLocalFt(p, center));
}

/** Insert a new corner halfway along the edge that starts at `index`. */
export function insertMidpoint(points: LatLng[], index: number): LatLng[] {
  const a = points[index];
  const b = points[(index + 1) % points.length];
  const mid = { latitude: (a.latitude + b.latitude) / 2, longitude: (a.longitude + b.longitude) / 2 };
  return [...points.slice(0, index + 1), mid, ...points.slice(index + 1)];
}

/** Remove a corner, keeping at least a triangle. */
export function removeVertex(points: LatLng[], index: number): LatLng[] {
  if (points.length <= 3) return points;
  return points.filter((_, i) => i !== index);
}

/** Midpoint of each edge, in edge order (edge i runs from point i to point i+1). */
export function edgeMidpoints(points: LatLng[]): LatLng[] {
  return points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    return { latitude: (a.latitude + b.latitude) / 2, longitude: (a.longitude + b.longitude) / 2 };
  });
}
