import React from 'react';
import { StyleSheet, Text, View, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, radii, shadows } from '@/lib/theme';
import AvatarPreview from '@/components/avatar/AvatarPreview';
import { type AvatarPose } from '@/lib/avatar';

type FifaCardProps = {
  name: string;
  rating: number;
  elo: number;
  position?: string;
  avatarUrl: string | null;
  pose?: AvatarPose;
  teamColor?: string;
  stats?: {
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  };
};

export default function FifaCard({
  name,
  rating,
  elo,
  position = 'DEL',
  avatarUrl,
  pose = 'idle',
  teamColor = colors.accent,
  stats = { pac: 85, sho: 88, pas: 82, dri: 90, def: 45, phy: 78 },
}: FifaCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f59e0b', '#78350f']} // Dorado FIFA
        style={styles.cardFrame}
      >
        <View style={styles.cardInner}>
          {/* Header con Rating y Posición */}
          <View style={styles.header}>
            <Text style={styles.rating}>{rating}</Text>
            <Text style={styles.position}>{position}</Text>
            <View style={styles.divider} />
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Flag_of_Chile.svg/1200px-Flag_of_Chile.svg.png' }}
              style={styles.flag}
            />
          </View>

          {/* Avatar Realista */}
          <View style={styles.avatarContainer}>
            <AvatarPreview
              avatarUrl={avatarUrl}
              pose={pose}
              teamColor={teamColor}
              width={180}
              height={220}
              showControls={false}
            />
          </View>

          {/* Info del Jugador */}
          <View style={styles.infoContainer}>
            <Text style={styles.name} numberOfLines={1}>{name.toUpperCase()}</Text>
            <View style={styles.statsDivider} />

            <View style={styles.statsGrid}>
              <View style={styles.statColumn}>
                <StatItem label="PAC" value={stats.pac} />
                <StatItem label="SHO" value={stats.sho} />
                <StatItem label="PAS" value={stats.pas} />
              </View>
              <View style={styles.statDividerVertical} />
              <View style={styles.statColumn}>
                <StatItem label="DRI" value={stats.dri} />
                <StatItem label="DEF" value={stats.def} />
                <StatItem label="PHY" value={stats.phy} />
              </View>
            </View>

            <View style={styles.eloBadge}>
              <Text style={styles.eloText}>ELO {elo}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cardFrame: {
    width: 300,
    height: 440,
    borderRadius: 20,
    padding: 4,
    ...shadows.card,
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 30,
    left: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  rating: {
    color: '#f59e0b',
    fontFamily: font.extraBold,
    fontSize: 48,
    lineHeight: 48,
  },
  position: {
    color: '#f59e0b',
    fontFamily: font.bold,
    fontSize: 20,
    marginTop: -5,
  },
  divider: {
    width: 30,
    height: 2,
    backgroundColor: '#f59e0b',
    marginVertical: 8,
    opacity: 0.5,
  },
  flag: {
    width: 25,
    height: 15,
    borderRadius: 2,
  },
  avatarContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
  },
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  name: {
    color: '#f59e0b',
    fontFamily: font.extraBold,
    fontSize: 24,
    textAlign: 'center',
    width: '90%',
  },
  statsDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#f59e0b',
    marginVertical: 10,
    opacity: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  statColumn: {
    gap: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 16,
    width: 25,
  },
  statLabel: {
    color: '#f59e0b',
    fontFamily: font.regular,
    fontSize: 14,
    opacity: 0.8,
  },
  statDividerVertical: {
    width: 1,
    height: 60,
    backgroundColor: '#f59e0b',
    opacity: 0.3,
  },
  eloBadge: {
    marginTop: 15,
    backgroundColor: '#f59e0b22',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#f59e0b44',
  },
  eloText: {
    color: '#f59e0b',
    fontFamily: font.bold,
    fontSize: 12,
  },
});
