import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { colors, font, spacing, shadows } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function PlayerBuilderHome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'PLAYER BUILDER AI',
          headerTitleStyle: { fontFamily: font.extraBold, fontSize: 20, color: colors.white },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.white,
          headerLeft: () => (
             <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
               <Ionicons name="arrow-back" size={24} color={colors.white} />
             </TouchableOpacity>
          )
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Crea tu leyenda futbolística con tecnología avanzada.</Text>
        </View>

        <View style={styles.menuContainer}>
          <MenuButton
            title="Crear desde Selfie"
            subtitle="Análisis facial por IA"
            icon="camera-outline"
            onPress={() => router.push('/player-builder/capture')}
            primary
          />

          <MenuButton
            title="Creación Manual"
            subtitle="Personaliza cada detalle"
            icon="create-outline"
            onPress={() => router.push('/player-builder/editor')}
          />

          <MenuButton
            title="Mis Jugadores"
            subtitle="Gestiona tu plantilla"
            icon="people-outline"
            onPress={() => router.push('/player-builder/list')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuButton({ title, subtitle, icon, onPress, primary }: any) {
  return (
    <TouchableOpacity
      style={[styles.button, primary && styles.primaryButton]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.buttonIcon}>
        <Ionicons name={icon} size={32} color={primary ? colors.background : colors.accent} />
      </View>
      <View style={styles.buttonTextContainer}>
        <Text style={[styles.buttonTitle, primary && styles.primaryButtonTitle]}>{title}</Text>
        <Text style={[styles.buttonSubtitle, primary && styles.primaryButtonSubtitle]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={primary ? colors.background : colors.textSubtle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  subtitle: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  menuContainer: {
    gap: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  buttonIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    color: colors.white,
    fontFamily: font.extraBold,
    fontSize: 18,
    textTransform: 'uppercase',
  },
  primaryButtonTitle: {
    color: colors.background,
  },
  buttonSubtitle: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 13,
    marginTop: 2,
  },
  primaryButtonSubtitle: {
    color: 'rgba(10, 17, 29, 0.7)',
  },
});
