import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { theme } from '@/lib/theme';
import { useMatchRequests } from '@/hooks/useMatchmaking';

export default function MatchmakingScreen() {
  const { requests, isLoading } = useMatchRequests();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TABLÓN DE RIVALES</Text>
        <Text style={styles.subtitle}>Encuentra un equipo para competir</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const team = item.teams;
          const stats = item.team_stats;
          const elo = stats?.elo || 1200;

          let eloColor = theme.colors.gray400;
          if (elo >= 1500) eloColor = theme.colors.gold;
          else if (elo >= 1200) eloColor = theme.colors.primary;
          else eloColor = theme.colors.draw;

          return (
            <TouchableOpacity style={styles.card}>
              <View style={[styles.eloBand, { backgroundColor: eloColor }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.teamName}>{team?.name || 'Equipo'}</Text>
                  <View style={[styles.eloBadge, { backgroundColor: eloColor + '20' }]}>
                    <Text style={[styles.eloText, { color: eloColor }]}>⚡ {elo}</Text>
                  </View>
                </View>

                <Text style={styles.matchMeta}>
                  📅 {item.preferred_date || 'Fecha por definir'} • 📍 {item.location_text || 'Lugar por definir'}
                </Text>

                <View style={styles.footer}>
                  <Text style={styles.statusText}>BUSCANDO RIVAL</Text>
                  <TouchableOpacity style={styles.challengeBtn}>
                    <Text style={styles.challengeText}>Retar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏟️</Text>
              <Text style={styles.emptyText}>No hay retos activos en este momento</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray50,
  },
  header: {
    backgroundColor: theme.colors.primaryDark,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 32,
    color: theme.colors.white,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.7,
    marginTop: 4,
  },
  list: {
    padding: 24,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    marginBottom: 16,
    ...theme.shadow.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  eloBand: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    color: theme.colors.gray900,
  },
  eloBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eloText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 12,
  },
  matchMeta: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.gray400,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
    paddingTop: 12,
  },
  statusText: {
    fontFamily: theme.fonts.display,
    fontSize: 12,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  challengeBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  challengeText: {
    color: theme.colors.white,
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.gray400,
    textAlign: 'center',
  },
});
