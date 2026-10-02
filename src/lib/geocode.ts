import type { LatLng } from './lawnGeometry';

/**
 * Address → coordinates via the US Census Bureau geocoder (free, no key, US addresses only).
 * It sends no CORS headers, so it works from the phone app but not the web build.
 * Swap for Google/Mapbox geocoding with autocomplete when the project picks a maps provider.
 */
export interface GeocodeMatch {
  address: string;
  location: LatLng;
}

const ENDPOINT = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

export async function geocodeAddress(address: string, signal?: AbortSignal): Promise<GeocodeMatch[]> {
  const url = `${ENDPOINT}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Address lookup failed (${res.status}).`);
  const body = (await res.json()) as CensusResponse;
  return (body.result?.addressMatches ?? []).map((m) => ({
    address: titleCase(m.matchedAddress),
    location: { latitude: m.coordinates.y, longitude: m.coordinates.x },
  }));
}

interface CensusResponse {
  result?: { addressMatches?: { matchedAddress: string; coordinates: { x: number; y: number } }[] };
}

/** "1427 MAPLE RIDGE RD, SALEM, VA, 24153" → "1427 Maple Ridge Rd, Salem, VA 24153". */
function titleCase(census: string): string {
  const parts = census.split(', ');
  const zip = parts.length >= 4 ? parts.pop() : undefined;
  const state = parts.length >= 3 ? parts.pop() : undefined;
  const words = parts.join(', ').toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
  return [words, state && zip ? `${state} ${zip}` : state].filter(Boolean).join(', ');
}
