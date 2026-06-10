import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CreateRequestModal } from '@/components/matchmaking/CreateRequestModal';
import { MatchRequestCard } from '@/components/matchmaking/MatchRequestCard';
import { MatchRequestSkeleton } from '@/components/matchmaking/MatchRequestSkeleton';
import { useMatchRequests, useMyTeamRequests } from '@/hooks/useMatchmaking';
import type { MatchRequest, MatchRequestFilters } from '@/lib/matchmaking';
import { supabase } from '@/lib/supabase';

type BoardMode = 'search' | 'mine';

type FilterChip = {
  label: string;
  filters: MatchRequestFilters;
};

const FILTER_CHIPS: FilterChip[] = [
  { label: 'Amateur', filters: { level: 'amateur' } },
  { label: 'Intermedio', filters: { level: 'intermedio' } },
  { label: 'Competitivo', filters: { level: 'competitivo' } },
  { label: 'F5', filters: { size: 'F5' } },
  { label: 'F7', filters: { size: 'F7' } },
  { label: 'Pasto sintetico', filters: { surface: 'Pasto sintetico' } },
];

const STATUS_META: Record<
  MatchRequest['status'],
  { label: string; backgroundColor: string; color: string }
> = {
  open: { label: 'Abierto', backgroundColor: '#dbeafe', color: '#2563eb' },
  matched: { label: 'Partido acordado', backgroundColor: '#dcfce7', color: '#16a34a' },
  cancelled: { label: 'Cancelado', backgroundColor: '#fee2e2', color: '#dc2626' },
  expired: { label: 'Expirado', backgroundColor: '#f3f4f6', color: '#6b7280' },
};

function isSameFilter(current: MatchRequestFilters, next: MatchRequestFilters) {
  return (
    current.level === next.level &&
    current.size === next.size &&
    current.surface === next.surface
  );
}

export default function MatchmakingScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<BoardMode>('search');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<MatchRequestFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const { requests, isLoading, isError, refetch } = useMatchRequests(filters);
  const { requests: myRequests, isLoading: isLoadingMyRequests } =
    useMyTeamRequests(activeTeamId);

  useEffect(() => {
    const fetchActiveTeam = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.user.id)
        .limit(1)
        .single<{ team_id: string }>();

      if (data) setActiveTeamId(data.team_id);
    };

    fetchActiveTeam();
  }, []);

  const visibleRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return requests;
    }

    return requests.filter((request) =>
      request.title.toLowerCase().includes(normalizedQuery)
    );
  }, [query, requests]);

  function openCreateModal() {
    if (!activeTeamId) {
      Alert.alert('Sin equipo activo', 'Unete o crea un equipo para publicar anuncios.');
      return;
    }

    setShowCreateModal(true);
  }

  function renderSearchContent() {
    if (isError) {
      return (
        <View style={styles.centered}>
          <Ionicons name="wifi-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Error al cargar anuncios</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => refetch()}>
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isLoading) {
      return (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => <MatchRequestSkeleton />}
          contentContainerStyle={styles.listContent}
        />
      );
    }

    if (visibleRequests.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons name="shield-outline" size={52} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No hay equipos buscando rival</Text>
          <Text style={styles.emptySubtitle}>
            Publica un anuncio para que otros equipos puedan encontrarte.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={openCreateModal}>
            <Text style={styles.primaryButtonText}>Crear anuncio</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={visibleRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchRequestCard request={item} />}
        contentContainerStyle={styles.listContent}
      />
    );
  }

  function renderMyRequestItem({ item }: { item: MatchRequest }) {
    const meta = STATUS_META[item.status];

    return (
      <View style={styles.myCard}>
        <View style={styles.myCardHeader}>
          <View style={styles.myCardText}>
            <Text style={styles.myCardTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.myCardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.backgroundColor }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {item.status === 'open' ? (
          <TouchableOpacity
            style={styles.responsesButton}
            onPress={() =>
              Alert.alert('Respuestas', 'Abre el detalle del anuncio para revisar propuestas.')
            }
          >
            <Text style={styles.responsesButtonText}>Ver respuestas -&gt;</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  function renderMineContent() {
    if (isLoadingMyRequests) {
      return (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => `my-skeleton-${item}`}
          renderItem={() => <MatchRequestSkeleton />}
          contentContainerStyle={styles.listContent}
        />
      );
    }

    if (myRequests.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons name="megaphone-outline" size={52} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Todavia no tienes anuncios</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={openCreateModal}>
            <Text style={styles.primaryButtonText}>Crear nuevo anuncio</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={myRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderMyRequestItem}
        contentContainerStyle={styles.listContent}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>TABLON DE RIVALES</Text>
            <Text style={styles.headerSubtitle}>Encontra equipos para jugar</Text>
          </View>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'search' && styles.modeButtonActive]}
              onPress={() => setMode('search')}
            >
              <Text style={[styles.modeText, mode === 'search' && styles.modeTextActive]}>
                Buscar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'mine' && styles.modeButtonActive]}
              onPress={() => setMode('mine')}
            >
              <Text style={[styles.modeText, mode === 'mine' && styles.modeTextActive]}>
                Mis anuncios
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.rankingButton}
            onPress={() => router.push('/ranking' as Href)}
          >
            <Ionicons name="trophy-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'search' ? (
        <View style={styles.searchTools}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={18} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nivel, zona o tamano..."
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[styles.chip, Object.keys(filters).length === 0 && styles.chipActive]}
              onPress={() => setFilters({})}
            >
              <Text
                style={[
                  styles.chipText,
                  Object.keys(filters).length === 0 && styles.chipTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {FILTER_CHIPS.map((chip) => {
              const active = isSameFilter(filters, chip.filters);
              return (
                <TouchableOpacity
                  key={chip.label}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilters(active ? {} : chip.filters)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.counterText}>
            {visibleRequests.length.toLocaleString('es-CL')} equipos buscan rival
          </Text>
        </View>
      ) : null}

      <View style={styles.content}>
        {mode === 'search' ? renderSearchContent() : renderMineContent()}
      </View>

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {activeTeamId ? (
        <CreateRequestModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          teamId={activeTeamId}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f3f4f6', flex: 1 },
  header: {
    backgroundColor: '#0a3d1f',
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: { flex: 1 },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  modeToggle: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    flexDirection: 'row',
    padding: 4,
  },
  rankingButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  modeButton: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  modeButtonActive: { backgroundColor: '#ffffff' },
  modeText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '800' },
  modeTextActive: { color: '#0a3d1f' },
  searchTools: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrap: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: { color: '#111827', flex: 1, fontSize: 14, paddingVertical: 11 },
  filtersContent: { flexDirection: 'row', gap: 8, paddingTop: 12 },
  chip: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { color: '#6b7280', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#ffffff' },
  counterText: { color: '#6b7280', fontSize: 13, fontWeight: '700', marginTop: 12 },
  content: { flex: 1 },
  listContent: { flexGrow: 1, padding: 16, paddingBottom: 96 },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  myCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 3,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  myCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  myCardText: { flex: 1 },
  myCardTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  myCardDescription: { color: '#6b7280', fontSize: 13, lineHeight: 18, marginTop: 5 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '800' },
  responsesButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  responsesButtonText: { color: '#2563eb', fontSize: 13, fontWeight: '800' },
  fab: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 28,
    bottom: 24,
    elevation: 5,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    width: 56,
  },
  fabText: { color: '#ffffff', fontSize: 34, fontWeight: '600', lineHeight: 38 },
});
