import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';

const SKILLS = [
  { key: 'attack', label: 'Ataque', emoji: '⚡' },
  { key: 'defense', label: 'Defensa', emoji: '🛡️' },
  { key: 'speed', label: 'Velocidad', emoji: '💨' },
  { key: 'stamina', label: 'Resistencia', emoji: '❤️' },
] as const;

export default function ProfileScreen() {
  const { userId } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

  const skills = profile?.skills ?? { attack: 50, defense: 50, speed: 50, stamina: 50 };

  async function pickAndUploadAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    setUploadingAvatar(true);
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fileExt = 'jpg';
      const fileName = `${userId}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const response = await fetch(compressed.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
    } catch (e: any) {
      Alert.alert('Error al subir imagen', e.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    if (!displayName.trim()) return;
    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() });
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploadingAvatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{ fontSize: 40 }}>👤</Text>
            </View>
          )}
          {uploadingAvatar && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <Text style={styles.changePhoto}>Cambiar foto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {editing ? (
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nombre de jugador"
              placeholderTextColor="#666"
              autoFocus
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { setDisplayName(profile?.display_name ?? ''); setEditing(true); }}
          >
            <Text style={styles.name}>{profile?.display_name}</Text>
            <Text style={styles.editHint}>Toca para editar ✏️</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habilidades</Text>
        {SKILLS.map(({ key, label, emoji }) => (
          <View key={key} style={styles.skillRow}>
            <Text style={styles.skillLabel}>{emoji} {label}</Text>
            <View style={styles.skillBarBg}>
              <View style={[styles.skillBarFill, { width: `${skills[key]}%` }]} />
            </View>
            <Text style={styles.skillValue}>{skills[key]}</Text>
          </View>
        ))}
        <Text style={styles.skillNote}>
          * Las habilidades suben con la actividad en partidos
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#22c55e' },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1a1d27', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#2a2d3a'
  },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 50,
    alignItems: 'center', justifyContent: 'center'
  },
  changePhoto: { color: '#22c55e', marginTop: 8, fontSize: 13 },
  section: { marginBottom: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff' },
  editHint: { color: '#666', fontSize: 12, marginTop: 2 },
  email: { color: '#888', fontSize: 14, marginTop: 4 },
  input: {
    backgroundColor: '#1a1d27', color: '#fff', borderRadius: 10,
    padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#2a2d3a'
  },
  saveBtn: {
    backgroundColor: '#22c55e', borderRadius: 10, padding: 12, alignItems: 'center', minWidth: 44
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 16 },
  skillRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  skillLabel: { color: '#fff', fontSize: 14, width: 110 },
  skillBarBg: { flex: 1, height: 6, backgroundColor: '#1a1d27', borderRadius: 3, overflow: 'hidden' },
  skillBarFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  skillValue: { color: '#888', fontSize: 12, width: 30, textAlign: 'right' },
  skillNote: { color: '#444', fontSize: 11, marginTop: 8, fontStyle: 'italic' },
  logoutBtn: { borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: '600' },
});
