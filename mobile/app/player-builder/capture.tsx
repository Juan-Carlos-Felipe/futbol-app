import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { colors, font, spacing, shadows } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function SelfieCaptureScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara para capturar la selfie.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    if (!image) return;
    // En una implementación real pasaríamos la imagen al análisis
    router.push('/player-builder/analysis');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'CAPTURAR SELFIE',
          headerTitleStyle: { fontFamily: font.extraBold, fontSize: 18, color: colors.white },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.white,
        }}
      />

      <View style={styles.content}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Asegúrate de estar en un lugar bien iluminado y de frente a la cámara.
          </Text>
        </View>

        <View style={styles.previewContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="person-outline" size={100} color={colors.textMuted} />
              <Text style={styles.placeholderText}>Sin imagen seleccionada</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          {!image ? (
            <>
              <TouchableOpacity style={styles.mainButton} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color={colors.background} />
                <Text style={styles.mainButtonText}>Tomar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
                <Ionicons name="images-outline" size={24} color={colors.white} />
                <Text style={styles.secondaryButtonText}>Elegir de Galería</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.mainButton} onPress={handleContinue}>
                <Text style={styles.mainButtonText}>Continuar al Análisis</Text>
                <Ionicons name="arrow-forward" size={24} color={colors.background} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.danger }]} onPress={() => setImage(null)}>
                <Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Repetir Foto</Text>
              </TouchableOpacity>
            </>
          )}
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
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(210, 181, 255, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(210, 181, 255, 0.2)',
  },
  instructions: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontFamily: font.medium,
    fontSize: 16,
    marginTop: spacing.md,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  mainButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mainButtonText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.white,
    fontFamily: font.extraBold,
    fontSize: 16,
    textTransform: 'uppercase',
  },
});
