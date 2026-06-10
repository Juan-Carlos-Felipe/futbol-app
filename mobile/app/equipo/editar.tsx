import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
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
      Alert.alert('Ano invalido', 'Ingresa un ano de fundacion valido.');
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
      Alert.alert('Perfil actualizado!', 'Los cambios fueron guardados.');
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar.');
    }
  }

  if (checkingAccess || isLoading) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  }

  if (!teamId || !isCaptain) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.lockTitle}>Solo el capitan puede editar este perfil</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Editar perfil publico</Text>

      <Field label="Bio">
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Conta sobre tu equipo..."
          placeholderTextColor="#9ca3af"
          value={form.bio}
          onChangeText={(value) => updateForm('bio', value)}
          multiline
          maxLength={500}
        />
        <Text style={styles.counter}>{form.bio.length.toLocaleString('es-CL')}/500</Text>
      </Field>

      <Field label="Zona home">
        <TextInput
          style={styles.input}
          placeholder="ej: Providencia, Santiago"
          placeholderTextColor="#9ca3af"
          value={form.homeZone}
          onChangeText={(value) => updateForm('homeZone', value)}
        />
      </Field>

      <Field label="Ano de fundacion">
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form.foundedYear}
          onChangeText={(value) => updateForm('foundedYear', value.replace(/\D/g, ''))}
        />
      </Field>

      <Field label="Formato preferido">
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

      <Field label="Superficie preferida">
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

      <Field label="Instagram">
        <View style={styles.instagramInput}>
          <Text style={styles.instagramPrefix}>@</Text>
          <TextInput
            style={styles.instagramTextInput}
            placeholder="mi_equipo"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            value={form.instagram}
            onChangeText={(value) => updateForm('instagram', value.replace('@', ''))}
          />
        </View>
      </Field>

      <View style={styles.switchCard}>
        <View style={styles.switchText}>
          <Text style={styles.switchTitle}>Perfil publico</Text>
          <Text style={styles.switchDescription}>
            Si esta OFF, el equipo no aparece en busquedas ni ranking.
          </Text>
        </View>
        <Switch
          value={form.isPublic}
          onValueChange={(value) => updateForm('isPublic', value)}
          trackColor={{ false: '#d1d5db', true: '#bbf7d0' }}
          thumbColor={form.isPublic ? '#16a34a' : '#f9fafb'}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Guardando...' : 'Guardar cambios'}</Text>
      </TouchableOpacity>
    </ScrollView>
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
  screen: { backgroundColor: '#f3f4f6', flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  centeredScreen: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#111827', fontSize: 26, fontWeight: '900', marginBottom: 20 },
  lockTitle: { color: '#111827', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  field: { marginBottom: 16 },
  label: { color: '#111827', fontSize: 14, fontWeight: '900', marginBottom: 8 },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  counter: { color: '#9ca3af', fontSize: 12, marginTop: 6, textAlign: 'right' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  pillText: { color: '#4b5563', fontSize: 13, fontWeight: '900' },
  pillTextActive: { color: '#ffffff' },
  instagramInput: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  instagramPrefix: { color: '#6b7280', fontSize: 16, fontWeight: '900', marginRight: 2 },
  instagramTextInput: { color: '#111827', flex: 1, fontSize: 15, paddingVertical: 13 },
  switchCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 20,
    padding: 16,
  },
  switchText: { flex: 1, paddingRight: 12 },
  switchTitle: { color: '#111827', fontSize: 15, fontWeight: '900' },
  switchDescription: { color: '#6b7280', fontSize: 12, lineHeight: 17, marginTop: 3 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  primaryButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
