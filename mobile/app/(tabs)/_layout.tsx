import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '@/lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.gray100,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray400,
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Medium',
          fontSize: 11,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{ title: 'Inicio', tabBarLabel: 'Inicio', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="teams"
        options={{ title: 'Equipos', tabBarLabel: 'Equipos', tabBarIcon: ({ color }) => <TabIcon emoji="👕" color={color} /> }}
      />
      <Tabs.Screen
        name="matches"
        options={{ title: 'Partidos', tabBarLabel: 'Partidos', tabBarIcon: ({ color }) => <TabIcon emoji="⚽" color={color} /> }}
      />
      <Tabs.Screen
        name="canchas"
        options={{
          title: 'Canchas',
          tabBarLabel: 'Canchas',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏟️" color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarLabel: 'Perfil', tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, opacity: color === theme.colors.primary ? 1 : 0.5 }}>{emoji}</Text>;
}
