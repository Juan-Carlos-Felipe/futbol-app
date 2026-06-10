// ✅ REDISEÑADO con theme.ts
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVenueDetail } from '@/hooks/useVenueDetail';
import { Venue, VenueSlot, VenueReview } from '@/lib/venues';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { openDirections } from '@/components/venues/MapLinkSheet';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { theme } from '@/lib/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';

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
      <Stack.Screen options={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {photoUrl ? (
          <ImageBackground source={{ uri: photoUrl }} style={styles.heroImage}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.heroOverlay}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{venue.name.toUpperCase()}</Text>
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
            <Ionicons name="football-outline" size={64} color={theme.colors.white} />
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
              <Ionicons name="navigate-outline" size={20} color={theme.colors.blue} />
              <Text style={styles.directionsButtonText}>Cómo llegar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Comodidades" />
          {venue.amenities && venue.amenities.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.amenitiesScroll}>
              {venue.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityChip}>
                  <Ionicons
                    name={getAmenityIcon(amenity) as any}
                    size={16}
                    color={theme.colors.primary}
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
          <SectionHeader title="Elegí una fecha" />
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
                    {format(date, 'EEE', { locale: es }).toUpperCase()}
                  </Text>
                  <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                    {format(date, 'd')}
                  </Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                    {format(date, 'MMM', { locale: es }).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Horarios disponibles" subtitle="Seleccioná un horario para reservar" />

          {isLoading ? (
            <View style={styles.centeredSmall}>
              <ActivityIndicator color={theme.colors.primary} />
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
          <SectionHeader title="Reseñas de Jugadores" />
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
    backgroundColor: theme.colors.white,
  },
  content: {
    paddingBottom: 40,
  },
  headerBackBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    gap: 12,
  },
  centeredSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorText: {
    color: theme.colors.dark,
    fontSize: 16,
    fontFamily: theme.fonts.dmSansBold,
  },
  link: {
    color: theme.colors.primary,
    fontSize: 16,
    fontFamily: theme.fonts.dmSansBold,
  },

  heroImage: {
    width: '100%',
    height: 280,
  },
  heroPlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  heroContent: {
    gap: 4,
  },
  heroTitle: {
    color: theme.colors.white,
    fontSize: 28,
    fontFamily: theme.fonts.bebas,
  },
  heroAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroAddress: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: theme.fonts.dmSans,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: theme.fonts.dmSansBold,
  },

  card: {
    margin: 20,
    marginTop: -20,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    ...theme.shadow.sm,
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
    color: theme.colors.primary,
    fontSize: 28,
    fontFamily: theme.fonts.bebas,
  },
  perHourText: {
    color: theme.colors.gray,
    fontSize: 14,
    fontFamily: theme.fonts.dmSansBold,
  },
  pricePublicText: {
    color: theme.colors.gray,
    fontSize: 14,
    textDecorationLine: 'line-through',
    fontFamily: theme.fonts.dmSans,
  },
  freeText: {
    color: theme.colors.primary,
    fontSize: 28,
    fontFamily: theme.fonts.bebas,
  },
  municipalBadge: {
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  municipalText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: theme.fonts.dmSansBold,
  },

  ratingColumn: {
    alignItems: 'flex-end',
  },
  ratingBig: {
    color: theme.colors.gold,
    fontSize: 20,
    fontFamily: theme.fonts.dmSansBold,
  },
  reviewCount: {
    color: theme.colors.gray,
    fontSize: 12,
    fontFamily: theme.fonts.dmSans,
  },

  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.blueBg,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  directionsButtonText: {
    color: theme.colors.blue,
    fontSize: 14,
    fontFamily: theme.fonts.dmSansBold,
  },

  section: {
    marginHorizontal: 20,
    marginBottom: 28,
  },
  lastSection: {
    marginBottom: 0,
  },
  amenitiesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  amenityIcon: {
    marginRight: 6,
  },
  amenityText: {
    color: theme.colors.dark,
    fontSize: 13,
    fontFamily: theme.fonts.dmSansBold,
  },
  noAmenitiesText: {
    color: theme.colors.gray,
    fontSize: 13,
    fontFamily: theme.fonts.dmSans,
  },

  dateScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray100,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginRight: 10,
    minWidth: 70,
  },
  dateChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  dateWeekday: {
    color: theme.colors.gray,
    fontSize: 11,
    fontFamily: theme.fonts.dmSansBold,
  },
  dateDay: {
    color: theme.colors.dark,
    fontSize: 22,
    fontFamily: theme.fonts.bebas,
  },
  dateMonth: {
    color: theme.colors.gray,
    fontSize: 11,
    fontFamily: theme.fonts.dmSansBold,
  },
  dateTextSelected: {
    color: theme.colors.white,
  },

  noSlotsText: {
    color: theme.colors.gray,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
    fontFamily: theme.fonts.dmSans,
  },
  slotsRow: {
    justifyContent: 'space-between',
    gap: 12,
  },
  slotCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray100,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  slotCardDisabled: {
    backgroundColor: theme.colors.gray100,
    borderColor: 'transparent',
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTime: {
    color: theme.colors.primary,
    fontSize: 16,
    fontFamily: theme.fonts.bebas,
  },
  slotTimeDisabled: {
    color: theme.colors.gray,
    textDecorationLine: 'line-through',
  },
  occupiedBadge: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  occupiedText: {
    color: theme.colors.loss,
    fontSize: 10,
    fontFamily: theme.fonts.dmSansBold,
  },

  noReviewsText: {
    color: theme.colors.gray,
    fontSize: 13,
    fontFamily: theme.fonts.dmSans,
  },
  seeAllReviewsText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontFamily: theme.fonts.dmSansBold,
    marginTop: 12,
    textAlign: 'center',
  },
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray100,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: theme.colors.white,
    fontSize: 16,
    fontFamily: theme.fonts.bebas,
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
    color: theme.colors.dark,
    fontSize: 14,
    fontFamily: theme.fonts.dmSansBold,
  },
  reviewDate: {
    color: theme.colors.gray,
    fontSize: 11,
    fontFamily: theme.fonts.dmSans,
  },
  reviewStars: {
    color: theme.colors.gold,
    fontSize: 14,
  },
  reviewComment: {
    color: theme.colors.gray,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: theme.fonts.dmSans,
  },
});
