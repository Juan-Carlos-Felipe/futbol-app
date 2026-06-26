import React, { forwardRef } from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayerProfile } from '../types';
import { PlayerCardThemeService } from '../services/PlayerCardThemeService';
import { AvatarPreview3D } from './AvatarPreview3D';
import { font } from '@/lib/theme';

interface Props {
  player: PlayerProfile;
}

export const PlayerCardPreview = forwardRef<View, Props>(({ player }, ref) => {
  const theme = player.cardTheme || PlayerCardThemeService.getTheme(player.overall);
  const style = PlayerCardThemeService.getCardStyle(theme);

  return (
    <View ref={ref} style={[styles.card, { borderColor: style.border }]}>
      <LinearGradient colors={style.background} style={styles.gradient}>
        {/* Header: OVR and POS */}
        <View style={styles.header}>
          <View style={styles.ovrCol}>
            <Text style={[styles.ovrText, { color: style.accentColor }]}>{player.overall}</Text>
            <Text style={[styles.posText, { color: style.textColor }]}>{player.position}</Text>
            <View style={[styles.divider, { backgroundColor: style.border }]} />
            <Text style={[styles.numberText, { color: style.textColor }]}>{player.shirtNumber || 10}</Text>
          </View>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <AvatarPreview3D config={player.avatarConfig} mode="card" />
        </View>

        {/* Name Plate */}
        <View style={styles.namePlate}>
          <Text style={[styles.nameText, { color: style.textColor }]} numberOfLines={1}>
            {player.name.toUpperCase()}
          </Text>
          <View style={[styles.nameDivider, { backgroundColor: style.accentColor }]} />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatItem label="PAC" value={player.pace} color={style.textColor} />
            <StatItem label="DRI" value={player.dribbling} color={style.textColor} />
          </View>
          <View style={styles.statsRow}>
            <StatItem label="SHO" value={player.shooting} color={style.textColor} />
            <StatItem label="DEF" value={player.defending} color={style.textColor} />
          </View>
          <View style={styles.statsRow}>
            <StatItem label="PAS" value={player.passing} color={style.textColor} />
            <StatItem label="PHY" value={player.physical} color={style.textColor} />
          </View>
        </View>

        {/* Decorative elements */}
        <View style={[styles.bottomAccent, { backgroundColor: style.accentColor }]} />
      </LinearGradient>
    </View>
  );
});

function StatItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 450,
    borderRadius: 20,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  gradient: {
    flex: 1,
    padding: 15,
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 15,
    zIndex: 10,
  },
  ovrCol: {
    alignItems: 'center',
  },
  ovrText: {
    fontFamily: font.extraBold,
    fontSize: 48,
    lineHeight: 48,
  },
  posText: {
    fontFamily: font.bold,
    fontSize: 18,
    marginTop: -5,
  },
  divider: {
    width: 30,
    height: 2,
    marginVertical: 5,
  },
  numberText: {
    fontFamily: font.bold,
    fontSize: 16,
  },
  avatarSection: {
    flex: 1,
    marginTop: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  namePlate: {
    alignItems: 'center',
    marginBottom: 15,
  },
  nameText: {
    fontFamily: font.extraBold,
    fontSize: 24,
    textAlign: 'center',
  },
  nameDivider: {
    width: '60%',
    height: 1,
    marginTop: 2,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '45%',
  },
  statValue: {
    fontFamily: font.extraBold,
    fontSize: 18,
    minWidth: 25,
  },
  statLabel: {
    fontFamily: font.medium,
    fontSize: 14,
    opacity: 0.8,
  },
  bottomAccent: {
    height: 4,
    width: '40%',
    alignSelf: 'center',
    borderRadius: 2,
    position: 'absolute',
    bottom: 10,
    opacity: 0.5,
  },
});
