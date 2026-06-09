import { supabase } from './supabase';

function generateInviteCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createTeam(name: string, userId: string) {
  const invite_code = generateInviteCode();

  const { data: team, error } = await supabase
    .from('teams')
    .insert({ name, invite_code, created_by: userId })
    .select()
    .single();

  if (error) throw error;

  const { error: memberError } = await supabase
    .from('team_members')
    .insert({ user_id: userId, team_id: team.id });

  if (memberError) throw memberError;

  return team;
}

export async function joinTeamByCode(code: string, userId: string) {
  const { data: team, error } = await supabase
    .from('teams')
    .select('*')
    .eq('invite_code', code.toUpperCase().trim())
    .single();

  if (error || !team) throw new Error('Código inválido o equipo no encontrado');

  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('user_id', userId)
    .eq('team_id', team.id)
    .single();

  if (existing) throw new Error('Ya eres miembro de este equipo');

  const { error: joinError } = await supabase
    .from('team_members')
    .insert({ user_id: userId, team_id: team.id });

  if (joinError) throw joinError;

  return team;
}

export async function getUserTeams(userId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      team_id,
      streak,
      games_played,
      shirt_number,
      teams (id, name, invite_code, created_by, created_at)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}
