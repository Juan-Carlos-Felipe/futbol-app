import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { signIn } from '@/lib/auth';
import { theme } from '@/lib/theme';

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
      // El listener de onAuthStateChange redirige automáticamente
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
      <Text style={styles.title}>⚽ FUTBOLAPP</Text>
      <Text style={styles.subtitle}>Inicia sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.colors.gray400}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={theme.colors.gray400}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'ENTRANDO...' : 'ENTRAR'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    padding: 24
  },
  title: {
    fontSize: 48,
    fontFamily: theme.fonts.display,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.white,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 32
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: theme.fonts.body,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.display,
    fontSize: 18
  },
  link: {
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
  },
});
