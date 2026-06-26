import React, { useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { colors, font, spacing, shadows } from '@/lib/theme';
import { PlayerProfile } from '@/modules/player-builder/types';
import { PlayerCardPreview } from '@/modules/player-builder/components/PlayerCardPreview';
import { PlayerCardExportService } from '@/modules/player-builder/services/PlayerCardExportService';
import { PlayerCardShareService } from '@/modules/player-builder/services/PlayerCardShareService';
import { PlayerRepository } from '@/modules/player-builder/repositories/PlayerRepository';
import { Ionicons } from '@expo/vector-icons';

export default function PlayerCardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cardRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);

  const player: PlayerProfile = React.useMemo(() => {
    if (params.player) {
      return JSON.parse(params.player as string);
    }
    return null;
  }, [params.player]);

  if (!player) return null;

  const handleShare = async () => {
    try {
      setSaving(true);
      const uri = await PlayerCardExportService.exportPlayerCardAsImage(cardRef);
      await PlayerCardShareService.sharePlayerCard(uri);
    } catch (e) {
      Alert.alert('Error', 'No se pudo compartir la carta.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToGallery = async () => {
    try {
      setSaving(true);
      const uri = await PlayerCardExportService.exportPlayerCardAsImage(cardRef);

      const updatedPlayer = { ...player, cardImageUri: uri };
      await PlayerRepository.savePlayer(updatedPlayer);

      Alert.alert('Éxito', 'Carta guardada correctamente en tu perfil.', [
        { text: 'Ir a Mis Jugadores', onPress: () => router.push('/player-builder/list') },
        { text: 'OK' }
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la imagen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'CARTA DEL JUGADOR',
          headerTitleStyle: { fontFamily: font.extraBold, fontSize: 18, color: colors.white },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.white,
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cardContainer}>
          <PlayerCardPreview ref={cardRef} player={player} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSaveToGallery}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Ionicons name="save-outline" size={24} color={colors.background} />
                <Text style={styles.primaryButtonText}>Guardar Carta</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleShare}
            disabled={saving}
          >
            <Ionicons name="share-social-outline" size={24} color={colors.white} />
            <Text style={styles.buttonText}>Compartir</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => router.push({
                  pathname: '/player-builder/editor',
                  params: { initialConfig: JSON.stringify(player.avatarConfig) }
              })}
            >
              <Text style={styles.smallButtonText}>Editar Atributos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => router.replace('/player-builder')}
            >
              <Text style={styles.smallButtonText}>Nuevo Jugador</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  cardContainer: {
    marginBottom: spacing.xxl,
    ...shadows.glow,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  buttonText: {
    color: colors.white,
    fontFamily: font.extraBold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  smallButton: {
    padding: spacing.md,
  },
  smallButtonText: {
    color: colors.textSubtle,
    fontFamily: font.bold,
    fontSize: 14,
  },
});
