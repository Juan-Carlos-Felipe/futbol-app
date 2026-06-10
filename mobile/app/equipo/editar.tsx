// ✅ REDISEÑADO con theme.ts
import { useEffect, useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useEditableTeamProfile,
  useUpsertTeamPublicProfile,
} from '@/hooks/useMatchmaking';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Ionicons } from '@expo/vector-icons';

type EditForm = {
  bio: string;
  homeZone: string;
  foundedYear: string;
  preferredSize: string | null;
  preferredSurface: string | null;
  instagram: string;
  isPublic: boolean;
};

const SIZE_OPTIONS = ['F5', 'F7', 'F11'];
const SURFACE_OPTIONS = ['Pasto sintetico', 'Cemento'];

export default function EditTeamPublicProfileScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { profile, isLoading } = useEditableTeamProfile(teamId);
  const { saveProfile, isSaving } = useUpsertTeamPublicProfile(teamId);
  const [form, setForm] = useState<EditForm>({
    bio: '',
    homeZone: '',
    foundedYear: '',
    preferredSize: null,
    preferredSurface: null,
    instagram: '',
    isPublic: true,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchCaptainTeam = async () => {
      setCheckingAccess(true);
      const { data } = await supabase
        .from('team_members')
        .select('team_id, teams (created_by)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle<{
          team_id: string;
          teams: { created_by: string | null } | null;
        }>();

      setTeamId(data?.team_id ?? null);
      setIsCaptain(data?.teams?.created_by === userId);
      setCheckingAccess(false);
    };

    fetchCaptainTeam();
  }, [userId]);

  useEffect(() => {
    if (!profile) return;

    setForm({
      bio: profile.profile?.bio ?? '',
      homeZone: profile.profile?.home_zone ?? '',
      foundedYear: profile.profile?.founded_year?.toString() ?? '',
      preferredSize: profile.profile?.preferred_size ?? null,
      preferredSurface: profile.profile?.preferred_surface ?? null,
      instagram: profile.profile?.social_instagram?.replace('@', '') ?? '',
      isPublic: profile.profile?.is_public ?? true,
    });
  }, [profile]);

  function updateForm<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (!teamId) return;

    const foundedYear = form.foundedYear.trim()
      ? Number.parseInt(form.foundedYear.trim(), 10)
      : null;

    if (foundedYear !== null && Number.isNaN(foundedYear)) {
      Alert.alert('Año inválido', 'Ingresa un año de fundación válido.');
      return;
    }

    try {
      await saveProfile({
        bio: form.bio.trim() || null,
        home_zone: form.homeZone.trim() || null,
        founded_year: foundedYear,
        preferred_size: form.preferredSize,
        preferred_surface: form.preferredSurface,
        social_instagram: form.instagram.trim()
          ? `@${form.instagram.replace('@', '').trim()}`
          : null,
        is_public: form.isPublic,
      });
      Alert.alert('¡Perfil actualizado!', 'Los cambios fueron guardados.');
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar.');
    }
  }

  if (checkingAccess || isLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!teamId || !isCaptain) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.lockTitle}>Solo el capitán puede editar este perfil</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'EDITAR PERFIL',
        headerStyle: { backgroundColor: theme.colors.primaryDark },
        headerTitleStyle: { fontFamily: theme.fonts.bebas, color: theme.colors.white },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        ),
        headerShown: true
      }} />

      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <SectionHeader title="Información Pública" />

        <Field label="BIO DEL EQUIPO">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Cuenta sobre la historia de tu equipo..."
            placeholderTextColor={theme.colors.gray}
            value={form.bio}
            onChangeText={(value) => updateForm('bio', value)}
            multiline
            maxLength={500}
          />
          <Text style={styles.counter}>{form.bio.length}/500</Text>
        </Field>

        <Field label="ZONA HOME">
          <TextInput
            style={styles.input}
            placeholder="ej: Providencia, Santiago"
            placeholderTextColor={theme.colors.gray}
            value={form.homeZone}
            onChangeText={(value) => updateForm('homeZone', value)}
          />
        </Field>

        <Field label="AÑO DE FUNDACIÓN">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.foundedYear}
            onChangeText={(value) => updateForm('foundedYear', value.replace(/\D/g, ''))}
          />
        </Field>

        <SectionHeader title="Preferencias de Juego" />

        <Field label="FORMATO PREFERIDO">
          <View style={styles.pills}>
            {SIZE_OPTIONS.map((option) => (
              <Pill
                key={option}
                label={option}
                active={form.preferredSize === option}
                onPress={() => updateForm('preferredSize', option)}
              />
            ))}
          </View>
        </Field>

        <Field label="SUPERFICIE PREFERIDA">
          <View style={styles.pills}>
            {SURFACE_OPTIONS.map((option) => (
              <Pill
                key={option}
                label={option}
                active={form.preferredSurface === option}
                onPress={() => updateForm('preferredSurface', option)}
              />
            ))}
          </View>
        </Field>

        <SectionHeader title="Redes Sociales" />

        <Field label="INSTAGRAM">
          <View style={styles.instagramInput}>
            <Text style={styles.instagramPrefix}>@</Text>
            <TextInput
              style={styles.instagramTextInput}
              placeholder="nombre_equipo"
              placeholderTextColor={theme.colors.gray}
              autoCapitalize="none"
              value={form.instagram}
              onChangeText={(value) => updateForm('instagram', value.replace('@', ''))}
            />
          </View>
        </Field>

        <View style={styles.switchCard}>
          <View style={styles.switchText}>
            <Text style={styles.switchTitle}>Perfil Público</Text>
            <Text style={styles.switchDescription}>
              Si está desactivado, el equipo no aparecerá en búsquedas ni ranking.
            </Text>
          </View>
          <Switch
            value={form.isPublic}
            onValueChange={(value) => updateForm('isPublic', value)}
            trackColor={{ false: theme.colors.gray100, true: '#bbf7d0' }}
            thumbColor={form.isPublic ? theme.colors.primary : theme.colors.white}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  screen: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  centeredScreen: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  lockTitle: { color: theme.colors.dark, fontSize: 18, fontFamily: theme.fonts.dmSansBold, textAlign: 'center' },
  field: { marginBottom: 20 },
  label: { color: theme.colors.gray, fontSize: 11, fontFamily: theme.fonts.dmSansBold, marginBottom: 8 },
  input: {
    backgroundColor: theme.colors.gray100,
    borderRadius: 12,
    color: theme.colors.dark,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: theme.fonts.dmSans,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  counter: { color: theme.colors.gray, fontSize: 11, marginTop: 6, textAlign: 'right', fontFamily: theme.fonts.dmSans },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.gray100,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pillText: { color: theme.colors.gray, fontSize: 13, fontFamily: theme.fonts.dmSansBold },
  pillTextActive: { color: theme.colors.white },
  instagramInput: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  instagramPrefix: { color: theme.colors.gray, fontSize: 16, fontFamily: theme.fonts.dmSansBold, marginRight: 2 },
  instagramTextInput: { color: theme.colors.dark, flex: 1, fontSize: 15, paddingVertical: 14, fontFamily: theme.fonts.dmSans },
  switchCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 32,
    padding: 20,
    ...theme.shadow.sm,
  },
  switchText: { flex: 1, paddingRight: 12 },
  switchTitle: { color: theme.colors.dark, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
  switchDescription: { color: theme.colors.gray, fontSize: 12, lineHeight: 18, marginTop: 4, fontFamily: theme.fonts.dmSans },
  saveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: theme.colors.white, fontSize: 16, fontFamily: theme.fonts.dmSansBold },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  primaryButtonText: { color: theme.colors.white, fontSize: 14, fontFamily: theme.fonts.dmSansBold },
});
