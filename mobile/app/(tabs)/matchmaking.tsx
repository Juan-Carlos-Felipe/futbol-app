// ✅ REDISEÑADO con theme.ts
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter, Stack } from 'expo-router';
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
import { theme } from '@/lib/theme';

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
          <Ionicons name="wifi-outline" size={48} color={theme.colors.gray100} />
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
          <Ionicons name="shield-outline" size={52} color={theme.colors.gray100} />
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
            <Text style={styles.responsesButtonText}>Ver respuestas</Text>
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
          <Ionicons name="megaphone-outline" size={52} color={theme.colors.gray100} />
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
      <Stack.Screen options={{
        title: 'TABLON DE RIVALES',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerShown: true
      }} />

      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'search' && styles.modeTabActive]}
          onPress={() => setMode('search')}
        >
          <Text style={[styles.modeTabText, mode === 'search' && styles.modeTabTextActive]}>
            Buscar Rival
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'mine' && styles.modeTabActive]}
          onPress={() => setMode('mine')}
        >
          <Text style={[styles.modeTabText, mode === 'mine' && styles.modeTabTextActive]}>
            Mis Anuncios
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'search' ? (
        <View style={styles.searchTools}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={18} color={theme.colors.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nivel, zona o tamaño..."
              placeholderTextColor={theme.colors.gray}
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
        </View>
      ) : null}

      <View style={styles.content}>
        {mode === 'search' ? renderSearchContent() : renderMineContent()}
      </View>

      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={32} color={theme.colors.white} />
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
  container: { backgroundColor: theme.colors.white, flex: 1 },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  modeTabActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeTabText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.fonts.dmSansBold,
    fontSize: 14,
  },
  modeTabTextActive: {
    color: theme.colors.white,
  },
  searchTools: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...theme.shadow.sm,
  },
  searchInputWrap: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: theme.colors.dark,
    flex: 1,
    fontSize: 14,
    paddingVertical: 11,
    fontFamily: theme.fonts.dmSans,
  },
  filtersContent: { flexDirection: 'row', gap: 8, paddingTop: 12 },
  chip: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.gray100,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.gray, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  chipTextActive: { color: theme.colors.white },
  content: { flex: 1 },
  listContent: { flexGrow: 1, padding: 16, paddingBottom: 96 },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  emptyTitle: {
    color: theme.colors.dark,
    fontSize: 18,
    fontFamily: theme.fonts.dmSansBold,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.colors.gray,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: theme.fonts.dmSans,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: theme.colors.white, fontSize: 14, fontFamily: theme.fonts.dmSansBold },
  myCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    padding: 16,
    ...theme.shadow.sm,
  },
  myCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  myCardText: { flex: 1 },
  myCardTitle: { color: theme.colors.dark, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
  myCardDescription: { color: theme.colors.gray, fontSize: 13, lineHeight: 18, marginTop: 5, fontFamily: theme.fonts.dmSans },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 11, fontFamily: theme.fonts.dmSansBold },
  responsesButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.blueBg,
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  responsesButtonText: { color: theme.colors.blue, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  fab: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    bottom: 24,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    ...theme.shadow.sm,
    shadowOpacity: 0.3,
    width: 56,
  },
});
