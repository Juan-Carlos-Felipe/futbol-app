import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { signUp } from '@/lib/auth';
import { theme } from '@/lib/theme';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    if (!displayName || !email || !password)
      return Alert.alert('Completa todos los campos');
    if (password.length < 6)
      return Alert.alert('La contraseña debe tener al menos 6 caracteres');

    setLoading(true);
    try {
      await signUp(email, password, displayName);
      Alert.alert('¡Listo!', 'Cuenta creada. Revisa tu email para confirmar.');
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
        <Text style={styles.title}>⚽ FUTBOLAPP</Text>
        <Text style={styles.subtitle}>Crea tu cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre de jugador"
          placeholderTextColor={theme.colors.gray400}
          value={displayName}
          onChangeText={setDisplayName}
        />
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
          placeholder="Contraseña (mín. 6 caracteres)"
          placeholderTextColor={theme.colors.gray400}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'CREANDO...' : 'CREAR CUENTA'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
