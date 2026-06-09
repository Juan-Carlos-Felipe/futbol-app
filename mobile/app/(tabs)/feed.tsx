import { useMemo, useState } from 'react'
import type * as React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMyActivityFeed, FeedEvent } from '@/hooks/useActivityFeed'
import { useProfile } from '@/hooks/useProfile'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { theme } from '@/lib/theme'

export default function FeedScreen() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const { data: events, isLoading, refetch, isRefetching } = useMyActivityFeed()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const teams = useMemo(() => {
    const map = new Map<string, string>()
    events?.forEach((e) => {
      if (e.team_id && e.teams?.name) map.set(e.team_id, e.teams.name)
    })
    return Array.from(map.entries())
  }, [events])

  const filteredEvents = useMemo(() => {
    if (!selectedTeamId) return events ?? []
    return (events ?? []).filter((e) => e.team_id === selectedTeamId)
  }, [events, selectedTeamId])

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.greeting}>Hola, {profile?.display_name || 'Jugador'} 👋</Text>
        <Text style={styles.headerTitle}>LISTO PARA JUGAR?</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 Racha de 3 partidos</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} bounces={false}>
        {/* Next Match Card */}
        <View style={styles.nextMatchContainer}>
          <View style={styles.nextMatchCard}>
            <Text style={styles.nextMatchLabel}>PRÓXIMO PARTIDO</Text>
            <View style={styles.teamsRow}>
              <Text style={styles.teamName}>LOS TRONCOS</Text>
              <Text style={styles.vsLabel}>VS</Text>
              <Text style={styles.teamName}>GALÁCTICOS</Text>
            </View>
            <Text style={styles.nextMatchDate}>Mañana, 20:30 • Cancha "El Diez"</Text>
            <TouchableOpacity style={styles.viewMatchBtn}>
              <Text style={styles.viewMatchText}>Ver partido</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.feedSection}>
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>Actividad reciente</Text>
            {teams.length > 1 && (
              <TeamFilter
                teams={teams}
                selected={selectedTeamId}
                onSelect={setSelectedTeamId}
              />
            )}
          </View>

          {!events?.length ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>⚽</Text>
              <Text style={styles.emptyTitle}>Sin actividad todavía</Text>
            </View>
          ) : (
            filteredEvents.map((item) => (
              <FeedCard
                key={item.id}
                event={item}
                onPress={() => {
                  if (item.payload?.match_id) {
                    router.push(`/match/${item.payload.match_id}`)
                  }
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

function TeamFilter({
  teams,
  selected,
  onSelect,
}: {
  teams: [string, string][]
  selected: string | null
  onSelect: (teamId: string | null) => void
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
          <Text
            style={[filterStyles.chipText, selected === teamId && filterStyles.chipTextActive]}
          >
            {teamName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const filterStyles = StyleSheet.create({
  scroll: {
    marginTop: 8,
  },
  row: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.gray600,
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
})

function FeedCard({
  event,
  onPress,
}: {
  event: FeedEvent
  onPress: () => void
}): React.ReactElement | null {
  const timeAgo = formatDistanceToNow(new Date(event.created_at), {
    addSuffix: true,
    locale: es,
  })

  const isHighlight = event.type === 'match_played' || event.type === 'streak_milestone'

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTime}>{timeAgo.toUpperCase()}</Text>
        <Text style={[styles.cardTitle, isHighlight && styles.highlightText]}>
          {buildTitle(event)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function buildTitle(event: FeedEvent): string {
  const p = event.payload
  const name = p?.player_name ?? 'Un jugador'

  switch (event.type) {
    case 'match_played':
      return `${name} jugó un partido — racha de ${p?.new_streak ?? 1} seguidos`
    case 'streak_milestone':
      return `🏆 ${name} lleva ${p?.streak} partidos seguidos`
    case 'streak_broken':
      return `${name} perdió su racha`
    case 'player_joined':
      return `${name} se unió al equipo`
    case 'match_created':
      return `${name} creó un partido`
    case 'match_confirmed':
      return `Partido confirmado`
    default:
      return 'Nueva actividad'
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray50,
  },
  headerContainer: {
    backgroundColor: theme.colors.primaryDark,
    height: 180,
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  greeting: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.8,
  },
  headerTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 32,
    color: theme.colors.white,
    marginTop: 4,
  },
  streakBadge: {
    backgroundColor: theme.colors.gold,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  streakText: {
    color: '#78350f',
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
  },
  scrollContent: {
    flex: 1,
  },
  nextMatchContainer: {
    paddingHorizontal: 24,
    marginTop: -30,
  },
  nextMatchCard: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 16,
    padding: 20,
    ...theme.shadow.md,
  },
  nextMatchLabel: {
    fontFamily: theme.fonts.display,
    fontSize: 13,
    color: theme.colors.gold,
    letterSpacing: 2,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  teamName: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.white,
  },
  vsLabel: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.gold,
  },
  nextMatchDate: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.white,
    opacity: 0.7,
    marginTop: 4,
  },
  viewMatchBtn: {
    borderWidth: 1,
    borderColor: theme.colors.white,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  viewMatchText: {
    color: theme.colors.white,
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
  },
  feedSection: {
    padding: 24,
  },
  feedHeader: {
    marginBottom: 16,
  },
  feedTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.gray900,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...theme.shadow.sm,
  },
  cardContent: {
    gap: 4,
  },
  cardTime: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.gray400,
  },
  cardTitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.gray900,
  },
  highlightText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.gray400,
  },
})
