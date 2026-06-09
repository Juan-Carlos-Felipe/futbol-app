import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVenueDetail } from '@/hooks/useVenueDetail';
import { Venue, VenueSlot, VenueReview } from '@/lib/venues';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { openDirections } from '@/components/venues/MapLinkSheet';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

const isWeb = Platform.OS === 'web';

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
}

function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
}

function getAmenityIcon(amenity: string) {
  const lower = amenity.toLowerCase();
  if (lower.includes('vestuario')) return 'shirt-outline';
  if (lower.includes('estacionamiento')) return 'car-outline';
  if (lower.includes('camarin') || lower.includes('ducha')) return 'water-outline';
  if (lower.includes('bar')) return 'beer-outline';
  return 'checkmark-circle-outline';
}

function getStars(rating: number | null) {
  const r = rating ?? 0;
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= r ? '★' : '☆';
  }
  return stars;
}

function VenueReviewCard({ review }: { review: VenueReview }) {
  const initial = review.display_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>{initial}</Text>
      </View>
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewName}>{review.display_name ?? 'Usuario'}</Text>
          {review.created_at ? (
            <Text style={styles.reviewDate}>
              {formatDistanceToNow(new Date(review.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </Text>
          ) : null}
        </View>
        <Text style={styles.reviewStars}>{getStars(review.rating)}</Text>
        {review.comment ? (
          <Text style={styles.reviewComment} numberOfLines={3}>
            {review.comment}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function VenueDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = typeof idParam === 'string' ? idParam : '';
  const router = useRouter();

  const next7Days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState<string>(next7Days[0].toISOString().split('T')[0]);
  const { venue, slots, reviews, isLoading } = useVenueDetail(id, selectedDate);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <SkeletonBox width="100%" height={260} borderRadius={24} style={{ marginBottom: 16 }} />
          <SkeletonBox width="60%" height={22} borderRadius={8} style={{ marginBottom: 12 }} />
          <SkeletonBox width="40%" height={18} borderRadius={8} style={{ marginBottom: 12 }} />
          <SkeletonBox width="100%" height={160} borderRadius={16} style={{ marginBottom: 12 }} />
          <SkeletonBox width="100%" height={48} borderRadius={16} style={{ marginBottom: 12 }} />
          <SkeletonBox width="100%" height={48} borderRadius={16} style={{ marginBottom: 12 }} />
        </ScrollView>
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Cancha no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photoUrl = venue.photos?.[0] ?? null;

  const handleSlotPress = (slot: VenueSlot) => {
    if (!slot.is_available) return;
    router.push({
      pathname: '/reserva/[venueId]' as any,
      params: {
        venueId: venue.id,
        slotId: slot.id,
        date: selectedDate,
        startTime: slot.start_time ?? '',
        endTime: slot.end_time ?? '',
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {photoUrl ? (
          <ImageBackground source={{ uri: photoUrl }} style={styles.heroImage}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.heroOverlay}
            >
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{venue.name}</Text>
                <View style={styles.heroAddressRow}>
                  <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.heroAddress} numberOfLines={1}>
                    {venue.address}
                  </Text>
                </View>
                {venue.surface || venue.size ? (
                  <Text style={styles.heroMeta}>
                    {venue.surface ?? 'Superficie'}
                    {venue.surface && venue.size ? ' · ' : ''}
                    {venue.size ?? 'Formato'}
                  </Text>
                ) : null}
              </View>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <View style={styles.heroPlaceholder}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Ionicons name="american-football" size={64} color="#ffffff" />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.priceRatingRow}>
            <View style={styles.priceColumn}>
              {venue.is_municipal ? (
                <>
                  <Text style={styles.freeText}>Gratis</Text>
                  <View style={styles.municipalBadge}>
                    <Text style={styles.municipalText}>Municipal</Text>
                  </View>
                </>
              ) : (
                <View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>{formatPrice(venue.price_platform)}</Text>
                    <Text style={styles.perHourText}>/hr</Text>
                  </View>
                  {venue.price_public ? (
                    <Text style={styles.pricePublicText}>{formatPrice(venue.price_public)}</Text>
                  ) : null}
                </View>
              )}
            </View>

            <View style={styles.ratingColumn}>
              {venue.rating ? (
                <>
                  <Text style={styles.ratingBig}>
                    ★ {venue.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.reviewCount}>
                    ({venue.review_count ?? 0} reseñas)
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          {venue.lat !== null && venue.lng !== null && !isWeb ? (
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => openDirections({ lat: venue.lat!, lng: venue.lng!, name: venue.name })}
            >
              <Ionicons name="navigate-outline" size={20} color="#2563eb" />
              <Text style={styles.directionsButtonText}>Cómo llegar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comodidades</Text>
          {venue.amenities && venue.amenities.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.amenitiesScroll}>
              {venue.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityChip}>
                  <Ionicons
                    name={getAmenityIcon(amenity) as any}
                    size={16}
                    color="#166534"
                    style={styles.amenityIcon}
                  />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noAmenitiesText}>Sin comodidades adicionales</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elegí una fecha</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {next7Days.map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[styles.dateWeekday, isSelected && styles.dateTextSelected]}>
                    {format(date, 'EEE', { locale: es })}
                  </Text>
                  <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                    {format(date, 'd')}
                  </Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                    {format(date, 'MMM', { locale: es })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.slotsHeader}>
            <Text style={styles.sectionTitle}>Horarios disponibles</Text>
            <Text style={styles.slotsSubtitle}>Seleccioná un horario para reservar</Text>
          </View>

          {isLoading ? (
            <View style={styles.centeredSmall}>
              <ActivityIndicator color="#16a34a" />
            </View>
          ) : slots.length === 0 ? (
            <Text style={styles.noSlotsText}>No hay horarios disponibles para este día</Text>
          ) : (
            <FlatList
              data={slots}
              keyExtractor={(slot) => slot.id}
              numColumns={2}
              columnWrapperStyle={styles.slotsRow}
              scrollEnabled={false}
              renderItem={({ item: slot }) => {
                const isAvailable = slot.is_available ?? false;
                return (
                  <TouchableOpacity
                    style={[
                      styles.slotCard,
                      !isAvailable ? styles.slotCardDisabled : null,
                    ]}
                    onPress={() => handleSlotPress(slot)}
                    disabled={!isAvailable}
                  >
                    <View style={styles.slotTopRow}>
                      <Text
                        style={[
                          styles.slotTime,
                          !isAvailable ? styles.slotTimeDisabled : null,
                        ]}
                      >
                        {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                      </Text>
                      {!isAvailable ? (
                        <View style={styles.occupiedBadge}>
                          <Text style={styles.occupiedText}>Ocupado</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Lo que dicen los jugadores</Text>
          {reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>Aún no hay reseñas</Text>
          ) : (
            <>
              {reviews.slice(0, 3).map((review) => (
                <VenueReviewCard key={review.id} review={review} />
              ))}
              {reviews.length > 3 ? (
                <Text style={styles.seeAllReviewsText}>Ver todas las reseñas</Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  centeredSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorText: {
    color: '#111827',
    fontSize: 16,
  },
  link: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },

  heroImage: {
    width: '100%',
    height: 260,
  },
  heroPlaceholder: {
    width: '100%',
    height: 260,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 16,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    gap: 6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  heroAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroAddress: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },

  card: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceColumn: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceText: {
    color: '#16a34a',
    fontSize: 28,
    fontWeight: '700',
  },
  perHourText: {
    color: '#6b7280',
    fontSize: 14,
  },
  pricePublicText: {
    color: '#6b7280',
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  freeText: {
    color: '#16a34a',
    fontSize: 28,
    fontWeight: '700',
  },
  municipalBadge: {
    backgroundColor: '#123d25',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  municipalText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },

  ratingColumn: {
    alignItems: 'flex-end',
  },
  ratingBig: {
    color: '#facc15',
    fontSize: 20,
    fontWeight: '700',
  },
  reviewCount: {
    color: '#6b7280',
    fontSize: 12,
  },

  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  directionsButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },

  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  amenitiesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  amenityIcon: {
    marginRight: 6,
  },
  amenityText: {
    color: '#166534',
    fontSize: 13,
  },
  noAmenitiesText: {
    color: '#6b7280',
    fontSize: 13,
  },

  dateScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dateChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    minWidth: 64,
  },
  dateChipSelected: {
    backgroundColor: '#16a34a',
  },
  dateWeekday: {
    color: '#6b7280',
    fontSize: 12,
  },
  dateDay: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  dateMonth: {
    color: '#6b7280',
    fontSize: 12,
  },
  dateTextSelected: {
    color: '#ffffff',
  },

  slotsHeader: {
    marginBottom: 8,
  },
  slotsSubtitle: {
    color: '#6b7280',
    fontSize: 13,
  },
  noSlotsText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  slotsRow: {
    justifyContent: 'space-between',
    gap: 12,
  },
  slotCard: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  slotCardDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTime: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '700',
  },
  slotTimeDisabled: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  occupiedBadge: {
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  occupiedText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '600',
  },

  noReviewsText: {
    color: '#6b7280',
    fontSize: 13,
  },
  seeAllReviewsText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  reviewContent: {
    flex: 1,
    gap: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#9ca3af',
    fontSize: 11,
  },
  reviewStars: {
    color: '#facc15',
    fontSize: 14,
  },
  reviewComment: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
});