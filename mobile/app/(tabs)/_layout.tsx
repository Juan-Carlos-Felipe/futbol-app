import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_OPTIONS = {
  canchas: {
    title: 'Canchas',
    tabBarLabel: 'Cancha',
    icon: 'location-outline',
  },
  feed: {
    title: 'Inicio',
    tabBarLabel: 'Inicio',
    icon: 'home-outline',
  },
  matches: {
    title: 'Partidos',
    tabBarLabel: 'Part.',
    icon: 'football-outline',
  },
  matchmaking: {
    title: 'Rivales',
    tabBarLabel: 'Rival',
    icon: 'shield-half-outline',
  },
  profile: {
    title: 'Perfil',
    tabBarLabel: 'Yo',
    icon: 'person-outline',
  },
  teams: {
    title: 'Equipos',
    tabBarLabel: 'Equipos',
    icon: 'shirt-outline',
  },
} as const;

type TabRouteName = keyof typeof TAB_OPTIONS;

function getTabOptions(routeName: string) {
  return TAB_OPTIONS[routeName as TabRouteName] ?? TAB_OPTIONS.feed;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 0);

  return (
    <Tabs
      initialRouteName="feed"
      screenOptions={({ route }) => {
        const options = getTabOptions(route.name);

        return {
          title: options.title,
          tabBarLabel: options.tabBarLabel,
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name={options.icon} size={19} color={color} />
          ),
          tabBarStyle: {
            backgroundColor: '#0f1117',
            borderTopColor: '#1a1d27',
            height: 64 + bottomInset,
            paddingBottom: bottomInset + 6,
            paddingTop: 6,
          },
          tabBarItemStyle: { borderRadius: 10, minWidth: 0 },
          tabBarLabelStyle: { fontSize: 9, fontWeight: '700' },
          tabBarIconStyle: { marginBottom: -2 },
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#888',
          headerStyle: { backgroundColor: '#0f1117' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        };
      }}
    />
  );
}
