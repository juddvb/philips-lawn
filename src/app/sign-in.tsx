import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AuthShell, FormError } from '../components/AuthShell';
import { Button, Card, Field } from '../components/ui';
import { isSupabaseConfigured, useAuth } from '../lib/auth';
import { colors, fonts, type } from '../theme';

export default function SignInScreen() {
  const { signIn, startDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <AuthShell title="Welcome." body="Supabase isn't configured yet, so you can look around in demo mode. Nothing is saved.">
        <Card>
          <Text style={type.label}>To sign in for real</Text>
          <Text style={type.small}>Copy .env.example to .env, add your Supabase URL and publishable key, then restart the dev server.</Text>
        </Card>
        <Button title="Try it as a homeowner" onPress={() => startDemo('homeowner')} />
        <Button title="Try it as a lawn pro" variant="secondary" onPress={() => startDemo('pro')} />
      </AuthShell>
    );
  }

  const submit = async () => {
    setError(null);
    if (!email || !password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back."
      body="Sign in to see when your lawn needs mowing."
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
          <Text style={type.body}>New here?</Text>
          <Link href="/sign-up" asChild>
            <Pressable accessibilityRole="link" hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.green }}>Create an account</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
      <FormError message={error} />
      <Button title="Sign in" onPress={submit} busy={busy} />
    </AuthShell>
  );
}
