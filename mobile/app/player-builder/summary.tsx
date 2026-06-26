import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { colors, font, spacing, shadows } from '@/lib/theme';
import { PlayerProfile } from '@/modules/player-builder/types';
import { PlayerRepository } from '@/modules/player-builder/repositories/PlayerRepository';
import { AvatarPreview3D } from '@/modules/player-builder/components/AvatarPreview3D';
import { Ionicons } from '@expo/vector-icons';

export default function PlayerSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const player: PlayerProfile = React.useMemo(() => {
    if (params.player) {
      return JSON.parse(params.player as string);
    }
    return null;
  }, [params.player]);

  if (!player) return null;

  const handleSave = async () => {
    try {
      await PlayerRepository.savePlayer(player);
      Alert.alert('Éxito', 'Jugador guardado correctamente.', [
        { text: 'Ir a Mis Jugadores', onPress: () => router.push('/player-builder/list') },
        { text: 'Finalizar', onPress: () => router.push('/player-builder') }
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el jugador.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'RESUMEN DEL JUGADOR',
          headerTitleStyle: { fontFamily: font.extraBold, fontSize: 18, color: colors.white },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.previewContainerTop}>
          <AvatarPreview3D config={player.avatarConfig} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
             <View style={styles.overallContainer}>
                <Text style={styles.overallText}>{player.overall}</Text>
                <Text style={styles.overallLabel}>OVR</Text>
             </View>
             <View style={styles.infoContainer}>
                <Text style={styles.nameText}>{player.name}</Text>
                <Text style={styles.posText}>{player.position}</Text>
             </View>
          </View>

          <View style={styles.statsGrid}>
            <StatItem label="PAC" value={player.pace} />
            <StatItem label="SHO" value={player.shooting} />
            <StatItem label="PAS" value={player.passing} />
            <StatItem label="DRI" value={player.dribbling} />
            <StatItem label="DEF" value={player.defending} />
            <StatItem label="PHY" value={player.physical} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración del Avatar</Text>
          <View style={styles.configContainer}>
             <Text style={styles.configCode}>
               {JSON.stringify(player.avatarConfig, null, 2)}
             </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={24} color={colors.background} />
          <Text style={styles.saveButtonText}>Confirmar y Guardar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#1e293b' }]}
          onPress={() => router.push({
            pathname: '/player-builder/card',
            params: { player: JSON.stringify(player) }
          })}
        >
          <Ionicons name="id-card-outline" size={24} color={colors.white} />
          <Text style={[styles.saveButtonText, { color: colors.white }]}>Ver Carta Deportiva</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editButton} onPress={() => router.back()}>
          <Text style={styles.editButtonText}>Volver al Editor</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string, value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  overallContainer: {
    backgroundColor: colors.accent,
    width: 80,
    height: 100,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  overallText: {
    fontFamily: font.extraBold,
    fontSize: 42,
    color: colors.background,
  },
  overallLabel: {
    fontFamily: font.bold,
    fontSize: 12,
    color: colors.background,
    marginTop: -5,
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontFamily: font.extraBold,
    fontSize: 28,
    color: colors.white,
    textTransform: 'uppercase',
  },
  posText: {
    fontFamily: font.bold,
    fontSize: 18,
    color: colors.accent,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  statValue: {
    fontFamily: font.extraBold,
    fontSize: 22,
    color: colors.white,
  },
  statLabel: {
    fontFamily: font.medium,
    fontSize: 11,
    color: colors.textSubtle,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontFamily: font.extraBold,
    fontSize: 16,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  configContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  configCode: {
    color: colors.textSubtle,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  previewContainerTop: {
    marginBottom: spacing.xl,
  },
  saveButton: {
    backgroundColor: colors.accent,
    height: 60,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.glow,
  },
  saveButtonText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  editButton: {
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    color: colors.textSubtle,
    fontFamily: font.bold,
    fontSize: 14,
  },
});
