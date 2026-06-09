import { useState } from 'react';
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
import { useCreateMatchRequest } from '@/hooks/useMatchmaking';
import type { CreateMatchRequestData, MatchRequest } from '@/lib/matchmaking';

type CreateRequestModalProps = {
  visible: boolean;
  onClose: () => void;
  teamId: string;
};

type MatchLevel = MatchRequest['level'];

const LEVELS: Array<{ label: string; value: MatchLevel }> = [
  { label: 'Amateur', value: 'amateur' },
  { label: 'Intermedio', value: 'intermedio' },
  { label: 'Competitivo', value: 'competitivo' },
];

const SIZES = ['F5', 'F7', 'F11'];
const SURFACES = ['Pasto sintetico', 'Cemento'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function CreateRequestModal({ visible, onClose, teamId }: CreateRequestModalProps) {
  const { createRequest, isCreating } = useCreateMatchRequest();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<MatchLevel | null>(null);
  const [size, setSize] = useState('F7');
  const [surface, setSurface] = useState('Pasto sintetico');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [locationText, setLocationText] = useState('');

  function resetForm() {
    setTitle('');
    setDescription('');
    setLevel(null);
    setSize('F7');
    setSurface('Pasto sintetico');
    setPreferredDate('');
    setPreferredTime('');
    setLocationText('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedDate = preferredDate.trim();
    const trimmedTime = preferredTime.trim();

    if (!trimmedTitle) {
      Alert.alert('Titulo obligatorio', 'Agrega un titulo para publicar el anuncio.');
      return;
    }

    if (!level) {
      Alert.alert('Nivel obligatorio', 'Selecciona el nivel de tu equipo.');
      return;
    }

    if (trimmedDate && !DATE_PATTERN.test(trimmedDate)) {
      Alert.alert('Fecha invalida', 'Usa el formato YYYY-MM-DD, por ejemplo 2026-06-15.');
      return;
    }

    if (trimmedTime && !TIME_PATTERN.test(trimmedTime)) {
      Alert.alert('Hora invalida', 'Usa el formato HH:mm, por ejemplo 20:30.');
      return;
    }

    const payload: CreateMatchRequestData = {
      teamId,
      title: trimmedTitle,
      description: description.trim() || undefined,
      preferredDate: trimmedDate || undefined,
      preferredTime: trimmedTime || undefined,
      locationText: locationText.trim() || undefined,
      size,
      surface,
      level,
    };

    try {
      await createRequest(payload);
      handleClose();
      Alert.alert(
        'Anuncio publicado',
        'Los equipos ya pueden ver tu anuncio y proponer un partido.'
      );
    } catch (error: unknown) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo publicar el anuncio.'
      );
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Buscar rival</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeText}>x</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FieldLabel text="Titulo del anuncio" />
          <TextInput
            style={styles.input}
            placeholder="ej: Buscamos rival para amistoso el sabado"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
          />

          <FieldLabel text="Descripcion" />
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
            placeholder="Conta mas sobre tu equipo y que buscas..."
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          <PillGroup label="Nivel" options={LEVELS} selectedValue={level} onSelect={setLevel} />
          <PillGroup
            label="Tamano"
            options={SIZES.map((value) => ({ label: value, value }))}
            selectedValue={size}
            onSelect={setSize}
          />
          <PillGroup
            label="Superficie"
            options={SURFACES.map((value) => ({ label: value, value }))}
            selectedValue={surface}
            onSelect={setSurface}
          />

          <FieldLabel text="Fecha preferida" />
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            value={preferredDate}
            onChangeText={setPreferredDate}
            keyboardType="numbers-and-punctuation"
          />

          <FieldLabel text="Hora preferida" />
          <TextInput
            style={styles.input}
            placeholder="HH:mm"
            placeholderTextColor="#9ca3af"
            value={preferredTime}
            onChangeText={setPreferredTime}
            keyboardType="numbers-and-punctuation"
          />

          <FieldLabel text="Zona/ubicacion" />
          <TextInput
            style={styles.input}
            placeholder="ej: Providencia, Las Condes, Nunoa..."
            placeholderTextColor="#9ca3af"
            value={locationText}
            onChangeText={setLocationText}
          />

          <TouchableOpacity
            style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>Publicar anuncio</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

type PillGroupProps<T extends string> = {
  label: string;
  options: Array<{ label: string; value: T }>;
  selectedValue: T | null;
  onSelect: (value: T) => void;
};

function PillGroup<T extends string>({
  label,
  options,
  selectedValue,
  onSelect,
}: PillGroupProps<T>) {
  return (
    <View style={styles.group}>
      <FieldLabel text={label} />
      <View style={styles.pillRow}>
        {options.map((option) => {
          const active = option.value === selectedValue;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
  headerTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
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
  textArea: { minHeight: 96 },
  group: { marginBottom: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 14,
    marginTop: 8,
    paddingVertical: 16,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
});
