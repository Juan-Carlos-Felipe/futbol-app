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
import { theme } from '@/lib/theme';

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
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>CANCHAS</Text>
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
                color={viewMode === 'map' ? theme.colors.white : theme.colors.gray400}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={viewMode === 'list' ? theme.colors.white : theme.colors.gray400}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Encontrá tu cancha</Text>
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
            <Ionicons name="wifi-outline" size={52} color={theme.colors.gray400} />
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
              color={theme.colors.gray400}
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
    backgroundColor: theme.colors.gray50,
  },
  header: {
    backgroundColor: theme.colors.primaryDark,
    height: 140,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.colors.white,
    fontFamily: theme.fonts.display,
    fontSize: 36,
  },
  headerSubtitle: {
    color: theme.colors.white,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 2,
  },
  toggleBtn: {
    padding: 8,
    borderRadius: 18,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  webMapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  webMapFallbackText: {
    color: theme.colors.gray400,
    fontSize: 16,
    marginBottom: 16,
  },
  toggleTextActive: {
    color: theme.colors.white,
    fontFamily: 'DMSans-Bold',
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 52,
    marginTop: 12,
  },
  filtersContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
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
  locationWarning: {
    marginHorizontal: 24,
    marginVertical: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  locationWarningText: {
    color: '#92400e',
    fontSize: 13,
    fontFamily: 'DMSans-Bold',
  },
  locationWarningButton: {
    marginTop: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  locationWarningButtonText: {
    color: theme.colors.white,
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  clearFilterButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  clearFilterButtonText: {
    color: theme.colors.primary,
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
  emptyTitle: {
    color: theme.colors.gray900,
    fontSize: 18,
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.colors.gray400,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
});
