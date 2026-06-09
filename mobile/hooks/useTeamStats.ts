import { useQuery } from '@tanstack/react-query';
import { getTeamStats } from '@/lib/matchmaking';

export function useTeamStats(teamId: string | null) {
  const query = useQuery({
    queryKey: ['team-stats', teamId],
    queryFn: () => getTeamStats(teamId!),
    enabled: teamId !== null,
    staleTime: 60000,
  });

  const stats = query.data ?? null;
  const winRate = stats
    ? stats.matches_played > 0
      ? Math.round((stats.wins / stats.matches_played) * 100)
      : 0
    : 0;
  const goalDiff = stats ? stats.goals_for - stats.goals_against : 0;

  return {
    stats,
    winRate,
    goalDiff,
    isLoading: query.isLoading,
  };
}
