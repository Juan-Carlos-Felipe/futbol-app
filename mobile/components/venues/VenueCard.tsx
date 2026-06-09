import { Image, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Venue, VenueWithDistance } from '@/lib/venues';
import { openDirections } from './MapLinkSheet';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

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
          <SkeletonBox width={100} height={100} borderRadius={8} />
          <View style={styles.info}>
            <SkeletonBox width="70%" height={18} borderRadius={8} style={{ marginBottom: 8 }} />
            <SkeletonBox width="50%" height={14} borderRadius={8} style={{ marginBottom: 8 }} />
            <SkeletonBox width="80%" height={14} borderRadius={8} style={{ marginBottom: 8 }} />
            <View style={styles.priceRow}>
              <SkeletonBox width="40%" height={18} borderRadius={8} style={{ marginBottom: 8 }} />
              <SkeletonBox width="30%" height={18} borderRadius={8} />
            </View>
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
          <Text style={styles.name} numberOfLines={2}>
            {venue.name}
          </Text>

          {hasDistance(venue) ? (
            <Text style={styles.meta}>
              📍 {venue.distanceKm.toFixed(1)} km
            </Text>
          ) : null}

          <Text style={styles.meta} numberOfLines={1}>
            {venue.surface ?? 'Superficie'} · {venue.size ?? 'Formato'}
          </Text>

          <View style={styles.priceRow}>
            {venue.is_municipal ? (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>Municipal · Gratis</Text>
              </View>
            ) : (
              <Text style={styles.price}>
                {formatPrice(venue.price_platform)} / hr
              </Text>
            )}

            {!venue.is_municipal && venue.price_public ? (
              <Text style={styles.priceStrike}>
                {formatPrice(venue.price_public)}
              </Text>
            ) : null}
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>
              {venue.rating ?? 0} ({venue.review_count ?? 0})
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {!isWeb && venue.lat && venue.lng ? (
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={handleDirections}
          activeOpacity={0.7}
        >
          <Text style={styles.directionsText}>Cómo llegar →</Text>
        </TouchableOpacity>
      ) : null}

      {venue.is_featured ? (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>Destacada</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2d3a',
    backgroundColor: '#1a1d27',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#2a2d3a',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#2a2d3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 56,
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  price: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
  },
  priceStrike: {
    color: '#777',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  freeBadge: {
    backgroundColor: '#123d25',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  freeBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  star: {
    color: '#facc15',
    fontSize: 12,
  },
  ratingText: {
    color: '#aaa',
    fontSize: 12,
  },
  directionsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2d3a',
  },
  directionsText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#22c55e',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredText: {
    color: '#07120b',
    fontSize: 11,
    fontWeight: '700',
  },
});
