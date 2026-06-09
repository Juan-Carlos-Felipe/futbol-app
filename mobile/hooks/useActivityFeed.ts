import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export type FeedEventType =
  | 'match_played'
  | 'streak_milestone'
  | 'streak_broken'
  | 'player_joined'
  | 'match_created'
  | 'match_confirmed';

export interface FeedEvent {
  id: string;
  team_id: string;
  user_id: string;
  type: FeedEventType;
  payload: Record<string, unknown>;
  created_at: string;
  teams?: { name: string };
}

export function useTeamActivityFeed(teamId: string) {
  return useQuery({
    queryKey: ['activity_feed', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          *,
          teams (name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as FeedEvent[];
    },
    enabled: !!teamId,
    refetchInterval: 30_000,
  });
}

export function useMyActivityFeed() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['activity_feed', 'all', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: memberships, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;
      if (!memberships?.length) return [];

      const teamIds = memberships.map((m) => m.team_id);

      const { data, error } = await supabase
        .from('activity_feed')
        .select(`
          *,
          teams (name)
        `)
        .in('team_id', teamIds)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as FeedEvent[];
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}
