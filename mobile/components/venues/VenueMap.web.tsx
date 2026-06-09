import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Venue } from '@/lib/venues';

type VenueMapProps = {
  venues: Venue[];
  userCoords: { lat: number; lng: number } | null;
  onVenuePress: (venue: Venue) => void;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
}

export function VenueMap({
  venues,
  userCoords,
  onVenuePress,
}: VenueMapProps) {
  return (
    <View style={styles.container}>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>🗺️ Mapa web</Text>
        <Text style={styles.noticeBody}>
          En navegador se muestra una vista compatible. En iOS/Android verás el mapa interactivo.
        </Text>
        {userCoords ? (
          <Text style={styles.noticeCoords}>
            Tu ubicación: {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
          </Text>
        ) : null}
      </View>

      {venues
        .filter((venue) => venue.lat !== null && venue.lng !== null)
        .map((venue) => (
          <TouchableOpacity
            key={venue.id}
            style={styles.venueRow}
            activeOpacity={0.8}
            onPress={() => onVenuePress(venue)}
          >
            <View style={styles.venueRowInner}>
              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.venueAddress} numberOfLines={1}>
                  {venue.address}
                </Text>
              </View>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: venue.is_featured ? '#22c55e' : '#888' },
                ]}
              />
            </View>
            <Text style={styles.venuePrice}>
              {formatPrice(venue.price_platform)}/hr
            </Text>
          </TouchableOpacity>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notice: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2d3a',
    backgroundColor: '#1a1d27',
    padding: 16,
  },
  noticeTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  noticeBody: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
  },
  noticeCoords: {
    color: '#777',
    fontSize: 12,
    marginTop: 8,
  },
  venueRow: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2d3a',
    backgroundColor: '#0f1117',
    padding: 14,
  },
  venueRowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  venueInfo: {
    flex: 1,
    paddingRight: 12,
  },
  venueName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  venueAddress: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  venuePrice: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
});
