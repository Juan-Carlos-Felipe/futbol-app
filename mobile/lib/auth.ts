import { supabase } from './supabase';

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Crear perfil en public.users
  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      display_name: displayName,
    });
    if (profileError) throw profileError;

    // Crear wallet vacía
    await supabase.from('player_wallet').insert({ user_id: data.user.id });
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
