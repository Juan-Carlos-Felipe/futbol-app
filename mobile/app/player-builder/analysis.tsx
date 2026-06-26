import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Animated, Easing, Alert } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { colors, font, spacing } from '@/lib/theme';
import { FaceAnalysisService, FaceAnalysisError } from '@/modules/player-builder/services/FaceAnalysisService';
import { AvatarConfigGenerator } from '@/modules/player-builder/services/AvatarConfigGenerator';

const MESSAGES = [
  'Detectando rostro...',
  'Analizando proporciones...',
  'Calculando rasgos...',
  'Identificando tono de piel...',
  'Definiendo peinado...',
  'Creando jugador...',
];

export default function AvatarAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [progress] = useState(new Animated.Value(0));
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const runAnalysis = async () => {
      // Animación de la barra de progreso
      Animated.timing(progress, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(async () => {
        // Ejecutar análisis real
        try {
          const imageUri = (params.imageUri as string) || 'dummy-uri';
          const config = await FaceAnalysisService.analyzeSelfie(imageUri);
          router.replace({
            pathname: '/player-builder/editor',
            params: { initialConfig: JSON.stringify(config) }
          });
        } catch (error) {
          if (error instanceof FaceAnalysisError) {
            if (error.code === 'MODEL_ERROR') {
              Alert.alert('Aviso', 'No se pudo cargar el analizador facial. Se usará una configuración inicial editable.', [
                { text: 'Continuar', onPress: () => {
                  const config = AvatarConfigGenerator.generateRandom();
                  router.replace({
                    pathname: '/player-builder/editor',
                    params: { initialConfig: JSON.stringify(config) }
                  });
                }}
              ]);
            } else {
              Alert.alert('Error de Análisis', error.message, [
                { text: 'Volver a intentar', onPress: () => router.back() },
                { text: 'Crear manualmente', onPress: () => {
                  const config = AvatarConfigGenerator.generateRandom();
                  router.replace({
                    pathname: '/player-builder/editor',
                    params: { initialConfig: JSON.stringify(config) }
                  });
                }}
              ]);
            }
          } else {
            router.replace('/player-builder');
          }
        }
      });
    };

    runAnalysis();

    // Ciclo de mensajes
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev < MESSAGES.length - 1 ? prev + 1 : prev));
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.content}>
        <View style={styles.animationContainer}>
          {/* Placeholder para una animación visual */}
          <View style={styles.scannerLine} />
          <View style={styles.avatarSilhoutte}>
            <Text style={styles.silhouetteIcon}>👤</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.message}>{MESSAGES[messageIndex]}</Text>

          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>

          <Text style={styles.percentage}>
            {Math.floor(messageIndex * (100 / MESSAGES.length))}%
          </Text>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  animationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarSilhoutte: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(210, 181, 255, 0.3)',
  },
  silhouetteIcon: {
    fontSize: 80,
    opacity: 0.5,
  },
  scannerLine: {
    position: 'absolute',
    width: 220,
    height: 2,
    backgroundColor: colors.accent,
    zIndex: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
    // Podríamos animar esto también
  },
  statusContainer: {
    width: '100%',
    alignItems: 'center',
  },
  message: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 18,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  percentage: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 14,
  },
});
