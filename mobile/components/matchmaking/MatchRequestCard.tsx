import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MatchRequest } from '@/lib/matchmaking';

type MatchRequestCardProps = {
  request: MatchRequest;
  onPress?: () => void;
};

type RequestDetail = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const LEVEL_META: Record<
  MatchRequest['level'],
  { label: string; color: string; backgroundColor: string }
> = {
  amateur: { label: 'Amateur', color: '#4b5563', backgroundColor: '#f3f4f6' },
  intermedio: { label: 'Intermedio', color: '#2563eb', backgroundColor: '#dbeafe' },
  competitivo: { label: 'Competitivo', color: '#92400e', backgroundColor: '#fef3c7' },
};

function formatPreferredDate(date: string) {
  return format(new Date(`${date}T00:00:00`), "d 'de' MMM", { locale: es });
}

function getTeamInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'E';
}

export function MatchRequestCard({ request, onPress }: MatchRequestCardProps) {
  const teamName = request.teams?.name ?? 'Equipo';
  const levelMeta = LEVEL_META[request.level];
  const stats = request.team_stats;
  const handlePress = onPress ?? (() => router.push(`/rival/${request.id}` as never));
  const details: RequestDetail[] = [];

  if (request.preferred_date) {
    details.push({
      icon: 'calendar-outline',
      label: formatPreferredDate(request.preferred_date),
    });
  }

  if (request.preferred_time) {
    details.push({ icon: 'time-outline', label: request.preferred_time });
  }

  if (request.location_text) {
    details.push({ icon: 'location-outline', label: request.location_text });
  }

  if (request.size || request.surface) {
    details.push({
      icon: 'football-outline',
      label: [request.size, request.surface].filter(Boolean).join(' · '),
    });
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.9}>
      <View style={[styles.levelBand, { backgroundColor: levelMeta.color }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getTeamInitial(teamName)}</Text>
          </View>
          <View style={styles.teamText}>
            <Text style={styles.teamName}>{teamName}</Text>
            <Text style={styles.timeText}>
              hace {formatDistanceToNow(new Date(request.created_at), { locale: es })}
            </Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: levelMeta.backgroundColor }]}>
            <Text style={[styles.levelText, { color: levelMeta.color }]}>{levelMeta.label}</Text>
          </View>
        </View>

        <Text style={styles.title}>{request.title}</Text>
        {request.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {request.description}
          </Text>
        ) : null}

        {details.length > 0 ? (
          <View style={styles.detailsRow}>
            {details.map((detail) => (
              <View key={`${detail.icon}-${detail.label}`} style={styles.detailItem}>
                <Ionicons name={detail.icon} size={14} color="#6b7280" />
                <Text style={styles.detailText}>{detail.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.bottomRow}>
          {stats ? (
            <Text style={styles.statsText}>
              {stats.wins} G · {stats.losses} P · {stats.draws} E · ELO: {stats.elo.toLocaleString('es-CL')}
            </Text>
          ) : (
            <Text style={styles.statsText}>Sin estadísticas todavía</Text>
          )}
          <TouchableOpacity style={styles.proposeButton} onPress={handlePress}>
            <Text style={styles.proposeText}>Proponer partido →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  levelBand: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  content: { padding: 14, paddingLeft: 18 },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginRight: 10,
    width: 44,
  },
  avatarText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  teamText: { flex: 1 },
  teamName: { color: '#111827', fontSize: 15, fontWeight: '800' },
  timeText: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  levelBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  levelText: { fontSize: 11, fontWeight: '800' },
  title: { color: '#111827', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  description: { color: '#6b7280', fontSize: 13, lineHeight: 18 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  detailItem: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  detailText: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  statsText: { color: '#6b7280', flex: 1, fontSize: 12, marginRight: 8 },
  proposeButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  proposeText: { color: '#2563eb', fontSize: 13, fontWeight: '800' },
});
