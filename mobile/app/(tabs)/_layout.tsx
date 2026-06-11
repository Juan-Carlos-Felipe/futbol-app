import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radii } from '@/lib/theme';

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
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 64 + bottomInset,
            paddingBottom: bottomInset + 6,
            paddingTop: 6,
            marginHorizontal: 14,
            marginBottom: Platform.OS === 'android' ? 6 : 0,
            borderRadius: radii.xl,
            position: 'absolute',
          },
          tabBarItemStyle: { borderRadius: 14, minWidth: 0 },
          tabBarLabelStyle: { fontFamily: font.semiBold, fontSize: 9 },
          tabBarIconStyle: { marginBottom: -2 },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSubtle,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.white,
          headerTitleStyle: { fontFamily: font.bold },
        };
      }}
    />
  );
}
