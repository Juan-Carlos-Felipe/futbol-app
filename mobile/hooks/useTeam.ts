import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Team {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
}

export function useTeamById(teamId: string) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data as Team;
    },
    enabled: !!teamId,
  });
}

/** true si el usuario actual pertenece al equipo */
export function useIsTeamMember(teamId: string) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['team_member_check', teamId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!teamId && !!userId,
  });
}
