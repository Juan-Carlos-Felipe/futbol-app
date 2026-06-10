import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RankingRow } from '@/components/ranking/RankingRow';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { useRanking } from '@/hooks/useMatchmaking';
import { supabase } from '@/lib/supabase';

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
          <Ionicons name="time-outline" size={44} color="#9ca3af" />
          <Text style={styles.comingSoonText}>Proximamente</Text>
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
            <Ionicons name="trophy-outline" size={44} color="#9ca3af" />
            <Text style={styles.comingSoonText}>Aun no hay equipos en el ranking</Text>
          </View>
        }
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>🏆 RANKING</Text>
        <Text style={styles.subtitle}>Top equipos por ELO</Text>
        {myRanking ? (
          <View style={styles.myPositionCard}>
            <Text style={styles.myPositionText}>
              Tu posicion: #{myRanking.position.toLocaleString('es-CL')} · ELO:{' '}
              {myRanking.team.elo.toLocaleString('es-CL')}
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
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
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
  screen: { backgroundColor: '#f3f4f6', flex: 1 },
  header: {
    backgroundColor: '#0a3d1f',
    height: 180,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  backButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 48,
    width: 38,
  },
  title: { color: '#ffffff', fontSize: 32, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  myPositionCard: {
    alignSelf: 'flex-start',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  myPositionText: { color: '#78350f', fontSize: 13, fontWeight: '900' },
  tabs: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  tabButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    flex: 1,
    paddingVertical: 10,
  },
  tabButtonActive: { backgroundColor: '#16a34a' },
  tabText: { color: '#6b7280', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  tabTextActive: { color: '#ffffff' },
  listContent: { flexGrow: 1, padding: 16, paddingBottom: 28 },
  comingSoon: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  comingSoonText: { color: '#6b7280', fontSize: 16, fontWeight: '800', marginTop: 10 },
  skeletonRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonText: { flex: 1, gap: 7 },
});
