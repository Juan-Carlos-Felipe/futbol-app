import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { colors, font, spacing, shadows } from '@/lib/theme';
import { PlayerProfile } from '@/modules/player-builder/types';
import { PlayerRepository } from '@/modules/player-builder/repositories/PlayerRepository';
import { Ionicons } from '@expo/vector-icons';

export default function MyPlayersScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlayers = async () => {
    setLoading(true);
    const data = await PlayerRepository.getPlayers();
    setPlayers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar Jugador',
      '¿Estás seguro de que quieres eliminar a este jugador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await PlayerRepository.deletePlayer(id);
            loadPlayers();
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: PlayerProfile }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <View style={styles.miniBadge}>
          <Text style={styles.miniOvr}>{item.overall}</Text>
        </View>
        <View>
          <Text style={styles.playerName}>{item.name}</Text>
          <Text style={styles.playerPos}>{item.position}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push({
            pathname: '/player-builder/editor',
            params: { initialConfig: JSON.stringify(item.avatarConfig) }
          })}
        >
          <Ionicons name="create-outline" size={20} color={colors.accent} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.danger }]}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'MIS JUGADORES',
          headerTitleStyle: { fontFamily: font.extraBold, fontSize: 18, color: colors.white },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.white,
        }}
      />

      <View style={styles.content}>
        {players.length > 0 ? (
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={loadPlayers}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aún no tienes jugadores</Text>
            <Text style={styles.emptySubtitle}>Crea tu primer jugador desde el menú principal.</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/player-builder')}
            >
              <Text style={styles.createBtnText}>Ir a Crear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  miniBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniOvr: {
    fontFamily: font.extraBold,
    fontSize: 20,
    color: colors.background,
  },
  playerName: {
    fontFamily: font.bold,
    fontSize: 16,
    color: colors.white,
  },
  playerPos: {
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    color: colors.white,
    fontFamily: font.extraBold,
    fontSize: 20,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  createBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  createBtnText: {
    color: colors.background,
    fontFamily: font.extraBold,
    textTransform: 'uppercase',
  },
});
