import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Screen } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { type } from '../../theme';

export default function AccountScreen() {
  const { profile, isDemo, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <Card>
        <Row label="Name" value={profile?.fullName || '—'} />
        {profile?.email ? <Row label="Email" value={profile.email} /> : null}
        <Row label="Account type" value={profile?.role === 'pro' ? 'Lawn pro' : 'Homeowner'} />
        {isDemo ? <Text style={type.small}>Demo mode: nothing is saved. Add Supabase keys to .env to sign in for real.</Text> : null}
      </Card>
      <Button
        title="Sign out"
        variant="secondary"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await signOut();
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={type.small}>{label}</Text>
      <Text style={type.label}>{value}</Text>
    </View>
  );
}
