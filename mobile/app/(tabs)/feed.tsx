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
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default function FeedScreen() {
  const router = useRouter()
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
        <ActivityIndicator color="#00C853" size="large" />
      </View>
    )
  }

  if (!events?.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>⚽</Text>
        <Text style={styles.emptyTitle}>Sin actividad todavía</Text>
        <Text style={styles.emptySubtitle}>
          Cuando tu equipo juegue partidos o se unan jugadores, aparecerá aquí.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.header}>Actividad</Text>
        {teams.length > 1 && (
          <TeamFilter
            teams={teams}
            selected={selectedTeamId}
            onSelect={setSelectedTeamId}
          />
        )}
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
                router.push(`/match/${item.payload.match_id}`)
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
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 52,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipActive: {
    backgroundColor: '#00C853',
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#00C853',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
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
})

// ─── Tarjeta de evento ────────────────────────────────────
function FeedCard({
  event,
  onPress,
}: {
  event: FeedEvent
  onPress: () => void
}): React.ReactElement | null {
  const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.match_played
  const hasMatchId = Boolean(event.payload?.match_id)
  const timeAgo = formatDistanceToNow(new Date(event.created_at), {
    addSuffix: true,
    locale: es,
  })

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={hasMatchId ? 0.7 : 1}
    >
      {/* Icono del evento */}
      <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>

      {/* Contenido */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{buildTitle(event)}</Text>
        <View style={styles.metaRow}>
          {event.teams?.name && (
            <Text style={styles.teamTag}>{event.teams.name}</Text>
          )}
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>
      </View>

      {/* Flecha si es navegable */}
      {hasMatchId && (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  )
}

// ─── Configuración visual por tipo de evento ─────────────
const EVENT_CONFIG: Record<string, { icon: string; bg: string }> = {
  match_played:     { icon: '⚽', bg: '#0A2A15' },
  streak_milestone: { icon: '🔥', bg: '#2A1A00' },
  streak_broken:    { icon: '💔', bg: '#2A0A0A' },
  player_joined:    { icon: '👋', bg: '#0A1A2A' },
  match_created:    { icon: '📅', bg: '#1A0A2A' },
  match_confirmed:  { icon: '✅', bg: '#0A2A15' },
}

// ─── Construir texto del evento ───────────────────────────
function buildTitle(event: FeedEvent): string {
  const p = event.payload
  const name = p?.player_name ?? 'Un jugador'

  switch (event.type) {
    case 'match_played':
      return `${name} jugó un partido — racha de ${p?.new_streak ?? 1} seguidos`

    case 'streak_milestone':
      return `🏆 ${name} lleva ${p?.streak} partidos seguidos sin fallar`

    case 'streak_broken':
      return `${name} no pudo ir — su racha se reinicia`

    case 'player_joined':
      return `${name} se unió al equipo`

    case 'match_created': {
      const date = p?.scheduled_at
        ? formatDistanceToNow(new Date(p.scheduled_at as string), { addSuffix: true, locale: es })
        : ''
      return `${name} creó un partido${date ? ` — ${date}` : ''}`
    }

    case 'match_confirmed':
      return `Partido confirmado con rival`

    default:
      return 'Nueva actividad en el equipo'
  }
}

// ─── Estilos ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  topSection: {
    flexShrink: 0,
  },
  listFlex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    padding: 32,
    gap: 12,
  },
  header: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 0,
  },
  separator: {
    height: 8,
  },

  // Empty state
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Card
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 20,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamTag: {
    color: '#00C853',
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    color: '#555',
    fontSize: 12,
  },
  chevron: {
    color: '#444',
    fontSize: 22,
    fontWeight: '300',
  },
})
