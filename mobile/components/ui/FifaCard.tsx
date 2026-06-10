import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { theme } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';

type FifaCardProps = {
  name: string;
  rating: number;
  position: string;
  stats: {
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  };
  image?: string;
};

export function FifaCard({ name, rating, position, stats, image }: FifaCardProps) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#f59e0b', '#d97706', '#b45309']}
        style={styles.gradient}
      >
        <View style={styles.topSection}>
          <View style={styles.ratingSection}>
            <Text style={styles.rating}>{rating}</Text>
            <Text style={styles.position}>{position}</Text>
          </View>
          <View style={styles.imageContainer}>
             {/* Player image would go here */}
             <Text style={{fontSize: 40}}>👤</Text>
          </View>
        </View>

        <Text style={styles.name}>{name.toUpperCase()}</Text>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{stats.pac} <Text style={styles.statLabel}>PAC</Text></Text>
            <Text style={styles.statValue}>{stats.sho} <Text style={styles.statLabel}>SHO</Text></Text>
            <Text style={styles.statValue}>{stats.pas} <Text style={styles.statLabel}>PAS</Text></Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{stats.dri} <Text style={styles.statLabel}>DRI</Text></Text>
            <Text style={styles.statValue}>{stats.def} <Text style={styles.statLabel}>DEF</Text></Text>
            <Text style={styles.statValue}>{stats.phy} <Text style={styles.statLabel}>PHY</Text></Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  gradient: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  topSection: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingSection: {
    alignItems: 'center',
  },
  rating: {
    fontFamily: theme.fonts.bebas,
    fontSize: 32,
    color: '#312e81',
  },
  position: {
    fontFamily: theme.fonts.bebas,
    fontSize: 14,
    color: '#312e81',
    marginTop: -5,
  },
  imageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontFamily: theme.fonts.bebas,
    fontSize: 18,
    color: '#312e81',
    marginTop: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(49, 46, 129, 0.2)',
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontFamily: theme.fonts.dmSansBold,
    fontSize: 12,
    color: '#312e81',
  },
  statLabel: {
    fontFamily: theme.fonts.dmSans,
    fontSize: 10,
    opacity: 0.7,
  },
});
