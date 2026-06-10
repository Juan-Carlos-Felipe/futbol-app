// ✅ REDISEÑADO con theme.ts
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
import { useRouter, Stack } from 'expo-router';
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
      <Stack.Screen options={{
        title: 'CANCHAS',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerShown: true
      }} />

      {/* Control de vista */}
      <View style={styles.viewToggleContainer}>
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
              color={viewMode === 'map' ? theme.colors.white : theme.colors.gray}
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
              color={viewMode === 'list' ? theme.colors.white : theme.colors.gray}
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
            <Ionicons name="wifi-outline" size={52} color={theme.colors.gray100} />
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
              color={theme.colors.gray100}
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
                style={[styles.toggleBtn, styles.toggleBtnActive]}
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
    backgroundColor: theme.colors.white,
  },
  viewToggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray100,
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
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    color: theme.colors.gray,
    fontSize: 12,
    fontFamily: theme.fonts.dmSansBold,
  },
  toggleTextActive: {
    color: theme.colors.white,
  },
  webMapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  webMapFallbackText: {
    color: theme.colors.gray,
    fontFamily: theme.fonts.dmSans,
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
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray100,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.gray,
    fontSize: 13,
    fontFamily: theme.fonts.dmSansMedium,
  },
  chipTextActive: {
    color: theme.colors.white,
    fontFamily: theme.fonts.dmSansBold,
  },
  locationWarning: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#fef3c7',
  },
  locationWarningText: {
    color: theme.colors.gold,
    fontSize: 13,
    fontFamily: theme.fonts.dmSansBold,
  },
  locationWarningButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.gold,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  locationWarningButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.dmSansBold,
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
    fontFamily: theme.fonts.dmSansBold,
  },
  clearFilterButton: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  clearFilterButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.dmSansBold,
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
    color: theme.colors.dark,
    fontSize: 18,
    fontFamily: theme.fonts.dmSansBold,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.colors.gray,
    fontSize: 14,
    fontFamily: theme.fonts.dmSans,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
