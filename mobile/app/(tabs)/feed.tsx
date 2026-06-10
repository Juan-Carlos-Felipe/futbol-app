import { useEffect, useMemo, useState } from 'react';
import type * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import AvatarPlaceholder from '@/components/avatar/AvatarPlaceholder';
import AvatarPreview from '@/components/avatar/AvatarPreview';
import AvatarSetup from '@/components/avatar/AvatarSetup';
import { useMyActivityFeed, type FeedEvent } from '@/hooks/useActivityFeed';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_TEAM_COLOR, loadAvatarConfig, type AvatarConfig } from '@/lib/avatar';

export default function FeedScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: events, isLoading, refetch, isRefetching } = useMyActivityFeed();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [showAvatarSetup, setShowAvatarSetup] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!userId) {
      setAvatarConfig(null);
      return;
    }

    loadAvatarConfig(userId).then((config) => {
      if (mounted) setAvatarConfig(config);
    });

    return () => {
      mounted = false;
    };
  }, [userId]);

  const teams = useMemo(() => {
    const map = new Map<string, string>();
    events?.forEach((event) => {
      if (event.team_id && event.teams?.name) map.set(event.team_id, event.teams.name);
    });
    return Array.from(map.entries());
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!selectedTeamId) return events ?? [];
    return (events ?? []).filter((event) => event.team_id === selectedTeamId);
  }, [events, selectedTeamId]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#00C853" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AvatarHero
        avatarConfig={avatarConfig}
        userId={userId}
        onCreateAvatar={() => setShowAvatarSetup(true)}
      />

      {events?.length ? (
        <>
          <View style={styles.topSection}>
            <Text style={styles.header}>Actividad</Text>
            {teams.length > 1 ? (
              <TeamFilter teams={teams} selected={selectedTeamId} onSelect={setSelectedTeamId} />
            ) : null}
          </View>

          <FlatList
            style={styles.listFlex}
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FeedCard
                event={item}
                onPress={() => {
                  if (item.payload?.match_id) {
                    router.push(`/match/${item.payload.match_id}`);
                  }
                }}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#00C853"
              />
            }
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </>
      ) : (
        <View style={styles.centeredContent}>
          <Text style={styles.emptyIcon}>ball</Text>
          <Text style={styles.emptyTitle}>Sin actividad todavia</Text>
          <Text style={styles.emptySubtitle}>
            Cuando tu equipo juegue partidos o se unan jugadores, aparecera aqui.
          </Text>
        </View>
      )}

      <AvatarSetupModal
        visible={showAvatarSetup}
        userId={userId}
        avatarConfig={avatarConfig}
        onClose={() => setShowAvatarSetup(false)}
        onComplete={(config) => {
          setAvatarConfig(config);
          setShowAvatarSetup(false);
        }}
      />
    </View>
  );
}

function AvatarHero({
  avatarConfig,
  userId,
  onCreateAvatar,
}: {
  avatarConfig: AvatarConfig | null;
  userId: string | null;
  onCreateAvatar: () => void;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroGreeting}>Listo para jugar</Text>
        <Text style={styles.heroSubtitle}>Tu actividad, tus partidos y tu avatar en cancha.</Text>
        <Text style={styles.heroStreak}>Manten viva la racha del equipo</Text>
      </View>
      <View style={styles.heroAvatar}>
        {avatarConfig?.avatarUrl ? (
          <AvatarPreview
            avatarUrl={avatarConfig.avatarUrl}
            pose={avatarConfig.selectedPose}
            teamColor={avatarConfig.teamColor}
            width={140}
            height={200}
          />
        ) : (
          <>
            <AvatarPlaceholder size="md" teamColor={DEFAULT_TEAM_COLOR} />
            {userId ? (
              <TouchableOpacity style={styles.createAvatarButton} onPress={onCreateAvatar}>
                <Text style={styles.createAvatarText}>Crear avatar -&gt;</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function AvatarSetupModal({
  visible,
  userId,
  avatarConfig,
  onClose,
  onComplete,
}: {
  visible: boolean;
  userId: string | null;
  avatarConfig: AvatarConfig | null;
  onClose: () => void;
  onComplete: (config: AvatarConfig) => void;
}) {
  if (!userId) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <AvatarSetup userId={userId} currentConfig={avatarConfig} onComplete={onComplete} />
    </Modal>
  );
}

function TeamFilter({
  teams,
  selected,
  onSelect,
}: {
  teams: [string, string][];
  selected: string | null;
  onSelect: (teamId: string | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={filterStyles.scroll}
      contentContainerStyle={filterStyles.row}
    >
      <TouchableOpacity
        style={[filterStyles.chip, !selected && filterStyles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[filterStyles.chipText, !selected && filterStyles.chipTextActive]}>
          Todos
        </Text>
      </TouchableOpacity>

      {teams.map(([teamId, teamName]) => (
        <TouchableOpacity
          key={teamId}
          style={[filterStyles.chip, selected === teamId && filterStyles.chipActive]}
          onPress={() => onSelect(teamId)}
        >
          <Text style={[filterStyles.chipText, selected === teamId && filterStyles.chipTextActive]}>
            {teamName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function FeedCard({
  event,
  onPress,
}: {
  event: FeedEvent;
  onPress: () => void;
}): React.ReactElement | null {
  const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.match_played;
  const hasMatchId = Boolean(event.payload?.match_id);
  const timeAgo = formatDistanceToNow(new Date(event.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={hasMatchId ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{buildTitle(event)}</Text>
        <View style={styles.metaRow}>
          {event.teams?.name ? <Text style={styles.teamTag}>{event.teams.name}</Text> : null}
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
      </View>

      {hasMatchId ? <Text style={styles.chevron}>{'>'}</Text> : null}
    </TouchableOpacity>
  );
}

const EVENT_CONFIG: Record<string, { icon: string; bg: string }> = {
  match_played: { icon: 'ball', bg: '#0A2A15' },
  streak_milestone: { icon: 'fire', bg: '#2A1A00' },
  streak_broken: { icon: 'off', bg: '#2A0A0A' },
  player_joined: { icon: '+1', bg: '#0A1A2A' },
  match_created: { icon: 'cal', bg: '#1A0A2A' },
  match_confirmed: { icon: 'ok', bg: '#0A2A15' },
};

function buildTitle(event: FeedEvent): string {
  const payload = event.payload;
  const name = payload?.player_name ?? 'Un jugador';

  switch (event.type) {
    case 'match_played':
      return `${name} jugo un partido - racha de ${payload?.new_streak ?? 1} seguidos`;
    case 'streak_milestone':
      return `${name} lleva ${payload?.streak} partidos seguidos sin fallar`;
    case 'streak_broken':
      return `${name} no pudo ir - su racha se reinicia`;
    case 'player_joined':
      return `${name} se unio al equipo`;
    case 'match_created': {
      const date = payload?.scheduled_at
        ? formatDistanceToNow(new Date(payload.scheduled_at as string), {
            addSuffix: true,
            locale: es,
          })
        : '';
      return `${name} creo un partido${date ? ` - ${date}` : ''}`;
    }
    case 'match_confirmed':
      return 'Partido confirmado con rival';
    default:
      return 'Nueva actividad en el equipo';
  }
}

const filterStyles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 52,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 0,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    backgroundColor: '#1A1A1A',
    borderColor: '#2A2A2A',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: '#00C853',
    borderColor: 'transparent',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#00C853',
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  chipText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: { backgroundColor: '#0A0A0A', flex: 1 },
  topSection: { flexShrink: 0 },
  listFlex: { flex: 1 },
  centered: {
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 32,
  },
  centeredContent: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 32,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#0a3d1f',
    flexDirection: 'row',
    minHeight: 210,
    overflow: 'hidden',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  heroCopy: { flex: 1, gap: 8, zIndex: 2 },
  heroGreeting: { color: '#ffffff', fontSize: 26, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20 },
  heroStreak: { color: '#f59e0b', fontSize: 13, fontWeight: '900' },
  heroAvatar: { alignItems: 'center', justifyContent: 'center', width: 150 },
  createAvatarButton: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    marginTop: -18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  createAvatarText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  header: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  list: { flexGrow: 0, padding: 16, paddingTop: 8 },
  separator: { height: 8 },
  emptyIcon: { color: '#22c55e', fontSize: 28, fontWeight: '900' },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: '#666', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  card: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 22,
    flexShrink: 0,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  icon: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  cardContent: { flex: 1, gap: 4 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  teamTag: { color: '#00C853', fontSize: 12, fontWeight: '600' },
  timeText: { color: '#555', fontSize: 12 },
  chevron: { color: '#444', fontSize: 22, fontWeight: '300' },
});
