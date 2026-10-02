import { Stack } from 'expo-router';
import { colors, fonts } from '../../theme';

export default function AppLayout() {
  return (
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
    </Stack>
  );
}
