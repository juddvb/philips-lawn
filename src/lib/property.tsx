import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useAuth } from './auth';
import { type LatLng, polygonAreaSqFt, polygonPerimeterFt } from './lawnGeometry';
import { supabase } from './supabase';

export interface Zone {
  /** Local key for the UI. The database assigns its own ids. */
  key: string;
  name: string;
  points: LatLng[];
  /** 1 = full sun. Set from photos in phase 3. */
  sunFraction: number;
}

export interface Property {
  id: string | null;
  address: string;
  location: LatLng;
  zones: Zone[];
}

export interface ZoneMeasure {
  zone: Zone;
  areaSqFt: number;
  edgeFt: number;
}

export function measure(zones: Zone[]): { zones: ZoneMeasure[]; areaSqFt: number; edgeFt: number } {
  const measured = zones.map((zone) => ({
    zone,
    areaSqFt: Math.round(polygonAreaSqFt(zone.points)),
    edgeFt: Math.round(polygonPerimeterFt(zone.points)),
  }));
  return {
    zones: measured,
    areaSqFt: measured.reduce((s, z) => s + z.areaSqFt, 0),
    edgeFt: measured.reduce((s, z) => s + z.edgeFt, 0),
  };
}

let keySeq = 0;
export function newZoneKey() {
  keySeq += 1;
  return `z${Date.now().toString(36)}${keySeq}`;
}

interface PropertyState {
  isLoading: boolean;
  /** The signed-in user's property (one per account for now). */
  property: Property | null;
  error: string | null;
  save(property: Property): Promise<void>;
}

const PropertyContext = createContext<PropertyState | null>(null);

export function useProperty(): PropertyState {
  const value = useContext(PropertyContext);
  if (!value) throw new Error('useProperty must be used inside <PropertyProvider>');
  return value;
}

/** Loads and saves the user's property: Supabase when signed in, device storage in demo mode. */
export function PropertyProvider({ children }: PropsWithChildren) {
  const { profile, isDemo } = useAuth();
  const demoKey = isDemo && profile ? `demo.property.${profile.role}` : null;
  // Whose property is loaded. Loading is "the current user isn't the one loaded yet".
  const owner = demoKey ?? profile?.id ?? 'none';
  const [loaded, setLoaded] = useState<{ owner: string; property: Property | null; error: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    (demoKey ? Promise.resolve(readDemo(demoKey)) : owner !== 'none' ? fetchProperty() : Promise.resolve(null))
      .then((property) => active && setLoaded({ owner, property, error: null }))
      .catch((e) => active && setLoaded({ owner, property: null, error: e instanceof Error ? e.message : 'Could not load your property.' }));
    return () => {
      active = false;
    };
  }, [owner, demoKey]);

  const save = useCallback(
    async (next: Property) => {
      if (demoKey) {
        writeDemo(demoKey, next);
        setLoaded({ owner, property: next, error: null });
        return;
      }
      const id = await saveRemote(next);
      setLoaded({ owner, property: { ...next, id }, error: null });
    },
    [demoKey, owner],
  );

  const current = loaded?.owner === owner ? loaded : null;
  const value = useMemo(
    () => ({ isLoading: !current, property: current?.property ?? null, error: current?.error ?? null, save }),
    [current, save],
  );
  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

async function fetchProperty(): Promise<Property | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('properties')
    .select('id, address, lat, lng, lawn_zones (id, name, polygon, sun_fraction, sort_order)')
    .order('created_at', { ascending: true })
    .order('sort_order', { referencedTable: 'lawn_zones', ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    address: data.address,
    location: { latitude: data.lat, longitude: data.lng },
    zones: (data.lawn_zones ?? []).map((z: { id: string; name: string; polygon: LatLng[]; sun_fraction: number }) => ({
      key: z.id,
      name: z.name,
      points: z.polygon,
      sunFraction: z.sun_fraction,
    })),
  };
}

async function saveRemote(p: Property): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { zones } = measure(p.zones);
  const { data, error } = await supabase.rpc('save_property', {
    p_property: { id: p.id, address: p.address, lat: p.location.latitude, lng: p.location.longitude },
    p_zones: zones.map((m) => ({
      name: m.zone.name,
      polygon: m.zone.points.map(({ latitude, longitude }) => ({ latitude, longitude })),
      area_sqft: m.areaSqFt,
      edge_ft: m.edgeFt,
      sun_fraction: m.zone.sunFraction,
    })),
  });
  if (error) throw error;
  return data as string;
}

function readDemo(key: string): Property | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Property) : null;
  } catch {
    return null;
  }
}

function writeDemo(key: string, p: Property) {
  try {
    localStorage.setItem(key, JSON.stringify(p));
  } catch {
    // Demo data is best-effort.
  }
}
