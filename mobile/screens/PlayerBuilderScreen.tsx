// ✅ REDISEÑADO con theme.ts
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import PlayerBuilder from '@/components/avatar/PlayerBuilder';
import { avatarConfigService } from '@/services/avatarConfigService';
import { PlayerAvatarConfig } from '@/types/avatar';
import { colors } from '@/lib/theme';

export default function PlayerBuilderScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const [config, setConfig] = useState<PlayerAvatarConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function loadConfig() {
      try {
        const currentConfig = await avatarConfigService.getPlayerConfig(userId!);
        setConfig(currentConfig);
      } catch (error) {
        console.error('Error loading config', error);
        setConfig(avatarConfigService.getDefaultConfig());
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [userId]);

  const handleSave = async (newConfig: PlayerAvatarConfig) => {
    if (!userId) return;
    try {
      await avatarConfigService.savePlayerConfig(userId, newConfig);
      Alert.alert('Éxito', '¡Jugador personalizado con éxito!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración del jugador.');
    }
  };

  if (loading || !config) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PlayerBuilder
        initialConfig={config}
        onSave={handleSave}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  }
});
