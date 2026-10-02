import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormError } from '../../../components/AuthShell';
import { Button, Card, Field, Screen } from '../../../components/ui';
import { useAuth } from '../../../lib/auth';
import { type GeocodeMatch, geocodeAddress } from '../../../lib/geocode';
import { colors, fonts, type } from '../../../theme';

/** Fictional prototype address, placed in Salem, VA. For demo mode and the web build. */
const SAMPLE: GeocodeMatch = {
  address: '1427 Maple Ridge Rd, Salem, VA 24153',
  location: { latitude: 37.2935, longitude: -80.0548 },
};

export default function AddressScreen() {
  const { isDemo } = useAuth();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<GeocodeMatch[] | null>(null);
  const pending = useRef<AbortController | null>(null);

  const search = async () => {
    if (query.trim().length < 6) return setError('Enter a street address, city and state.');
    pending.current?.abort();
    const ctrl = new AbortController();
    pending.current = ctrl;
    setError(null);
    setMatches(null);
    setBusy(true);
    try {
      const found = await geocodeAddress(query.trim(), ctrl.signal);
      if (!found.length) setError("We couldn't find that address. Check the spelling, and include the city and state.");
      setMatches(found);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error && e.message.startsWith('Address') ? e.message : "Couldn't reach the address service. Check your connection and try again.");
    } finally {
      if (pending.current === ctrl) setBusy(false);
    }
  };

  const pick = (m: GeocodeMatch) =>
    router.push({
      pathname: '/property/outline',
      params: { address: m.address, lat: String(m.location.latitude), lng: String(m.location.longitude) },
    });

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Text style={type.h1} accessibilityRole="header">Let&apos;s size up your lawn.</Text>
        <Text style={type.body}>Enter your address. We&apos;ll open the satellite view so you can outline the grass.</Text>
      </View>

      <Field
        label="Property address"
        value={query}
        onChangeText={setQuery}
        placeholder="123 Main St, Salem, VA"
        autoComplete="street-address"
        textContentType="fullStreetAddress"
        returnKeyType="search"
        onSubmitEditing={search}
      />
      <FormError message={error} />
      <Button title="Find my property" onPress={search} busy={busy} />

      {matches?.length ? (
        <View style={{ gap: 8 }}>
          <Text style={type.label}>{matches.length === 1 ? 'Is this it?' : 'Pick your address'}</Text>
          {matches.map((m) => (
            <Pressable key={m.address} accessibilityRole="button" onPress={() => pick(m)}>
              <Card style={s.match}>
                <Text style={s.matchText}>{m.address}</Text>
                <Text style={s.go}>Use this</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={type.small}>US addresses only for now. If the pin lands on the street, you can move the outline onto your yard next.</Text>

      {isDemo || __DEV__ ? (
        <Button title="Use the sample address" variant="quiet" onPress={() => pick(SAMPLE)} />
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  match: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  matchText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  go: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.green },
});
