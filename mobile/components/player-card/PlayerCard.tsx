import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Shirt, generateShirtSVG } from '@/lib/shirts';
import { font } from '@/lib/theme';

interface PlayerCardProps {
  photoUri: string;
  playerName: string;
  teamName: string;
  shirt: Shirt;
  shirtNumber: number;
  position: 'DEL' | 'MED' | 'DEF' | 'ARQ';
  stats: { pj: number; g: number; gl: number; ast: number };
  elo: number;
  level: string;
  countryFlag?: string;
  cardStyle?: 'classic' | 'dark' | 'gold' | 'ice' | 'fire';
  width?: number;
  height?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  photoUri,
  playerName,
  teamName,
  shirt,
  shirtNumber,
  position,
  stats,
  elo,
  level,
  countryFlag = '🇨🇱',
  cardStyle = 'classic',
  width = Dimensions.get('window').width * 0.85,
  height = (Dimensions.get('window').width * 0.85) * 1.4,
}) => {
  const nameParts = playerName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  const getCardStyles = () => {
    switch (cardStyle) {
      case 'dark': return { bg: '#0d0d0d' };
      case 'gold': return { bg: '#1a1200' };
      case 'ice': return { bg: '#e8f4f8' };
      case 'fire': return { bg: '#1a0500' };
      default: return { bg: shirt.primaryColor + '22' };
    }
  };

  const cardTheme = getCardStyles();

  return (
    <View style={[styles.cardContainer, { width, height, backgroundColor: cardTheme.bg, borderColor: shirt.primaryColor }]}>

      {/* CAPA 2 — Número decorativo gigante */}
      <Text style={[styles.bgNumber, { fontSize: width * 1.05, color: shirt.primaryColor + '20', top: -(width * 0.12), left: -(width * 0.04) }]}>
        {shirtNumber}
      </Text>

      {/* CAPA 3 — Camiseta SVG */}
      <View style={[styles.shirtContainer, { bottom: height * 0.22, width: width, height: height * 0.55 }]}>
        <SvgXml xml={generateShirtSVG(shirt)} width="100%" height="100%" opacity={0.92} />
      </View>

      {/* CAPA 4 — Foto del jugador */}
      <Image
        source={{ uri: photoUri }}
        style={[styles.playerPhoto, { width: width * 0.86, height: height * 0.70, bottom: height * 0.22, left: width * 0.07 }]}
        resizeMode="contain"
      />

      {/* Gradiente fade para la foto */}
      <LinearGradient
        colors={['transparent', cardTheme.bg]}
        style={[styles.photoFade, { height: height * 0.15, bottom: height * 0.22, width }]}
      />

      {/* CAPA 5 — Banda inferior */}
      <View style={[styles.bottomBar, { height: height * 0.26, backgroundColor: shirt.primaryColor }]}>
        <View style={styles.nameRow}>
          <View>
            <Text style={styles.firstName}>{firstName}</Text>
            <Text style={styles.lastName}>{lastName.toUpperCase()}</Text>
          </View>
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>{position}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.statsRow}>
          <StatItem label="PJ" value={stats.pj} />
          <StatItem label="G" value={stats.g} />
          <StatItem label="GL" value={stats.gl} />
          <StatItem label="AST" value={stats.ast} />
        </View>

        <View style={[styles.separator, { opacity: 0.15 }]} />

        <View style={styles.footerRow}>
          <Text style={styles.teamName}>{teamName}</Text>
          <Text style={styles.eloText}>⚡ {elo}</Text>
        </View>
      </View>

      {/* CAPA 7 — Elementos esquina */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>{level}</Text>
      </View>

      <View style={styles.countryBadge}>
        <Text style={styles.flagText}>{countryFlag}</Text>
        <Text style={styles.teamInitials}>{teamName.substring(0, 3).toUpperCase()}</Text>
      </View>

      <View style={styles.logoFA}>
        <Text style={styles.logoFAText}>FA</Text>
      </View>
    </View>
  );
};

const StatItem = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    borderWidth: 3.5,
    overflow: 'hidden',
    position: 'relative',
  },
  bgNumber: {
    position: 'absolute',
    fontFamily: font.bebas,
    zIndex: 1,
  },
  shirtContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
  },
  playerPhoto: {
    position: 'absolute',
    zIndex: 3,
  },
  photoFade: {
    position: 'absolute',
    zIndex: 3,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingHorizontal: 14,
    zIndex: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  firstName: {
    fontFamily: font.dmRegular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  lastName: {
    fontFamily: font.bebas,
    fontSize: 24,
    color: 'white',
    letterSpacing: 1,
  },
  positionBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  positionText: {
    color: 'white',
    fontFamily: font.dmBold,
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: font.bebas,
    fontSize: 19,
    color: 'white',
  },
  statLabel: {
    fontFamily: font.dmRegular,
    fontSize: 9,
    color: 'white',
    opacity: 0.65,
    textTransform: 'uppercase',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontFamily: font.dmRegular,
    fontSize: 10,
    color: 'white',
    opacity: 0.7,
  },
  eloText: {
    fontFamily: font.dmBold,
    fontSize: 11,
    color: '#f59e0b',
  },
  levelBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 5,
  },
  levelText: {
    fontFamily: font.bebas,
    fontSize: 10,
    color: 'black',
  },
  countryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 5,
  },
  flagText: {
    fontSize: 18,
  },
  teamInitials: {
    fontFamily: font.bebas,
    fontSize: 12,
    color: 'white',
  },
  logoFA: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 4,
    borderRadius: 2,
    zIndex: 5,
  },
  logoFAText: {
    fontFamily: font.bebas,
    fontSize: 9,
    color: 'white',
    opacity: 0.6,
  },
});
