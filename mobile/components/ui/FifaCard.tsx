// ✅ REDISEÑADO con theme.ts
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar3DViewer from '@/components/avatar/Avatar3DViewer';
import { type AvatarConfig } from '@/lib/avatar';
import { colors, font } from '@/lib/theme';

interface FifaCardProps {
  config: AvatarConfig;
  rating: number;
  position?: string;
  stats?: {
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  };
}

export default function FifaCard({
  config,
  rating,
  position = 'ST',
  stats = { pac: 85, sho: 82, pas: 78, dri: 88, def: 45, phy: 80 }
}: FifaCardProps) {
  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#f6d365', '#fda085', '#f6d365']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBackground}
      >
        <View style={styles.cardInner}>
          <View style={styles.header}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>{rating}</Text>
              <Text style={styles.positionText}>{position}</Text>
              <View style={styles.divider} />
              <View style={styles.flagPlaceholder} />
            </View>

            <View style={styles.avatarContainer}>
              <Avatar3DViewer
                avatarUrl={config.avatarUrl}
                pose={config.selectedPose}
                teamColor={config.teamColor}
                customization={config.customization}
                width={180}
                height={220}
                autoRotate={false}
              />
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.nameText}>{config.avatarName.toUpperCase()}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statsColumn}>
                <StatItem label="PAC" value={stats.pac} />
                <StatItem label="SHO" value={stats.sho} />
                <StatItem label="PAS" value={stats.pas} />
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsColumn}>
                <StatItem label="DRI" value={stats.dri} />
                <StatItem label="DEF" value={stats.def} />
                <StatItem label="PHY" value={stats.phy} />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
      {/* Premium Glow effect */}
      <View style={styles.glow} />
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
  cardContainer: {
    width: 220,
    height: 320,
    borderRadius: 15,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  cardBackground: {
    flex: 1,
    borderRadius: 15,
    padding: 2,
  },
  cardInner: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 13,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    height: '60%',
  },
  ratingContainer: {
    width: '35%',
    alignItems: 'center',
    paddingTop: 20,
  },
  ratingText: {
    color: '#f6d365',
    fontFamily: font.extraBold,
    fontSize: 36,
    fontWeight: '900',
  },
  positionText: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 16,
    marginTop: -5,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(246, 211, 101, 0.4)',
    marginVertical: 8,
  },
  flagPlaceholder: {
    width: 24,
    height: 16,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'visible',
  },
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  nameText: {
    color: '#f6d365',
    fontFamily: font.extraBold,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '85%',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(246, 211, 101, 0.2)',
    paddingTop: 8,
  },
  statsColumn: {
    flex: 1,
    gap: 2,
  },
  statsDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(246, 211, 101, 0.2)',
    marginHorizontal: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#fff',
    fontFamily: font.bold,
    fontSize: 14,
    width: 20,
    textAlign: 'right',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: font.medium,
    fontSize: 10,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(246, 211, 101, 0.1)',
    zIndex: -1,
  }
});
