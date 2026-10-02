import { Tabs } from 'expo-router';
import { Icon } from '../../../components/icons';
import { useAuth } from '../../../lib/auth';
import { colors, fonts } from '../../../theme';

export default function TabLayout() {
  const { profile } = useAuth();
  const isPro = profile?.role === 'pro';

  return (
    <Tabs
      // Pros land on their dashboard; homeowners on their lawn.
      initialRouteName={isPro ? 'pro' : 'index'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Lawn', tabBarIcon: ({ color }) => <Icon name="lawn" color={color} /> }} />
      <Tabs.Screen name="forecast" options={{ title: 'Forecast', tabBarIcon: ({ color }) => <Icon name="forecast" color={color} /> }} />
      <Tabs.Screen name="book" options={{ title: 'Book', tabBarIcon: ({ color }) => <Icon name="book" color={color} /> }} />
      <Tabs.Protected guard={isPro}>
        <Tabs.Screen name="pro" options={{ title: 'Pro', tabBarIcon: ({ color }) => <Icon name="pro" color={color} /> }} />
      </Tabs.Protected>
    </Tabs>
  );
}
