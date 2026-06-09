import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMatchRequest,
  getMyTeamRequests,
  getOpenMatchRequests,
  getPlayerStats,
  getRanking,
  getRequestResponses,
  getTeamPublicProfile,
  respondToRequest,
  submitMatchResult,
  type MatchRequestFilters,
} from '@/lib/matchmaking';

export function useMatchRequests(filters?: MatchRequestFilters) {
  const query = useQuery({
    queryKey: ['match-requests', filters],
    queryFn: () => getOpenMatchRequests(filters),
    staleTime: 60000,
  });

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useMyTeamRequests(teamId: string | null) {
  const query = useQuery({
    queryKey: ['my-requests', teamId],
    queryFn: () => getMyTeamRequests(teamId!),
    enabled: teamId !== null,
  });

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useRequestResponses(requestId: string | null) {
  const query = useQuery({
    queryKey: ['responses', requestId],
    queryFn: () => getRequestResponses(requestId!),
    enabled: requestId !== null,
    refetchInterval: 15000,
  });

  return {
    responses: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useTeamProfile(teamId: string | null) {
  const query = useQuery({
    queryKey: ['team-profile', teamId],
    queryFn: () => getTeamPublicProfile(teamId!),
    enabled: teamId !== null,
    staleTime: 120000,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useRanking() {
  const query = useQuery({
    queryKey: ['ranking'],
    queryFn: () => getRanking(20),
    staleTime: 300000,
  });

  return {
    ranking: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function usePlayerStats(userId: string | null) {
  const query = useQuery({
    queryKey: ['player-stats', userId],
    queryFn: () => getPlayerStats(userId!),
    enabled: userId !== null,
    staleTime: 120000,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
  };
}

export function useCreateMatchRequest() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createMatchRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
  });

  return {
    createRequest: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: respondToRequest,
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['responses', variables.requestId] });
    },
  });

  return {
    respond: mutation.mutateAsync,
    isResponding: mutation.isPending,
  };
}

export function useSubmitResult() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: submitMatchResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      queryClient.invalidateQueries({ queryKey: ['player-stats'] });
    },
  });

  return {
    submitResult: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
}
