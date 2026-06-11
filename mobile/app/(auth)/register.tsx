import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signUp } from '@/lib/auth';
import { colors, font, gradients, radii, shadows } from '@/lib/theme';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    if (!displayName || !email || !password) return Alert.alert('Completa todos los campos');
    if (password.length < 6) {
      return Alert.alert('La contrasena debe tener al menos 6 caracteres');
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName);
      Alert.alert('Listo!', 'Cuenta creada. Revisa tu email para confirmar.');
      router.replace('/login');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient colors={gradients.score} style={styles.hero}>
          <Text style={styles.kicker}>JOIN THE CLUB</Text>
          <Text style={styles.title}>Crea tu equipo</Text>
          <Text style={styles.subtitle}>
            Arma tu perfil, sube tu ELO y reserva la proxima cancha.
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registro</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de jugador"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Contrasena (min. 6 caracteres)"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Creando...' : 'Crear cuenta'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Ya tienes cuenta? Inicia sesion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 20 },
  hero: {
    borderRadius: radii.xl,
    marginBottom: 18,
    minHeight: 174,
    overflow: 'hidden',
    padding: 22,
    ...shadows.card,
  },
  kicker: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 34,
  },
  title: { color: colors.text, fontFamily: font.extraBold, fontSize: 34, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontFamily: font.medium, fontSize: 14, lineHeight: 21, marginTop: 8 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 18,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
  },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: font.medium,
    fontSize: 15,
    marginBottom: 12,
    padding: 15,
  },
  btn: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    marginTop: 8,
    padding: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.background, fontFamily: font.bold, fontSize: 15, fontWeight: '900' },
  link: {
    color: colors.accent,
    fontFamily: font.semiBold,
    fontSize: 13,
    marginTop: 18,
    textAlign: 'center',
  },
});
