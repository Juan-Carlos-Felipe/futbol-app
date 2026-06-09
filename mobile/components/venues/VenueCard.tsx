import { Image, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Venue, VenueWithDistance } from '@/lib/venues';
import { openDirections } from './MapLinkSheet';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { theme } from '@/lib/theme';

const isWeb = Platform.OS === 'web';

type VenueCardProps = {
  venue?: Venue | VenueWithDistance;
  onPress?: () => void;
  loading?: boolean;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
}

function hasDistance(venue: Venue | VenueWithDistance): venue is VenueWithDistance {
  return 'distanceKm' in venue && Number.isFinite(venue.distanceKm);
}

export function VenueCard({ venue, onPress, loading }: VenueCardProps) {
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <SkeletonBox width={100} height={100} borderRadius={10} />
          <View style={styles.info}>
            <SkeletonBox width="70%" height={18} borderRadius={8} style={{ marginBottom: 8 }} />
            <SkeletonBox width="50%" height={14} borderRadius={8} style={{ marginBottom: 8 }} />
            <SkeletonBox width="80%" height={14} borderRadius={8} />
          </View>
        </View>
      </View>
    );
  }

  if (!venue) {
    return null;
  }

  const photoUrl = venue.photos?.[0] ?? null;

  const handleDirections = () => {
    if (venue.lat && venue.lng && !isWeb) {
      openDirections({
        lat: venue.lat,
        lng: venue.lng,
        name: venue.name,
      });
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        activeOpacity={0.8}
        onPress={onPress}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderIcon}>🏟️</Text>
          </View>
        )}

        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {venue.name}
            </Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.ratingText}>{venue.rating ?? 0}</Text>
            </View>
          </View>

          <Text style={styles.meta} numberOfLines={1}>
            {venue.surface ?? 'Superficie'} · {venue.size ?? 'Formato'}
            {hasDistance(venue) ? ` · 📍 ${venue.distanceKm.toFixed(1)} km` : ''}
          </Text>

          <View style={styles.priceContainer}>
            {venue.is_municipal ? (
              <Text style={styles.price}>MUNICIPAL · GRATIS</Text>
            ) : (
              <Text style={styles.price}>
                {formatPrice(venue.price_platform)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.directionsButton}
            onPress={handleDirections}
            activeOpacity={0.7}
          >
            <Text style={styles.directionsText}>Cómo llegar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {venue.is_featured ? (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>TOP</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    marginBottom: 16,
    ...theme.shadow.md,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: theme.colors.gray100,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: theme.colors.gray900,
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    flex: 1,
    marginRight: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    color: theme.colors.gold,
    fontSize: 12,
  },
  ratingText: {
    color: theme.colors.gray900,
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
  },
  meta: {
    color: theme.colors.gray400,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    marginTop: 2,
  },
  priceContainer: {
    marginTop: 8,
  },
  price: {
    color: theme.colors.primary,
    fontSize: 20,
    fontFamily: theme.fonts.display,
  },
  directionsButton: {
    backgroundColor: theme.colors.blueBg,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  directionsText: {
    color: theme.colors.blue,
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  featuredText: {
    color: theme.colors.white,
    fontSize: 10,
    fontFamily: 'DMSans-Bold',
  },
});
