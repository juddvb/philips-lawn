import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormError } from '../../../components/AuthShell';
import { LawnMap } from '../../../components/LawnMap';
import { ZONE_COLORS } from '../../../components/LawnMap.types';
import { Button, Card, Chip, Field } from '../../../components/ui';
import { centroid, type LatLng, rectangleAround, removeVertex } from '../../../lib/lawnGeometry';
import { measure, newZoneKey, type Property, useProperty, type Zone } from '../../../lib/property';
import { colors, fonts, radius, space, type } from '../../../theme';

/** Starting outline for a new zone, in feet. Roughly a small front yard. */
const NEW_ZONE_FT = { width: 70, depth: 45 };

export default function OutlineScreen() {
  const params = useLocalSearchParams<{ address?: string; lat?: string; lng?: string }>();
  const { property, save } = useProperty();

  // A new address starts a fresh outline (keeping the property id so it's replaced, not duplicated).
  const initial = useMemo<Property | null>(() => {
    if (params.address && params.lat && params.lng) {
      const location = { latitude: Number(params.lat), longitude: Number(params.lng) };
      return {
        id: property?.id ?? null,
        address: params.address,
        location,
        zones: [newZone('Front yard', location)],
      };
    }
    return property;
    // Only on first render: later edits live in local state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [zones, setZones] = useState<Zone[]>(initial?.zones ?? []);
  const [selectedKey, setSelectedKey] = useState<string | null>(initial?.zones[0]?.key ?? null);
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapCenter = useRef<LatLng | null>(initial?.location ?? null);

  if (!initial) {
    return (
      <View style={s.empty}>
        <Text style={type.body}>Add your address first.</Text>
        <Button title="Add your property" onPress={() => router.replace('/property/address')} />
      </View>
    );
  }

  const totals = measure(zones);
  const selected = zones.find((z) => z.key === selectedKey) ?? null;
  const selectedMeasure = totals.zones.find((m) => m.zone.key === selectedKey);

  const updateZone = (key: string, patch: Partial<Zone>) =>
    setZones((zs) => zs.map((z) => (z.key === key ? { ...z, ...patch } : z)));

  const selectZone = (key: string) => {
    setSelectedKey(key);
    setSelectedVertex(null);
  };

  const addZone = () => {
    const z = newZone(`Zone ${zones.length + 1}`, mapCenter.current ?? initial.location);
    setZones((zs) => [...zs, z]);
    selectZone(z.key);
  };

  const moveSelectedToCenter = () => {
    if (!selected || !mapCenter.current) return;
    const from = centroid(selected.points);
    const dLat = mapCenter.current.latitude - from.latitude;
    const dLng = mapCenter.current.longitude - from.longitude;
    updateZone(selected.key, { points: selected.points.map((p) => ({ latitude: p.latitude + dLat, longitude: p.longitude + dLng })) });
  };

  const removeCorner = () => {
    if (!selected || selectedVertex === null) return;
    updateZone(selected.key, { points: removeVertex(selected.points, selectedVertex) });
    setSelectedVertex(null);
  };

  const deleteZone = () => {
    if (!selected || zones.length <= 1) return;
    const rest = zones.filter((z) => z.key !== selected.key);
    setZones(rest);
    selectZone(rest[0].key);
  };

  const onSave = async () => {
    setError(null);
    const named = zones.map((z, i) => ({ ...z, name: z.name.trim() || `Zone ${i + 1}` }));
    setBusy(true);
    try {
      await save({ ...initial, zones: named });
      router.dismissTo('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your lawn.');
      setBusy(false);
    }
  };

  return (
    <View style={s.screen}>
      <View style={s.map}>
        <LawnMap
          center={initial.location}
          zones={zones}
          selectedKey={selectedKey}
          selectedVertex={selectedVertex}
          onSelectZone={selectZone}
          onSelectVertex={setSelectedVertex}
          onChangePoints={(key, points) => updateZone(key, { points })}
          onCenterChange={(c) => (mapCenter.current = c)}
        />
        <View pointerEvents="none" style={s.crosshair}>
          <View style={s.crossH} />
          <View style={s.crossV} />
        </View>
        <View pointerEvents="none" style={s.hint}>
          <Text style={s.hintText}>Drag corners · tap + to add one</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.panel} keyboardShouldPersistTaps="handled">
        <View style={s.totals}>
          <View style={{ flex: 1 }}>
            <Text style={type.small}>Grass outlined</Text>
            <Text style={type.stat}>{totals.areaSqFt.toLocaleString('en-US')} sq ft</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={type.small}>Edges to trim</Text>
            <Text style={s.edge}>~{totals.edgeFt.toLocaleString('en-US')} ft</Text>
          </View>
        </View>

        <View style={s.chips}>
          {zones.map((z, i) => (
            <Chip key={z.key} label={`${z.name || `Zone ${i + 1}`}`} selected={z.key === selectedKey} onPress={() => selectZone(z.key)} />
          ))}
          <Chip label="+ Add zone" selected={false} onPress={addZone} />
        </View>

        {selected ? (
          <Card>
            <View style={s.zoneHead}>
              <View style={[s.swatch, { backgroundColor: ZONE_COLORS[zones.indexOf(selected) % ZONE_COLORS.length] }]} />
              <Text style={type.label}>
                {selectedMeasure?.areaSqFt.toLocaleString('en-US')} sq ft · {selected.points.length} corners
              </Text>
            </View>
            <Field label="Zone name" value={selected.name} onChangeText={(name) => updateZone(selected.key, { name })} placeholder="Front yard" />
            <View style={s.chips}>
              <Chip label="Move to crosshair" selected={false} onPress={moveSelectedToCenter} />
              {selectedVertex !== null && selected.points.length > 3 ? (
                <Chip label={`Remove corner ${selectedVertex + 1}`} selected={false} onPress={removeCorner} />
              ) : null}
              {zones.length > 1 ? <Chip label="Delete zone" selected={false} onPress={deleteZone} /> : null}
            </View>
          </Card>
        ) : null}

        <Text style={type.small}>
          Outline only the grass: leave out the house, driveway, beds and patios. Split it into zones where sun or use differs (front, back, a shady side).
        </Text>
      </ScrollView>

      <View style={s.footer}>
        <FormError message={error} />
        <Button title="Save my lawn" onPress={onSave} busy={busy} disabled={totals.areaSqFt === 0} />
      </View>
    </View>
  );
}

function newZone(name: string, at: LatLng): Zone {
  return { key: newZoneKey(), name, points: rectangleAround(at, NEW_ZONE_FT.width, NEW_ZONE_FT.depth), sunFraction: 1 };
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  empty: { flex: 1, padding: space.xl, gap: space.md, justifyContent: 'center' },
  map: { height: 340, backgroundColor: '#5E7A4E' },
  crosshair: { position: 'absolute', left: '50%', top: '50%', width: 24, height: 24, marginLeft: -12, marginTop: -12, alignItems: 'center', justifyContent: 'center' },
  crossH: { position: 'absolute', width: 24, height: 2, backgroundColor: colors.surface },
  crossV: { position: 'absolute', width: 2, height: 24, backgroundColor: colors.surface },
  hint: { position: 'absolute', left: 12, bottom: 12, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: 'rgba(20,34,26,0.82)' },
  hintText: { color: colors.surface, fontFamily: fonts.bodySemi, fontSize: 12 },
  panel: { padding: space.xl, gap: 14 },
  totals: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  edge: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zoneHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, borderColor: colors.ink },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.xl, gap: 10, borderTopWidth: 1, borderTopColor: colors.line },
});
