import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// ─── Tipos ────────────────────────────────────────────────
export type MatchStatus =
  | 'seeking_opponent'
  | 'confirmed'
  | 'played'
  | 'cancelled';

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string | null;
  scheduled_at: string;
  location: string | null;
  status: MatchStatus;
  result: Record<string, unknown> | null;
  created_at: string;
}

export interface MatchCall {
  id: string;
  match_id: string;
  user_id: string;
  response: 'pending' | 'accepted' | 'declined';
  responded_at: string | null;
}

// ─── Query: partidos de los equipos del usuario ────────────
export function useMyMatches() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['matches', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: memberships, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;

      const teamIds = memberships.map((m) => m.team_id);
      if (teamIds.length === 0) return [];

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(
          teamIds
            .flatMap((id) => [`home_team_id.eq.${id}`, `away_team_id.eq.${id}`])
            .join(',')
        )
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      return data as Match[];
    },
    enabled: !!userId,
  });
}

// ─── Query: obtener partido por ID ────────────────────────
export function useMatchById(matchId: string) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error) throw error;
      return data as Match;
    },
    enabled: !!matchId,
  });
}

// ─── Query: convocatoria del usuario actual ───────────────
export function useMyMatchCall(matchId: string) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['match_call', matchId, userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('match_calls')
        .select('*')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as MatchCall | null;
    },
    enabled: !!matchId && !!userId,
  });
}

// ─── Query: todos los calls del partido ──────────────────
export function useMatchCalls(matchId: string) {
  return useQuery({
    queryKey: ['match_calls', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_calls')
        .select(`
          *,
          users (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('match_id', matchId);

      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
  });
}

// ─── Mutation: responder convocatoria (insert o update) ──
export function useRespondToCall() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      matchId,
      response,
    }: {
      matchId: string;
      response: 'accepted' | 'declined';
    }) => {
      if (!userId) throw new Error('No autenticado');

      const payload = {
        response,
        responded_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('match_calls')
        .select('id')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('match_calls')
          .update(payload)
          .eq('match_id', matchId)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('match_calls')
        .insert({ match_id: matchId, user_id: userId, ...payload })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['match_call', matchId] });
      queryClient.invalidateQueries({ queryKey: ['match_calls', matchId] });
      queryClient.invalidateQueries({ queryKey: ['team_member'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// ─── Mutation: crear partido (dispara convocatorias vía trigger) ─
export function useCreateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      scheduledAt,
      location,
    }: {
      teamId: string;
      scheduledAt: string;
      location?: string;
    }) => {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          home_team_id: teamId,
          scheduled_at: scheduledAt,
          location: location?.trim() || null,
          status: 'confirmed',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Match;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

// ─── Mutation: marcar partido como jugado ────────────────
export function useMarkMatchPlayed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      const { error: matchError } = await supabase
        .from('matches')
        .update({ status: 'played' })
        .eq('id', matchId);

      if (matchError) throw matchError;

      const { error: fnError } = await supabase.rpc('update_streaks_after_match', {
        p_match_id: matchId,
      });

      if (fnError) throw fnError;

      return matchId;
    },
    onSuccess: (matchId) => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['match_calls', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['activity_feed'] });
      queryClient.invalidateQueries({ queryKey: ['team_member'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export type PlayerStreak = {
  streak: number;
  games_played: number;
  shirt_number: number | null;
};

// ─── Query + Realtime: racha del usuario en un equipo ─────
export function usePlayerStreak(teamId: string) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['team_member', teamId, userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('team_members')
        .select('streak, games_played, shirt_number')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as PlayerStreak;
    },
    enabled: !!teamId && !!userId,
  });

  useEffect(() => {
    if (!teamId || !userId) return;

    const channel = supabase
      .channel(`streak:${teamId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const row = payload.new as {
            user_id: string;
            streak: number;
            games_played: number;
            shirt_number: number | null;
          };
          if (row.user_id !== userId) return;

          queryClient.setQueryData<PlayerStreak>(
            ['team_member', teamId, userId],
            {
              streak: row.streak,
              games_played: row.games_played,
              shirt_number: row.shirt_number,
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, userId, queryClient]);

  return query;
}
