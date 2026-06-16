import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { colors, font, radii, shadows } from '@/lib/theme';
import FaceCapture from './FaceCapture';
import TraitSelector from './TraitSelector';
import AvatarComposer, { AvatarPose } from './AvatarComposer';
import { FaceTraits } from '@/lib/faceStylization';

type Step = 'photo' | 'traits' | 'preview' | 'saved';

interface AvatarSetupProps {
  userId: string;
  onClose: () => void;
  onComplete: () => void;
}

const POSES: AvatarPose[] = ['arms_crossed', 'jogging', 'stretching', 'idle', 'warmup'];
const POSE_LABELS: Record<AvatarPose, string> = {
  arms_crossed: 'Capitán',
  jogging: 'Trotando',
  stretching: 'Estirando',
  idle: 'Relajado',
  warmup: 'Calentando',
};

const TEAM_COLORS = ['#16a34a', '#D2B5FF', '#6f8cff', '#33d69f', '#ff6b7a', '#f4b740', '#FFFFFF'];

export default function AvatarSetup({ userId, onClose, onComplete }: AvatarSetupProps) {
  const [step, setStep] = useState<Step>('photo');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [traits, setTraits] = useState<FaceTraits | null>(null);
  const [selectedPose, setSelectedPose] = useState<AvatarPose>('arms_crossed');
  const [teamColor, setTeamColor] = useState('#16a34a');
  const [loading, setLoading] = useState(false);

  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 'saved') {
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [step]);

  const saveAvatar = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          avatar_traits: traits,
          avatar_pose: selectedPose,
          avatar_team_color: teamColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      setStep('saved');
    } catch (err) {
      console.error('Error saving avatar:', err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'photo') {
    return (
      <FaceCapture
        onCapture={(uri) => {
          setPhotoUri(uri);
          setStep('traits');
        }}
        onClose={onClose}
      />
    );
  }

  if (step === 'traits') {
    return (
      <TraitSelector
        photoUri={photoUri!}
        onComplete={(newTraits) => {
          setTraits(newTraits);
          setStep('preview');
        }}
        onBack={() => setStep('photo')}
      />
    );
  }

  if (step === 'preview') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>¡Tu avatar está listo!</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.previewCard}>
            <AvatarComposer
              traits={traits}
              teamColor={teamColor}
              pose={selectedPose}
              width={260}
              height={380}
            />
          </View>

          <Text style={styles.sectionLabel}>Elegí tu pose</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.poseScroll}>
            {POSES.map((pose) => (
              <TouchableOpacity
                key={pose}
                onPress={() => setSelectedPose(pose)}
                style={[
                  styles.poseItem,
                  selectedPose === pose && styles.poseItemActive,
                ]}
              >
                <AvatarComposer
                  traits={traits}
                  teamColor={teamColor}
                  pose={pose}
                  width={80}
                  height={110}
                />
                <Text style={styles.poseLabel}>{POSE_LABELS[pose]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>Color de camiseta</Text>
          <View style={styles.colorRow}>
            {TEAM_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setTeamColor(color)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  teamColor === color && styles.colorCircleActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => setStep('traits')}
              disabled={loading}
            >
              <Text style={styles.outlineButtonText}>🔄 Volver a elegir rasgos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveAvatar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.saveButtonText}>✅ Guardar mi avatar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (step === 'saved') {
    return (
      <View style={styles.savedContainer}>
        <Animated.View style={{ transform: [{ scale: successAnim }] }}>
          <Ionicons name="checkmark-circle" size={100} color="#22C55E" />
        </Animated.View>

        <Text style={styles.savedTitle}>¡Avatar guardado! 🎉</Text>
        <Text style={styles.savedSubtitle}>Aparecerá en tu perfil e inicio</Text>

        <TouchableOpacity style={styles.finalButton} onPress={onComplete}>
          <Text style={styles.finalButtonText}>Ver mi perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0a3d1f',
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontFamily: 'BebasNeue',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    ...shadows.card,
  },
  sectionLabel: {
    fontSize: 16,
    color: colors.text,
    fontFamily: font.bold,
    marginBottom: 12,
  },
  poseScroll: {
    marginBottom: 24,
  },
  poseItem: {
    width: 100,
    alignItems: 'center',
    marginRight: 12,
    padding: 10,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  poseItemActive: {
    borderColor: '#22C55E',
  },
  poseLabel: {
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: 8,
    fontFamily: font.medium,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: '#fff',
  },
  actions: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 16,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 14,
  },
  savedContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  savedTitle: {
    fontSize: 32,
    color: '#22C55E',
    fontFamily: 'BebasNeue',
    marginTop: 20,
    textAlign: 'center',
  },
  savedSubtitle: {
    fontSize: 16,
    color: colors.textSubtle,
    fontFamily: font.regular,
    marginTop: 8,
    textAlign: 'center',
  },
  finalButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  finalButtonText: {
    color: colors.background,
    fontFamily: font.extraBold,
    fontSize: 16,
  },
});
