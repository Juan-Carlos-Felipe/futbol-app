import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signIn } from '@/lib/auth';
import { colors, font, gradients, radii, shadows } from '@/lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Completa todos los campos');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={gradients.hero} style={styles.hero}>
        <Text style={styles.kicker}>MATCHDAY APP</Text>
        <Text style={styles.title}>FutbolApp</Text>
        <Text style={styles.subtitle}>
          Resultados, canchas y equipos en una experiencia premium.
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Inicia sesion</Text>
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
          placeholder="Contrasena"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.link}>No tienes cuenta? Registrate</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 20 },
  hero: {
    borderRadius: radii.xl,
    marginBottom: 18,
    minHeight: 178,
    overflow: 'hidden',
    padding: 22,
    ...shadows.card,
  },
  kicker: {
    color: colors.accent,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 34,
  },
  title: { color: colors.text, fontFamily: font.extraBold, fontSize: 38, fontWeight: '900' },
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
