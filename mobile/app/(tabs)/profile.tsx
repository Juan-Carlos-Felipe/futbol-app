import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { theme } from '@/lib/theme';
import { FifaCard } from '@/components/ui/FifaCard';
import { StatCard } from '@/components/ui/StatCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ResultBadge } from '@/components/ui/ResultBadge';

const { width } = Dimensions.get('window');

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
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const skills = profile?.skills ?? { attack: 50, defense: 50, speed: 50, stamina: 50 };

  // Dummy data for FIFA stats and historical matches
  const fifaStats = {
    pas: skills.attack || 50,
    vel: skills.speed || 50,
    tir: skills.attack || 50,
    reg: skills.speed || 50,
    def: skills.defense || 50,
    fis: skills.stamina || 50,
  };
  const rating = Math.round((fifaStats.pas + fifaStats.vel + fifaStats.tir + fifaStats.reg + fifaStats.def + fifaStats.fis) / 6);

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
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploadingAvatar} style={styles.avatarContainer}>
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
          </TouchableOpacity>

          <View style={styles.nameSection}>
            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Nombre"
                  placeholderTextColor={theme.colors.gray400}
                  autoFocus
                />
                <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                  <Text style={styles.saveBtnText}>✓</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setDisplayName(profile?.display_name ?? ''); setEditing(true); }}>
                <Text style={styles.name}>{profile?.display_name || 'Jugador'}</Text>
                <Text style={styles.positionText}>DELANTERO • EQUIPO GALÁCTICOS</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.fifaCardWrapper}>
          <FifaCard
            name={profile?.display_name || 'Jugador'}
            rating={rating}
            position="DEL"
            stats={fifaStats}
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <StatCard value={12} label="Ganados" type="win" />
          <StatCard value={4} label="Perdidos" type="loss" />
          <StatCard value={2} label="Empates" type="draw" />
        </View>

        <View style={[styles.statsRow, { marginTop: 12 }]}>
          <StatCard value={18} label="Partidos" type="neutral" />
          <StatCard value={3} label="Racha" type="gold" />
          <StatCard value={1240} label="ELO" type="gold" />
        </View>

        <View style={styles.historySection}>
          <SectionHeader
            title="HISTORIAL"
            subtitle="Tus últimos encuentros"
            action={{ label: 'Ver todo', onPress: () => {} }}
          />

          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <ResultBadge result={i % 3 === 0 ? 'loss' : i % 2 === 0 ? 'draw' : 'win'} size="sm" />
                <Text style={styles.historyMatchText}>vs Los Troncos FC</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyScore}>3 - 1</Text>
                <Text style={styles.historyDate}>12 May</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  heroSection: {
    backgroundColor: theme.colors.primaryDark,
    height: 300,
    paddingTop: 60,
    paddingHorizontal: 24,
    flexDirection: 'row',
    overflow: 'visible',
    zIndex: 10,
  },
  heroContent: {
    flex: 1,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: theme.colors.gold,
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    marginTop: 8,
  },
  name: {
    fontFamily: theme.fonts.display,
    fontSize: 36,
    color: theme.colors.white,
  },
  positionText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.7,
  },
  editRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
    color: theme.colors.white,
    flex: 1,
    fontFamily: theme.fonts.body,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: { color: theme.colors.white, fontWeight: '700' },
  fifaCardWrapper: {
    position: 'absolute',
    right: -20,
    top: 40,
    transform: [{ scale: 0.85 }],
  },
  content: {
    padding: 24,
    paddingTop: 32,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  historySection: {
    marginTop: 32,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyMatchText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: theme.colors.gray900,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyScore: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.gray900,
  },
  historyDate: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.gray400,
  },
  logoutBtn: {
    marginTop: 40,
    borderWidth: 1,
    borderColor: theme.colors.loss,
    borderRadius: theme.radius.md,
    padding: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutText: {
    color: theme.colors.loss,
    fontFamily: 'DMSans-Bold',
  },
});
