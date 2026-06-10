import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRespondToRequest } from '@/hooks/useMatchmaking';
import { supabase } from '@/lib/supabase';

type ProposeMatchModalProps = {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  rivalTeamName: string;
  myTeamId: string;
};

type CourtOption = 'have_court' | 'need_court';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function ProposeMatchModal({
  visible,
  onClose,
  requestId,
  rivalTeamName,
  myTeamId,
}: ProposeMatchModalProps) {
  const { respond, isResponding } = useRespondToRequest();
  const [message, setMessage] = useState('');
  const [courtOption, setCourtOption] = useState<CourtOption>('need_court');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [myTeamName, setMyTeamName] = useState('Tu equipo');

  useEffect(() => {
    if (!visible) return;

    const fetchTeamName = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('name')
        .eq('id', myTeamId)
        .limit(1)
        .returns<Array<{ name: string }>>();

      if (error) {
        console.warn('[ProposeMatchModal] Error loading team name', error);
        return;
      }

      if (data?.[0]?.name) {
        setMyTeamName(data[0].name);
      }
    };

    fetchTeamName();
  }, [myTeamId, visible]);

  function resetForm() {
    setMessage('');
    setCourtOption('need_court');
    setProposedDate('');
    setProposedTime('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    const trimmedDate = proposedDate.trim();
    const trimmedTime = proposedTime.trim();

    if (trimmedDate && !DATE_PATTERN.test(trimmedDate)) {
      Alert.alert('Fecha invalida', 'Usa el formato YYYY-MM-DD, por ejemplo 2026-06-15.');
      return;
    }

    if (trimmedTime && !TIME_PATTERN.test(trimmedTime)) {
      Alert.alert('Hora invalida', 'Usa el formato HH:mm, por ejemplo 20:30.');
      return;
    }

    const courtText =
      courtOption === 'have_court'
        ? 'Tenemos cancha disponible.'
        : 'Necesitamos coordinar cancha.';
    const fullMessage = [message.trim(), courtText].filter(Boolean).join('\n\n');

    try {
      await respond({
        requestId,
        teamId: myTeamId,
        message: fullMessage || undefined,
        proposedDate: trimmedDate || undefined,
        proposedTime: trimmedTime || undefined,
      });
      handleClose();
      Alert.alert(
        'Propuesta enviada',
        'El equipo rival recibira una notificacion y podra aceptar o rechazar.'
      );
    } catch (error: unknown) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo enviar la propuesta.'
      );
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            Proponer partido a {rivalTeamName}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeText}>x</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Mensaje personal</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            maxLength={300}
            placeholder="Presentate y conta tu propuesta..."
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
          <Text style={styles.counter}>{message.length}/300</Text>

          <Text style={styles.label}>Tenes cancha?</Text>
          <View style={styles.pillRow}>
            <OptionPill
              label="Si, ponemos la cancha"
              active={courtOption === 'have_court'}
              onPress={() => setCourtOption('have_court')}
            />
            <OptionPill
              label="Necesitamos cancha"
              active={courtOption === 'need_court'}
              onPress={() => setCourtOption('need_court')}
            />
          </View>

          <Text style={styles.label}>Fecha propuesta</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            value={proposedDate}
            onChangeText={setProposedDate}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Hora propuesta</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:mm"
            placeholderTextColor="#9ca3af"
            value={proposedTime}
            onChangeText={setProposedTime}
            keyboardType="numbers-and-punctuation"
          />

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Tu propuesta</Text>
            <Text style={styles.previewLine}>Equipo: {myTeamName}</Text>
            <Text style={styles.previewLine}>Fecha: {proposedDate || 'A coordinar'}</Text>
            <Text style={styles.previewLine}>Hora: {proposedTime || 'A coordinar'}</Text>
            <Text style={styles.previewLine}>
              Mensaje: {message.trim() || 'Sin mensaje personal'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isResponding && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isResponding}
          >
            {isResponding ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>Enviar propuesta</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function OptionPill({
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
  container: { backgroundColor: '#f3f4f6', flex: 1 },
  header: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  headerTitle: { color: '#111827', flex: 1, fontSize: 16, fontWeight: '800' },
  closeButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  closeText: { color: '#111827', fontSize: 22, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 36 },
  label: { color: '#374151', fontSize: 13, fontWeight: '800', marginBottom: 8 },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderRadius: 12,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: { minHeight: 120, marginBottom: 6 },
  counter: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'right',
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  pillText: { color: '#4b5563', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: '#ffffff' },
  previewCard: {
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    marginBottom: 18,
    padding: 14,
  },
  previewTitle: { color: '#111827', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  previewLine: { color: '#4b5563', fontSize: 13, lineHeight: 20 },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
