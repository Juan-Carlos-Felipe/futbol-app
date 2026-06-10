// ✅ REDISEÑADO con theme.ts
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        tabBarInactiveTintColor: theme.colors.gray,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.dmSansMedium,
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: theme.colors.primaryDark,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontFamily: theme.fonts.bebas,
          fontSize: 24,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'INICIO',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => <TabIcon name="home-outline" color={color} />
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'EQUIPOS',
          tabBarLabel: 'Equipos',
          tabBarIcon: ({ color }) => <TabIcon name="shirt-outline" color={color} />
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'PARTIDOS',
          tabBarLabel: 'Partidos',
          tabBarIcon: ({ color }) => <TabIcon name="football-outline" color={color} />
        }}
      />
      <Tabs.Screen
        name="canchas"
        options={{
          title: 'CANCHAS',
          tabBarLabel: 'Canchas',
          tabBarIcon: ({ color }) => <TabIcon name="map-outline" color={color} />
        }}
      />
      <Tabs.Screen
        name="matchmaking"
        options={{
          title: 'RIVALES',
          tabBarLabel: 'Rivales',
          tabBarIcon: ({ color }) => <TabIcon name="shield-half-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PERFIL',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <TabIcon name="person-outline" color={color} />
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: any; color: string }) {
  return <Ionicons name={name} size={22} color={color} />;
}
