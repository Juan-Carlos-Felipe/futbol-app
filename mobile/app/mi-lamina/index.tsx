import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { PlayerCard } from '@/components/player-card/PlayerCard';
import { PhotoCapture } from '@/components/player-card/PhotoCapture';
import { ShirtSelector } from '@/components/player-card/ShirtSelector';
import { Shirt, FREE_SHIRTS, getShirtById } from '@/lib/shirts';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePlayerStats } from '@/hooks/useMatchmaking';
import { useMyTeams } from '@/hooks/useTeams';
import { supabase } from '@/lib/supabase';
import { colors, font, spacing, radii, shadows } from '@/lib/theme';

const { width: screenWidth } = Dimensions.get('window');

type Step = 'view' | 'photo' | 'customize' | 'preview' | 'saved';

export default function MiLaminaScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { data: profile } = useProfile();
  const { data: teams } = useMyTeams();
  const { stats: playerStats } = usePlayerStats(userId);

  const [step, setStep] = useState<Step>('view');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedShirt, setSelectedShirt] = useState<Shirt>(FREE_SHIRTS[0]);
  const [shirtNumber, setShirtNumber] = useState(10);
  const [position, setPosition] = useState<'DEL' | 'MED' | 'DEF' | 'ARQ'>('DEL');
  const [countryFlag, setCountryFlag] = useState('🇦🇷');
  const [cardStyle, setCardStyle] = useState<'classic' | 'dark' | 'gold' | 'ice' | 'fire'>('classic');
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingCard, setHasExistingCard] = useState(false);

  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    if (profile) {
      if (profile.card_photo_url) {
        setPhotoUri(profile.card_photo_url);
        setSelectedShirt(getShirtById(profile.card_shirt_id));
        setShirtNumber(profile.card_shirt_number || 10);
        setPosition(profile.card_position || 'DEL');
        setCountryFlag(profile.card_country_flag || '🇦🇷');
        setCardStyle(profile.card_style || 'classic');
        setHasExistingCard(true);
      }
    }
  }, [profile]);

  const saveCard = async () => {
    if (!userId || !photoUri) return;
    setIsSaving(true);
    try {
      let finalPhotoUrl = photoUri;

      // Si es una foto local (nueva), subirla a Storage
      if (photoUri.startsWith('file://') || photoUri.startsWith('content://')) {
        const fileName = `${userId}/card-${Date.now()}.png`;
        const response = await fetch(photoUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('player-cards')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('player-cards')
          .getPublicUrl(fileName);

        finalPhotoUrl = publicUrl;
      }

      // Guardar configuración en users
      const { error } = await supabase
        .from('users')
        .update({
          card_photo_url: finalPhotoUrl,
          card_shirt_id: selectedShirt.id,
          card_shirt_number: shirtNumber,
          card_position: position,
          card_country_flag: countryFlag,
          card_style: cardStyle,
          card_created_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      setStep('saved');
      setHasExistingCard(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar la lámina');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('¡Éxito!', 'Lámina guardada en tu galería');
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar la imagen');
    }
  };

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Compartir mi lámina',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir');
    }
  };

  if (step === 'photo') {
    return (
      <PhotoCapture
        onCapture={(uri) => {
          setPhotoUri(uri);
          setStep('customize');
        }}
        onClose={() => setStep('view')}
      />
    );
  }

  const teamName = (teams as any)?.[0]?.teams?.name || 'Libre';
  const elo = playerStats?.elo || 1000;
  const level = `NIVEL ${Math.floor(elo / 200)}`;

  const renderCard = (scale = 1) => (
    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
      <PlayerCard
        photoUri={photoUri!}
        playerName={profile?.display_name || 'Jugador'}
        teamName={teamName}
        shirt={selectedShirt}
        shirtNumber={shirtNumber}
        position={position}
        stats={{
          pj: playerStats?.matches_played || 0,
          g: playerStats?.wins || 0,
          gl: playerStats?.goals || 0,
          ast: playerStats?.assists || 0,
        }}
        elo={elo}
        level={level}
        countryFlag={countryFlag}
        cardStyle={cardStyle}
        width={screenWidth * 0.8 * scale}
        height={screenWidth * 0.8 * 1.4 * scale}
      />
    </ViewShot>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MI LÁMINA</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'view' && (
        <ScrollView contentContainerStyle={styles.centerContent}>
          {hasExistingCard ? (
            <>
              <View style={styles.cardPreviewWrap}>
                {renderCard()}
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setStep('customize')}>
                  <Text style={styles.actionBtnText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={handleShare}>
                  <Text style={styles.actionBtnText}>📤 Compartir</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => setStep('photo')}>
                <Text style={styles.outlineBtnText}>🔄 Nueva foto</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Ionicons name="card-outline" size={80} color="rgba(255,255,255,0.2)" />
              </View>
              <Text style={styles.emptyTitle}>Creá tu lámina de jugador</Text>
              <Text style={styles.emptySub}>Tu foto real · Tu camiseta · Compartila</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => setStep('photo')}>
                <Text style={styles.createBtnText}>🎴 Crear mi lámina</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {step === 'customize' && (
        <View style={{ flex: 1 }}>
          <View style={styles.miniCardPreview}>
            {renderCard(0.5)}
          </View>
          <ScrollView style={styles.optionsArea} contentContainerStyle={{ paddingBottom: 100 }}>
            <Text style={styles.sectionTitle}>Camiseta</Text>
            <ShirtSelector
              currentShirtId={selectedShirt.id}
              ownedShirtIds={[]}
              userLevel={Math.floor(elo / 200)}
              onChange={setSelectedShirt}
            />

            <Text style={styles.sectionTitle}>Número</Text>
            <View style={styles.numberRow}>
              <TouchableOpacity onPress={() => setShirtNumber(Math.max(1, shirtNumber - 1))} style={styles.numControl}>
                <Ionicons name="remove" size={24} color="white" />
              </TouchableOpacity>
              <TextInput
                style={styles.numInput}
                value={shirtNumber.toString()}
                onChangeText={(v) => setShirtNumber(parseInt(v) || 1)}
                keyboardType="numeric"
              />
              <TouchableOpacity onPress={() => setShirtNumber(Math.min(99, shirtNumber + 1))} style={styles.numControl}>
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Posición</Text>
            <View style={styles.pillsRow}>
              {(['DEL', 'MED', 'DEF', 'ARQ'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPosition(p)}
                  style={[styles.pill, position === p && styles.activePill]}
                >
                  <Text style={[styles.pillText, position === p && styles.activePillText]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>País</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flagRow}>
              {['🇨🇱', '🇦🇷', '🇧🇷', '🇺🇾', '🇵🇪', '🇨🇴', '🇧🇴', '🇵🇾', '🇲🇽', '🇪🇨'].map((f) => (
                <TouchableOpacity key={f} onPress={() => setCountryFlag(f)} style={[styles.flagItem, countryFlag === f && styles.activeFlag]}>
                  <Text style={{ fontSize: 24 }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Estilo de tarjeta</Text>
            <View style={styles.styleRow}>
               {(['classic', 'dark', 'gold', 'ice', 'fire'] as const).map((s) => (
                 <TouchableOpacity key={s} onPress={() => setCardStyle(s)} style={[styles.stylePill, cardStyle === s && styles.activePill]}>
                   <Text style={[styles.pillText, cardStyle === s && styles.activePillText]}>{s.toUpperCase()}</Text>
                 </TouchableOpacity>
               ))}
            </View>
          </ScrollView>
          <View style={styles.footerAction}>
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('preview')}>
              <Text style={styles.nextBtnText}>Ver resultado final →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'preview' && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>¿Así quedó tu lámina?</Text>
          <View style={styles.cardPreviewWrap}>
            {renderCard()}
          </View>
          <TouchableOpacity style={[styles.nextBtn, { marginTop: 30 }]} onPress={saveCard} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="white" /> : <Text style={styles.nextBtnText}>✅ Guardar y compartir</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setStep('customize')}>
            <Text style={styles.outlineBtnText}>🔄 Seguir editando</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'saved' && (
        <View style={styles.savedContainer}>
          <Text style={styles.savedTitle}>¡Tu lámina está lista! 🎴</Text>
          <View style={[styles.cardPreviewWrap, { transform: [{ scale: 0.8 }] }]}>
            {renderCard()}
          </View>
          <View style={styles.savedActions}>
            <TouchableOpacity style={styles.savedBtn} onPress={handleExport}>
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={styles.savedBtnText}>Guardar en galería</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.savedBtn} onPress={handleShare}>
              <Ionicons name="logo-whatsapp" size={20} color="white" />
              <Text style={styles.savedBtnText}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/laminas')}>
              <Text style={styles.outlineBtnText}>👥 Ver láminas de mi equipo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 100,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40
  },
  headerTitle: { color: 'white', fontFamily: font.bebas, fontSize: 24 },
  backBtn: { padding: 8 },
  centerContent: { alignItems: 'center', padding: 20 },
  cardPreviewWrap: {
    ...shadows.card,
    marginVertical: 20,
    alignItems: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 15, marginVertical: 20 },
  actionBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  primaryBtn: { backgroundColor: colors.success, borderColor: colors.success },
  actionBtnText: { color: 'white', fontFamily: font.dmBold, fontSize: 16 },
  outlineBtn: {
    marginTop: 10,
    padding: 15,
    borderRadius: radii.md,
    alignItems: 'center'
  },
  outlineBtnText: { color: colors.textSubtle, fontFamily: font.dmMedium, fontSize: 14 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIllustration: { marginBottom: 20 },
  emptyTitle: { color: 'white', fontFamily: font.bebas, fontSize: 28, textAlign: 'center' },
  emptySub: { color: colors.textSubtle, fontSize: 16, textAlign: 'center', marginBottom: 40 },
  createBtn: { backgroundColor: colors.success, paddingHorizontal: 30, paddingVertical: 18, borderRadius: radii.lg },
  createBtnText: { color: 'white', fontFamily: font.dmBold, fontSize: 18 },
  miniCardPreview: { height: screenWidth * 0.6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  optionsArea: { flex: 1, padding: 20 },
  sectionTitle: { color: 'white', fontFamily: font.bebas, fontSize: 18, marginTop: 20, marginBottom: 10 },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  numControl: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  numInput: { flex: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, color: 'white', textAlign: 'center', fontSize: 18, fontFamily: font.dmBold },
  pillsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.sm, backgroundColor: 'rgba(255,255,255,0.1)' },
  activePill: { backgroundColor: colors.success },
  pillText: { color: 'white', fontFamily: font.dmMedium },
  activePillText: { fontFamily: font.dmBold },
  flagRow: { flexDirection: 'row' },
  flagItem: { padding: 10, borderRadius: 10, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  activeFlag: { borderColor: colors.success, backgroundColor: 'rgba(51, 214, 159, 0.1)' },
  styleRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  stylePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  footerAction: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  nextBtn: { backgroundColor: colors.success, padding: 18, borderRadius: radii.md, alignItems: 'center' },
  nextBtnText: { color: 'white', fontFamily: font.dmBold, fontSize: 18 },
  previewContainer: { flex: 1, padding: 20, alignItems: 'center' },
  previewTitle: { color: 'white', fontFamily: font.bebas, fontSize: 22, textAlign: 'center' },
  savedContainer: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  savedTitle: { color: colors.success, fontFamily: font.bebas, fontSize: 32, textAlign: 'center' },
  savedActions: { width: '100%', gap: 10 },
  savedBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', gap: 10 },
  savedBtnText: { color: 'white', fontFamily: font.dmMedium },
});
