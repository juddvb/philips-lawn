import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

  return (
    <AuthProvider>
      <RootNavigator ready={fontsLoaded || !!fontError} />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}

function RootNavigator({ ready }: { ready: boolean }) {
  const { isLoading, profile } = useAuth();

  // Keep the splash screen up until fonts and the stored session are loaded.
  if (!ready || isLoading) return null;
  SplashScreen.hide();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }}>
      <Stack.Protected guard={!!profile}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!profile}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  );
}
