import type { LatLng } from '../lib/lawnGeometry';
import type { Zone } from '../lib/property';

export interface LawnMapProps {
  /** Where the map opens. */
  center: LatLng;
  zones: Zone[];
  selectedKey: string | null;
  selectedVertex: number | null;
  onSelectZone(key: string): void;
  onSelectVertex(index: number | null): void;
  onChangePoints(key: string, points: LatLng[]): void;
  /** Reports the map's center after the user pans, so new zones land where they're looking. */
  onCenterChange(center: LatLng): void;
}

export const ZONE_COLORS = ['#E9F7D8', '#FFD25A', '#9FD3FF', '#FFB4A2', '#D7B8FF'];
