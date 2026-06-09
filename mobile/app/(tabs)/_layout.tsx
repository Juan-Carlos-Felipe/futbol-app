import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#0f1117', borderTopColor: '#1a1d27' },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#888',
        headerStyle: { backgroundColor: '#0f1117' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
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
  return <Text style={{ fontSize: 20, opacity: color === '#22c55e' ? 1 : 0.5 }}>{emoji}</Text>;
}
