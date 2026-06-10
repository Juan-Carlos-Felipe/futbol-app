// ✅ REDISEÑADO con theme.ts
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter, Stack } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RankingRow } from '@/components/ranking/RankingRow';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { useRanking } from '@/hooks/useMatchmaking';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type RankingTab = 'general' | 'week' | 'zone';

const TABS: Array<{ id: RankingTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'week', label: 'Esta semana' },
  { id: 'zone', label: 'Mi zona' },
];

export default function RankingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RankingTab>('general');
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const { ranking, isLoading } = useRanking(50);

  useEffect(() => {
    const fetchActiveTeam = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.user.id)
        .limit(1)
        .maybeSingle<{ team_id: string }>();

      setActiveTeamId(data?.team_id ?? null);
    };

    fetchActiveTeam();
  }, []);

  const myRanking = useMemo(() => {
    if (!activeTeamId) return null;
    const index = ranking.findIndex((team) => team.team_id === activeTeamId);
    if (index < 0) return null;
    return { position: index + 1, team: ranking[index] };
  }, [activeTeamId, ranking]);

  function renderContent() {
    if (activeTab !== 'general') {
      return (
        <View style={styles.comingSoon}>
          <Ionicons name="time-outline" size={44} color={theme.colors.gray100} />
          <Text style={styles.comingSoonText}>Próximamente</Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <FlatList
          data={Array.from({ length: 10 }, (_, index) => index)}
          keyExtractor={(item) => `ranking-skeleton-${item}`}
          renderItem={() => <RankingSkeleton />}
          contentContainerStyle={styles.listContent}
        />
      );
    }

    return (
      <FlatList
        data={ranking}
        keyExtractor={(item) => item.team_id}
        renderItem={({ item, index }) => (
          <RankingRow
            position={index + 1}
            team={item}
            isMyTeam={item.team_id === activeTeamId}
            onPress={() => router.push(`/equipo/${item.team_id}` as Href)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.comingSoon}>
            <Ionicons name="trophy-outline" size={44} color={theme.colors.gray100} />
            <Text style={styles.comingSoonText}>Aun no hay equipos en el ranking</Text>
          </View>
        }
      />
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{
        title: 'RANKING',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        ),
        headerShown: true
      }} />

      <View style={styles.header}>
        <View style={styles.headerText}>
            <Text style={styles.title}>TOP EQUIPOS</Text>
            <Text style={styles.subtitle}>Ranking basado en ELO y resultados</Text>
        </View>
        {myRanking ? (
          <View style={styles.myPositionCard}>
            <Text style={styles.myPositionText}>
              TU EQUIPO: #{myRanking.position} · ELO: {myRanking.team.elo}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {renderContent()}
    </View>
  );
}

function RankingSkeleton() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={44} height={24} borderRadius={8} />
      <SkeletonBox width={40} height={40} borderRadius={20} />
      <View style={styles.skeletonText}>
        <SkeletonBox width="70%" height={15} borderRadius={7} />
        <SkeletonBox width="42%" height={12} borderRadius={6} />
      </View>
      <SkeletonBox width={72} height={34} borderRadius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.white, flex: 1 },
  header: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerText: { marginBottom: 12 },
  title: { color: theme.colors.white, fontSize: 32, fontFamily: theme.fonts.bebas },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: theme.fonts.dmSans },
  myPositionCard: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.gold,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myPositionText: { color: theme.colors.white, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tabButton: {
    backgroundColor: theme.colors.gray100,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  tabButtonActive: { backgroundColor: theme.colors.primary },
  tabText: { color: theme.colors.gray, fontSize: 11, fontFamily: theme.fonts.dmSansBold, textAlign: 'center' },
  tabTextActive: { color: theme.colors.white },
  listContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 28 },
  comingSoon: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  comingSoonText: { color: theme.colors.gray, fontSize: 16, fontFamily: theme.fonts.dmSansBold, marginTop: 10 },
  skeletonRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonText: { flex: 1, gap: 7 },
});
