import { Stack } from 'expo-router';
import { PropertyProvider } from '../../lib/property';
import { colors, fonts } from '../../theme';

export default function AppLayout() {
  return (
    <PropertyProvider>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.ground },
          headerStyle: { backgroundColor: colors.ground },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.bodyBold },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ title: 'Account' }} />
        <Stack.Screen name="property/address" options={{ title: 'Add your property' }} />
        <Stack.Screen name="property/outline" options={{ title: 'Outline your lawn' }} />
      </Stack>
    </PropertyProvider>
  );
}
