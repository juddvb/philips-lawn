import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, ComingInPhase, Header, Screen } from '../../../components/ui';
import { estimateMowTime, formatMinutes, MOWERS, type MowerId } from '../../../lib/mowTime';
import { measure, useProperty } from '../../../lib/property';
import { colors, fonts, radius, type } from '../../../theme';

export default function LawnScreen() {
  const { property, isLoading, error } = useProperty();
  const [mower, setMower] = useState<MowerId>('rider');

  if (isLoading) {
    return (
      <Screen>
        <Header account title="Your lawn" />
        <ActivityIndicator color={colors.green} />
      </Screen>
    );
  }

  if (!property || property.zones.length === 0) {
    return (
      <Screen>
        <Header account title="Let's size up your lawn." body="Add your address, then outline the grass on the satellite view. We'll measure it and estimate mow time." />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Button title="Add your property" onPress={() => router.push('/property/address')} />
        <ComingInPhase phase={3} what="Photo walk: grass type with confidence, shade per zone, slope and gate width." />
      </Screen>
    );
  }

  const totals = measure(property.zones);
  const time = estimateMowTime(totals.areaSqFt, totals.edgeFt, mower);

  return (
    <Screen>
      <Header account kicker={property.address} title="Your lawn" />

      <View style={s.hero}>
        <Text style={s.heroLabel}>Mowable area</Text>
        <Text style={s.heroNum}>
          {totals.areaSqFt.toLocaleString('en-US')} <Text style={s.heroUnit}>sq ft</Text>
        </Text>
        <Text style={s.heroLabel}>From your outline · photos will sharpen it</Text>
        <View style={s.zoneGrid}>
          {totals.zones.map((m) => (
            <View key={m.zone.key} style={s.zoneTile}>
              <Text style={s.heroLabel} numberOfLines={1}>{m.zone.name}</Text>
              <Text style={s.zoneNum}>{m.areaSqFt.toLocaleString('en-US')}</Text>
            </View>
          ))}
        </View>
      </View>

      <Card>
        <Text style={type.label}>Time to mow, by mower</Text>
        <View accessibilityRole="radiogroup" style={s.row}>
          {Object.values(MOWERS).map((m) => (
            <Chip key={m.id} label={`${m.name} · ${m.deckIn} in`} selected={mower === m.id} onPress={() => setMower(m.id)} />
          ))}
        </View>
        <View style={s.time}>
          <View>
            <Text style={s.timeLabel}>Mow + trim + blow</Text>
            <Text style={s.timeNum}>{formatMinutes(time.totalMin)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text style={s.timeLabel}>Mowing {time.mowMin} min</Text>
            <Text style={s.timeLabel}>Trim & edge {time.trimMin} min</Text>
            <Text style={s.timeLabel}>Cleanup {time.cleanupMin} min</Text>
          </View>
        </View>
        <Text style={type.small}>Trim time assumes every outline edge (~{totals.edgeFt.toLocaleString('en-US')} ft) gets trimmed.</Text>
      </Card>

      <Button title="Edit outline" variant="secondary" onPress={() => router.push('/property/outline')} />
      <Button title="Change address" variant="quiet" onPress={() => router.push('/property/address')} />

      <ComingInPhase phase={3} what="Photo walk: grass type with confidence, shade per zone, slope and gate width (and which decks fit through it)." />
    </Screen>
  );
}

const s = StyleSheet.create({
  error: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.error },
  hero: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: 18, gap: 4 },
  heroLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.onInkMuted },
  heroNum: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, color: colors.surface },
  heroUnit: { fontSize: 20 },
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  zoneTile: { flexGrow: 1, flexBasis: '30%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, gap: 2 },
  zoneNum: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.greenTint, borderRadius: radius.card, padding: 14 },
  timeLabel: { fontFamily: fonts.body, fontSize: 12, color: '#2D4A35' },
  timeNum: { fontFamily: fonts.display, fontSize: 32, color: colors.greenDark },
});
