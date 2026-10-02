import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthShell, FormError } from '../components/AuthShell';
import { Icon, type IconName } from '../components/icons';
import { Button, Card, Field } from '../components/ui';
import { type Role, useAuth } from '../lib/auth';
import { colors, fonts, radius, type } from '../theme';

const ROLES: { id: Role; icon: IconName; title: string; body: string }[] = [
  { id: 'homeowner', icon: 'lawn', title: 'I have a lawn', body: 'Know when it needs mowing and book a local pro for that day.' },
  { id: 'pro', icon: 'pro', title: 'I mow lawns', body: 'Get a schedule built from customer forecasts and bid on nearby jobs.' },
];

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [role, setRole] = useState<Role>('homeowner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) {
    return (
      <AuthShell title="Check your email." body={`We sent a confirmation link to ${sentTo}. Open it, then come back and sign in.`}>
        <Button title="Back to sign in" onPress={() => router.replace('/sign-in')} />
      </AuthShell>
    );
  }

  const submit = async () => {
    setError(null);
    if (!name.trim() || !email || !password) return setError('Fill in every field.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp({ email, password, fullName: name, role });
      if (needsConfirmation) setSentTo(email.trim());
      // Otherwise the new session flips the root guard and the app opens.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-up failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account."
      body="First, how will you use Philips Lawn?"
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
          <Text style={type.body}>Have an account?</Text>
          <Link href="/sign-in" asChild>
            <Pressable accessibilityRole="link" hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.green }}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <View accessibilityRole="radiogroup" accessibilityLabel="Account type" style={{ gap: 10 }}>
        {ROLES.map((r) => {
          const on = role === r.id;
          return (
            <Pressable key={r.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setRole(r.id)}>
              <Card style={on ? s.roleOn : undefined}>
                <View style={s.roleRow}>
                  <Icon name={r.icon} color={on ? colors.green : colors.muted} size={26} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.roleTitle}>{r.title}</Text>
                    <Text style={type.small}>{r.body}</Text>
                  </View>
                  <View style={[s.radio, on && s.radioOn]}>{on ? <View style={s.radioDot} /> : null}</View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Field
        label={role === 'pro' ? 'Business name' : 'Your name'}
        value={name}
        onChangeText={setName}
        autoComplete={role === 'pro' ? 'organization' : 'name'}
        textContentType={role === 'pro' ? 'organizationName' : 'name'}
      />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" onSubmitEditing={submit} />
      <FormError message={error} />
      <Button title="Create account" onPress={submit} busy={busy} />
    </AuthShell>
  );
}

const s = StyleSheet.create({
  roleOn: { borderColor: colors.green, borderWidth: 2, backgroundColor: colors.greenTint },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  radio: { width: 22, height: 22, borderRadius: radius.md, borderWidth: 2, borderColor: colors.control, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.green },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
});
