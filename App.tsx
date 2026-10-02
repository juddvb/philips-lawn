import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GRASS_TYPES, GrassTypeId, projectGrowth } from './src/lib/growth';
import { SAMPLE_WEATHER, SAMPLE_ZONES } from './src/lib/sampleData';

/**
 * Starter screen: the growth projection running on the real model with sample data.
 * Phase 1 in docs/SPEC.md replaces this with Expo Router screens under src/app/.
 */
export default function App() {
  const [grass, setGrass] = useState<GrassTypeId>('tallFescue');
  const [cut, setCut] = useState(GRASS_TYPES.tallFescue.recommendedCutIn);
  const [ratio, setRatio] = useState(1.5);

  const projection = useMemo(
    () => projectGrowth({ grass, cutHeightIn: cut, mowAtRatio: ratio, weather: SAMPLE_WEATHER, zones: SAMPLE_ZONES }),
    [grass, cut, ratio],
  );

  const front = projection.zones[0];
  const maxH = Math.max(projection.mowAtHeightIn * 1.15, ...front.heightsIn);

  const step = (dir: number) => {
    const next = Math.round((cut + dir * 0.25) * 100) / 100;
    if (next >= 1 && next <= 4.5) setCut(next);
  };

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.kicker}>Growth projection · last cut Sep 30</Text>
        <Text style={s.h1}>
          {projection.dueDate ? `Mow by ${formatDate(projection.dueDate)}` : 'No mow needed for 16+ days'}
        </Text>

        <View style={s.card}>
          <Text style={s.label}>Projected height, front yard (mow at {projection.mowAtHeightIn} in)</Text>
          <View style={s.chart}>
            {front.heightsIn.map((h, i) => (
              <View
                key={i}
                style={[
                  s.bar,
                  { height: (h / maxH) * 110 },
                  i === projection.dueIndex && s.barDue,
                  i > 7 && s.barTrend,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Grass type</Text>
          <View style={s.row}>
            {Object.values(GRASS_TYPES).map((g) => (
              <Pressable
                key={g.id}
                accessibilityRole="button"
                onPress={() => { setGrass(g.id); setCut(g.recommendedCutIn); }}
                style={[s.chip, grass === g.id && s.chipOn]}
              >
                <Text style={[s.chipText, grass === g.id && s.chipTextOn]}>{g.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Cut it to</Text>
          <View style={s.stepper}>
            <Pressable accessibilityLabel="Lower cut height" onPress={() => step(-1)} style={s.stepBtn}><Text style={s.stepText}>−</Text></Pressable>
            <Text style={s.big}>{cut} in</Text>
            <Pressable accessibilityLabel="Raise cut height" onPress={() => step(1)} style={s.stepBtn}><Text style={s.stepText}>+</Text></Pressable>
          </View>
          <Text style={projection.cutAdvice.status.startsWith('too') ? s.warn : s.ok}>{projection.cutAdvice.message}</Text>
          <View style={s.row}>
            {[{ r: 1.5, t: 'Healthy (remove ⅓)' }, { r: 1.33, t: 'Tidy (remove ¼)' }].map((o) => (
              <Pressable key={o.r} accessibilityRole="button" onPress={() => setRatio(o.r)} style={[s.chip, ratio === o.r && s.chipOn]}>
                <Text style={[s.chipText, ratio === o.r && s.chipTextOn]}>{o.t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const C = { ground: '#F5F7F2', ink: '#14221A', muted: '#55655A', green: '#2B7A3A', line: '#DCE3D5', warn: '#8A4B12' };

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ground },
  content: { padding: 20, gap: 14 },
  kicker: { fontSize: 13, color: C.muted, fontWeight: '600' },
  h1: { fontSize: 28, fontWeight: '700', color: C.ink },
  card: { backgroundColor: '#FFFFFF', borderColor: C.line, borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  label: { fontSize: 13, fontWeight: '700', color: C.ink },
  chart: { height: 110, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { flex: 1, backgroundColor: C.green, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barDue: { backgroundColor: C.ink },
  barTrend: { opacity: 0.45 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#C7D1C1', backgroundColor: '#FFFFFF' },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { fontSize: 13, fontWeight: '700', color: C.ink },
  chipTextOn: { color: '#FFFFFF' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#C7D1C1', alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 22, fontWeight: '700', color: C.ink },
  big: { fontSize: 32, fontWeight: '700', color: C.ink },
  ok: { fontSize: 12, color: C.green, fontWeight: '600' },
  warn: { fontSize: 12, color: C.warn, fontWeight: '600' },
});
