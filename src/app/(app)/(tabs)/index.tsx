import { StyleSheet, Text, View } from 'react-native';
import { Card, ComingInPhase, Header, Screen } from '../../../components/ui';
import { SAMPLE_ZONES } from '../../../lib/sampleData';
import { colors, fonts, type } from '../../../theme';

export default function LawnScreen() {
  const total = SAMPLE_ZONES.reduce((sum, z) => sum + z.areaSqFt, 0);

  return (
    <Screen>
      <Header account kicker="Sample property" title="Your lawn" body="1427 Maple Ridge Rd, Salem, VA (sample data until you add a property)." />

      <Card>
        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={type.small}>Mowable area</Text>
            <Text style={type.stat}>{total.toLocaleString('en-US')} sq ft</Text>
          </View>
          <View style={s.stat}>
            <Text style={type.small}>Zones</Text>
            <Text style={type.stat}>{SAMPLE_ZONES.length}</Text>
          </View>
        </View>
        {SAMPLE_ZONES.map((z) => (
          <View key={z.name} style={s.zone}>
            <Text style={s.zoneName}>{z.name}</Text>
            <Text style={type.small}>
              {z.areaSqFt.toLocaleString('en-US')} sq ft · {z.sunFraction === 1 ? 'full sun' : `${Math.round(z.sunFraction * 100)}% sun`}
            </Text>
          </View>
        ))}
      </Card>

      <ComingInPhase phase={2} what="Address search, satellite view, an editable lawn outline split into zones, and mow time by mower type." />
      <ComingInPhase phase={3} what="Photo walk: grass type with confidence, shade per zone, slope and gate width." />
    </Screen>
  );
}

const s = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, gap: 2 },
  zone: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 },
  zoneName: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, flexShrink: 1 },
});
