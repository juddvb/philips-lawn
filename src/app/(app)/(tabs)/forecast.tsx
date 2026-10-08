import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Chip, Header, Screen } from '../../../components/ui';
import { GRASS_TYPES, type GrassTypeId, type LawnZone, projectGrowth } from '../../../lib/growth';
import { measure, useProperty } from '../../../lib/property';
import { SAMPLE_WEATHER, SAMPLE_ZONES } from '../../../lib/sampleData';
import { colors, fonts, radius, type } from '../../../theme';

/**
 * First index of SAMPLE_WEATHER that is a seasonal trend rather than a forecast
 * (~7 days out from today, Oct 2). Phase 4 derives this from the live weather fetch.
 */
const TREND_START = 8;

/**
 * Growth projection on the real model with sample data (the former App.tsx starter).
 * Uses the saved outline's zones when there is one; phase 4 swaps in live weather.
 */
export default function ForecastScreen() {
  const [grass, setGrass] = useState<GrassTypeId>('tallFescue');
  const [cut, setCut] = useState(GRASS_TYPES.tallFescue.recommendedCutIn);
  const [ratio, setRatio] = useState(1.5);
  const { property } = useProperty();

  // The saved outline's zones when there is one. Sun is full until phase 3 measures shade.
  const zones = useMemo<LawnZone[]>(
    () =>
      property?.zones.length
        ? measure(property.zones).zones.map((m) => ({ name: m.zone.name, areaSqFt: m.areaSqFt, sunFraction: m.zone.sunFraction }))
        : SAMPLE_ZONES,
    [property],
  );

  const projection = useMemo(
    () => projectGrowth({ grass, cutHeightIn: cut, mowAtRatio: ratio, weather: SAMPLE_WEATHER, zones }),
    [grass, cut, ratio, zones],
  );

  const front = projection.zones[0];
  const maxH = Math.max(projection.mowAtHeightIn * 1.15, ...front.heightsIn);

  const step = (dir: number) => {
    const next = Math.round((cut + dir * 0.25) * 100) / 100;
    if (next >= 1 && next <= 4.5) setCut(next);
  };

  return (
    <Screen>
      <Header
        account
        kicker={`${property?.zones.length ? 'Your zones' : 'Sample lawn'} · sample weather · last cut Sep 30`}
        title={projection.dueDate ? `Mow by ${formatDate(projection.dueDate)}` : 'No mow needed for 16+ days'}
      />

      <Card>
        <Text style={type.label}>Projected height, {front.zone.name.toLowerCase()} (mow at {projection.mowAtHeightIn} in)</Text>
        <View style={s.chart} accessibilityLabel={`Bar chart of projected height over ${front.heightsIn.length} days`}>
          {front.heightsIn.map((h, i) => (
            <View
              key={i}
              style={[
                s.bar,
                { height: (h / maxH) * 110 },
                i === projection.dueIndex && s.barDue,
                i >= TREND_START && i !== projection.dueIndex && s.barTrend,
              ]}
            />
          ))}
        </View>
        <View style={s.legend}>
          <Text style={type.small}>Solid: forecast through {formatDate(SAMPLE_WEATHER[TREND_START - 1].date)}</Text>
          <Text style={type.small}>Faded: seasonal trend, not a forecast</Text>
        </View>
      </Card>

      <Card>
        <Text style={type.label}>Grass type</Text>
        <View style={s.row}>
          {Object.values(GRASS_TYPES).map((g) => (
            <Chip
              key={g.id}
              label={g.name}
              selected={grass === g.id}
              onPress={() => {
                setGrass(g.id);
                setCut(g.recommendedCutIn);
              }}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={type.label}>Cut it to</Text>
        <View style={s.stepper}>
          <Pressable accessibilityRole="button" accessibilityLabel="Lower cut height" onPress={() => step(-1)} style={s.stepBtn}>
            <Text style={s.stepText}>−</Text>
          </Pressable>
          <Text style={s.big}>{cut} in</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Raise cut height" onPress={() => step(1)} style={s.stepBtn}>
            <Text style={s.stepText}>+</Text>
          </Pressable>
        </View>
        <Text style={projection.cutAdvice.status.startsWith('too') ? s.warn : s.ok}>{projection.cutAdvice.message}</Text>
        <View style={s.row}>
          {[{ r: 1.5, t: 'Healthy (remove ⅓)' }, { r: 1.33, t: 'Tidy (remove ¼)' }].map((o) => (
            <Chip key={o.r} label={o.t} selected={ratio === o.r} onPress={() => setRatio(o.r)} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const s = StyleSheet.create({
  chart: { height: 110, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { flex: 1, backgroundColor: colors.green, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barDue: { backgroundColor: colors.ink },
  barTrend: { opacity: 0.45 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.control, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.ink },
  big: { fontFamily: fonts.display, fontSize: 32, color: colors.ink },
  ok: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.green },
  warn: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.warn },
});
