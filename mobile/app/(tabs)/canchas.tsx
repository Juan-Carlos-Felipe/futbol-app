import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VenueCard } from '@/components/venues/VenueCard';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useVenues } from '@/hooks/useVenues';
import { Venue, VenueFilters } from '@/lib/venues';

const isWeb = Platform.OS === 'web';

let VenueMap: any;
if (!isWeb) {
  try {
    VenueMap = require('@/components/venues/VenueMap').default;
  } catch (e) {
    VenueMap = null;
  }
}

type ViewMode = 'map' | 'list';

type FilterChip = {
  label: string;
  key: keyof VenueFilters;
  value: string | number | boolean;
};

const FILTER_CHIPS: FilterChip[] = [
  { label: 'Pasto sintético', key: 'surface', value: 'pasto sintético' },
  { label: 'F5', key: 'size', value: 'F5' },
  { label: 'F7', key: 'size', value: 'F7' },
  { label: 'Hasta $20.000', key: 'maxPrice', value: 20000 },
  { label: 'Disponible hoy', key: 'soloHoy', value: true },
];

function isActiveFilter(filters: VenueFilters, chip: FilterChip) {
  return filters[chip.key] === chip.value;
}

function toggleFilter(filters: VenueFilters, chip: FilterChip): VenueFilters {
  if (isActiveFilter(filters, chip)) {
    const nextFilters = { ...filters };
    delete nextFilters[chip.key];
    return nextFilters;
  }
  return { ...filters, [chip.key]: chip.value };
}

const MAP_SUPPORTED = true;

export default function CanchasScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>(MAP_SUPPORTED ? 'map' : 'list');
  const [filters, setFilters] = useState<VenueFilters>({});
  const { coords, permissionDenied, isLoading: loadingLocation } = useUserLocation();
  const { venues, isLoading: loadingVenues, isError, refetch } = useVenues(coords, filters);

  const isLoading = loadingLocation || loadingVenues;
  const hasFilters = Object.keys(filters).length > 0;

  function goToVenue(venue: Venue) {
    router.push(`/cancha/${venue.id}` as never);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Canchas</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === 'map' && styles.toggleBtnActive,
            ]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons
              name="map-outline"
              size={16}
              color={viewMode === 'map' ? '#ffffff' : '#6b7280'}
            />
            <Text style={[
              styles.toggleText,
              viewMode === 'map' && styles.toggleTextActive,
            ]}>
              Mapa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={viewMode === 'list' ? '#ffffff' : '#6b7280'}
            />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              Lista
            </Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTER_CHIPS.map((chip) => {
          const active = isActiveFilter(filters, chip);
          return (
            <TouchableOpacity
              key={`${chip.key}-${chip.label}`}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilters((current) => toggleFilter(current, chip))}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Alerta permiso ubicación */}
      {permissionDenied ? (
        <View style={styles.locationWarning}>
          <Text style={styles.locationWarningText}>
            📍 Activá tu ubicación para ver canchas cercanas
          </Text>
          <TouchableOpacity
            style={styles.locationWarningButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.locationWarningButtonText}>Activar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Contenido principal */}
      <View style={styles.content}>
        {isError ? (
          <View style={styles.centered}>
            <Ionicons name="wifi-outline" size={52} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Error de conexión</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <FlatList
            data={[1, 2, 3]}
            keyExtractor={(item) => `loading-${item}`}
            renderItem={() => <VenueCard loading />}
            contentContainerStyle={styles.listContent}
          />
        ) : venues.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons
              name={hasFilters ? 'options-outline' : 'football-outline'}
              size={52}
              color="#9ca3af"
            />
            <Text style={styles.emptyTitle}>
              {hasFilters ? 'Sin resultados' : 'No hay canchas disponibles'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {hasFilters
                ? 'Probá cambiando los filtros'
                : 'Pronto habrá más canchas en tu zona'}
            </Text>
            {hasFilters ? (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setFilters({})}
              >
                <Text style={styles.clearFilterButtonText}>Limpiar filtros</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : viewMode === 'map' ? (
          !isWeb && VenueMap ? (
            <VenueMap
              venues={venues}
              userCoords={coords}
              onVenuePress={goToVenue}
            />
          ) : (
            <View style={styles.webMapFallback}>
              <Text style={styles.webMapFallbackText}>
                🗺️ Mapa disponible solo en la app móvil!
              </Text>
              <TouchableOpacity
                style={styles.toggleBtnActive}
                onPress={() => setViewMode('list')}
              >
                <Text style={styles.toggleTextActive}>Ver lista de canchas</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <FlatList
            data={venues}
            keyExtractor={(venue) => venue.id}
            renderItem={({ item }) => (
              <VenueCard venue={item} onPress={() => goToVenue(item)} />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: isWeb ? '#f3f4f6' : '#1a1d27',
    borderRadius: 20,
    padding: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: isWeb ? '#16a34a' : '#22c55e',
  },
  toggleText: {
    color: isWeb ? '#6b7280' : '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: isWeb ? '#ffffff' : '#07120b',
  },
  webMapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  webMapFallbackText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 16,
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 52,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  chipText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#07120b',
    fontWeight: '700',
  },
  locationWarning: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#2a2000',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#facc15',
  },
  locationWarningText: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '600',
  },
  locationWarningButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#facc15',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  locationWarningButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#07120b',
    fontWeight: '700',
  },
  clearFilterButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  clearFilterButtonText: {
    color: '#22c55e',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
