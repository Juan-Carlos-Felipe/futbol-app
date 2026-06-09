import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { createTeam, joinTeamByCode, getUserTeams } from '@/lib/teams';

export function useMyTeams() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['teams', userId],
    queryFn: () => getUserTeams(userId!),
    enabled: !!userId,
  });
}

export function useCreateTeam() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createTeam(name, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', userId] });
    },
  });
}

export function useJoinTeam() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => joinTeamByCode(code, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', userId] });
    },
  });
}
