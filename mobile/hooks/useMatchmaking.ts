import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptResponse,
  createMatchRequest,
  getEditableTeamPublicProfile,
  getMatchRequestById,
  getMyTeamRequests,
  getOpenMatchRequests,
  getPlayerStats,
  getRanking,
  getRequestResponses,
  getTeamMatchHistory,
  getTeamMembers,
  getTeamPublicProfile,
  getTeamRecentForm,
  rejectResponse,
  respondToRequest,
  submitMatchResult,
  upsertTeamPublicProfile,
  type MatchRequestFilters,
  type TeamPublicProfile,
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

export function useMatchRequestDetail(requestId: string | null) {
  const query = useQuery({
    queryKey: ['match-request-detail', requestId],
    queryFn: () => getMatchRequestById(requestId!),
    enabled: requestId !== null,
  });

  return {
    request: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
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

export function useEditableTeamProfile(teamId: string | null) {
  const query = useQuery({
    queryKey: ['editable-team-profile', teamId],
    queryFn: () => getEditableTeamPublicProfile(teamId!),
    enabled: teamId !== null,
    staleTime: 120000,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useRanking(limit: number = 20) {
  const query = useQuery({
    queryKey: ['ranking', limit],
    queryFn: () => getRanking(limit),
    staleTime: 300000,
  });

  return {
    ranking: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useTeamRecentForm(teamId: string | null) {
  const query = useQuery({
    queryKey: ['team-form', teamId],
    queryFn: () => getTeamRecentForm(teamId!),
    enabled: teamId !== null,
    staleTime: 60000,
  });

  return {
    form: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useTeamMembers(teamId: string | null) {
  const query = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => getTeamMembers(teamId!),
    enabled: teamId !== null,
    staleTime: 120000,
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useTeamMatchHistory(teamId: string | null) {
  const query = useQuery({
    queryKey: ['team-match-history', teamId],
    queryFn: () => getTeamMatchHistory(teamId!),
    enabled: teamId !== null,
    staleTime: 60000,
  });

  return {
    matches: query.data ?? [],
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

export function useAcceptResponse() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (variables: { responseId: string; requestId: string }) =>
      acceptResponse(variables.responseId, variables.requestId),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['responses', variables.requestId] });
      queryClient.invalidateQueries({
        queryKey: ['match-request-detail', variables.requestId],
      });
      queryClient.invalidateQueries({ queryKey: ['match-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
  });

  return {
    accept: mutation.mutateAsync,
    isAccepting: mutation.isPending,
  };
}

export function useRejectResponse() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (variables: { responseId: string; requestId: string }) =>
      rejectResponse(variables.responseId),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['responses', variables.requestId] });
    },
  });

  return {
    reject: mutation.mutateAsync,
    isRejecting: mutation.isPending,
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

export function useUpsertTeamPublicProfile(teamId: string | null) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: Partial<TeamPublicProfile>) => upsertTeamPublicProfile(teamId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-profile', teamId] });
      queryClient.invalidateQueries({ queryKey: ['editable-team-profile', teamId] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
    },
  });

  return {
    saveProfile: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
