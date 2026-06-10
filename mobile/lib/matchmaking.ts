import { supabase } from './supabase';

export interface MatchRequest {
  id: string;
  team_id: string;
  created_by: string;
  title: string;
  description: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  venue_id: string | null;
  location_text: string | null;
  lat: number | null;
  lng: number | null;
  size: string | null;
  surface: string | null;
  level: 'amateur' | 'intermedio' | 'competitivo';
  status: 'open' | 'matched' | 'cancelled' | 'expired';
  expires_at: string;
  created_at: string;
  teams?: { name: string; logo_url?: string };
  team_stats?: TeamStats;
}

export interface MatchRequestResponse {
  id: string;
  request_id: string;
  team_id: string;
  created_by: string;
  message: string | null;
  proposed_date: string | null;
  proposed_time: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  teams?: { name: string };
}

export interface TeamStats {
  id: string;
  team_id: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  win_streak: number;
  best_streak: number;
  elo: number;
  updated_at: string;
}

export interface PlayerStats {
  id: string;
  user_id: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  win_streak: number;
  best_streak: number;
  elo: number;
  updated_at: string;
}

export interface MatchResult {
  id: string;
  match_id: string;
  team_home_id: string;
  team_away_id: string;
  goals_home: number;
  goals_away: number;
  confirmed_by: string;
  confirmed_at: string;
  created_at?: string;
}

export interface TeamMatchHistoryItem extends MatchResult {
  created_at: string;
  home_name: string;
  away_name: string;
}

export interface TeamPublicProfile {
  id: string;
  team_id: string;
  bio: string | null;
  founded_year: number | null;
  home_zone: string | null;
  preferred_size: string | null;
  preferred_surface: string | null;
  logo_url: string | null;
  banner_url: string | null;
  social_instagram: string | null;
  is_public: boolean;
}

export interface TeamWithProfile {
  id: string;
  name: string;
  stats: TeamStats | null;
  profile: TeamPublicProfile | null;
  members_count: number;
}

export interface TeamMemberProfile {
  id: string;
  user_id: string;
  team_id: string;
  role: string | null;
  display_name: string;
  avatar_url: string | null;
  matches_played: number;
  wins: number;
  elo: number;
}

export interface MatchRequestFilters {
  level?: 'amateur' | 'intermedio' | 'competitivo';
  size?: string;
  surface?: string;
  dateFrom?: string;
  dateTo?: string;
  nearMe?: boolean;
}

export interface CreateMatchRequestData {
  teamId: string;
  title: string;
  description?: string;
  preferredDate?: string;
  preferredTime?: string;
  locationText?: string;
  size?: string;
  surface?: string;
  level: string;
}

export interface RespondToRequestData {
  requestId: string;
  teamId: string;
  message?: string;
  proposedDate?: string;
  proposedTime?: string;
}

export interface SubmitMatchResultData {
  matchId: string;
  teamHomeId: string;
  teamAwayId: string;
  goalsHome: number;
  goalsAway: number;
}

type MatchRequestRow = Omit<MatchRequest, 'teams' | 'team_stats'> & {
  teams: { name: string } | null;
};

type MatchRequestDetailRow = Omit<MatchRequest, 'teams' | 'team_stats'> & {
  teams: { name: string } | null;
};

type MatchRequestResponseRow = Omit<MatchRequestResponse, 'teams'> & {
  teams: { name: string } | null;
};

type RankingRow = TeamStats & {
  teams: { name: string } | null;
};

type TeamMemberRow = {
  id: string;
  user_id: string;
  team_id: string;
  role?: string | null;
  users: { display_name: string; avatar_url: string | null } | null;
};

type MatchHistoryRow = MatchResult & {
  created_at: string;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
};

function throwSupabaseError(context: string, error: unknown): never {
  console.error(`[matchmaking] ${context}`, error);
  throw error;
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throwSupabaseError('Error fetching authenticated user', error);
  }

  if (!data.user) {
    const authError = new Error('Authenticated user not found');
    console.error('[matchmaking] Authenticated user not found', authError);
    throw authError;
  }

  return data.user.id;
}

export async function getOpenMatchRequests(
  filters?: MatchRequestFilters
): Promise<MatchRequest[]> {
  const { data, error } = await supabase
    .from('match_requests')
    .select(
      `
        *,
        teams (
          name
        )
      `
    )
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .returns<MatchRequestRow[]>();

  if (error) {
    throwSupabaseError('Error fetching open match requests', error);
  }

  let requests = data ?? [];

  if (filters?.level) {
    requests = requests.filter((request) => request.level === filters.level);
  }

  if (filters?.size) {
    requests = requests.filter((request) => request.size === filters.size);
  }

  if (filters?.surface) {
    requests = requests.filter((request) => request.surface === filters.surface);
  }

  if (filters?.dateFrom) {
    requests = requests.filter(
      (request) =>
        request.preferred_date !== null && request.preferred_date >= filters.dateFrom!
    );
  }

  if (filters?.dateTo) {
    requests = requests.filter(
      (request) =>
        request.preferred_date !== null && request.preferred_date <= filters.dateTo!
    );
  }

  const teamIds = [...new Set(requests.map((request) => request.team_id))];

  if (teamIds.length === 0) {
    return [];
  }

  const { data: stats, error: statsError } = await supabase
    .from('team_stats')
    .select('*')
    .in('team_id', teamIds)
    .returns<TeamStats[]>();

  if (statsError) {
    throwSupabaseError('Error fetching team stats for match requests', statsError);
  }

  const statsByTeamId = new Map(
    (stats ?? []).map((teamStats) => [teamStats.team_id, teamStats])
  );

  return requests.map((request) => ({
    ...request,
    teams: request.teams ?? undefined,
    team_stats: statsByTeamId.get(request.team_id),
  }));
}

export async function getMyTeamRequests(teamId: string): Promise<MatchRequest[]> {
  const { data, error } = await supabase
    .from('match_requests')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .returns<MatchRequest[]>();

  if (error) {
    throwSupabaseError('Error fetching team match requests', error);
  }

  return data ?? [];
}

export async function getMatchRequestById(requestId: string): Promise<MatchRequest | null> {
  const { data, error } = await supabase
    .from('match_requests')
    .select(
      `
        *,
        teams (
          name
        )
      `
    )
    .eq('id', requestId)
    .limit(1)
    .returns<MatchRequestDetailRow[]>();

  if (error) {
    throwSupabaseError('Error fetching match request detail', error);
  }

  const request = data?.[0];

  if (!request) {
    return null;
  }

  const { data: statsRows, error: statsError } = await supabase
    .from('team_stats')
    .select('*')
    .eq('team_id', request.team_id)
    .limit(1)
    .returns<TeamStats[]>();

  if (statsError) {
    throwSupabaseError('Error fetching team stats for match request detail', statsError);
  }

  return {
    ...request,
    teams: request.teams
      ? {
        name: request.teams.name,
      }
      : undefined,
    team_stats: statsRows?.[0] ?? undefined,
  };
}

export async function getRequestResponses(
  requestId: string
): Promise<MatchRequestResponse[]> {
  const { data, error } = await supabase
    .from('match_request_responses')
    .select(
      `
        *,
        teams (
          name
        )
      `
    )
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
    .returns<MatchRequestResponseRow[]>();

  if (error) {
    throwSupabaseError('Error fetching match request responses', error);
  }

  return (data ?? []).map((response) => ({
    ...response,
    teams: response.teams ?? undefined,
  }));
}

export async function createMatchRequest(
  data: CreateMatchRequestData
): Promise<MatchRequest> {
  const createdBy = await getCurrentUserId();
  const { data: requests, error } = await supabase
    .from('match_requests')
    .insert({
      team_id: data.teamId,
      created_by: createdBy,
      title: data.title,
      description: data.description,
      preferred_date: data.preferredDate,
      preferred_time: data.preferredTime,
      location_text: data.locationText,
      size: data.size,
      surface: data.surface,
      level: data.level,
    })
    .select('*')
    .returns<MatchRequest[]>();

  if (error) {
    throwSupabaseError('Error creating match request', error);
  }

  if (!requests?.[0]) {
    const insertError = new Error('No data returned after creating match request');
    console.error('[matchmaking] No data returned after creating match request', insertError);
    throw insertError;
  }

  return requests[0];
}

export async function respondToRequest(
  data: RespondToRequestData
): Promise<MatchRequestResponse> {
  const createdBy = await getCurrentUserId();
  const { data: responses, error } = await supabase
    .from('match_request_responses')
    .upsert(
      {
        request_id: data.requestId,
        team_id: data.teamId,
        created_by: createdBy,
        message: data.message,
        proposed_date: data.proposedDate,
        proposed_time: data.proposedTime,
      },
      { onConflict: 'request_id,team_id' }
    )
    .select('*')
    .returns<MatchRequestResponse[]>();

  if (error) {
    throwSupabaseError('Error responding to match request', error);
  }

  if (!responses?.[0]) {
    const upsertError = new Error('No data returned after responding to match request');
    console.error('[matchmaking] No data returned after responding to match request', upsertError);
    throw upsertError;
  }

  const { data: requestRows, error: requestError } = await supabase
    .from('match_requests')
    .select('created_by')
    .eq('id', data.requestId)
    .limit(1)
    .returns<Array<{ created_by: string }>>();

  if (requestError) {
    console.warn('[matchmaking] Error fetching request owner for notification', requestError);
  }

  const { data: teamRows, error: teamError } = await supabase
    .from('teams')
    .select('name')
    .eq('id', data.teamId)
    .limit(1)
    .returns<Array<{ name: string }>>();

  if (teamError) {
    console.warn('[matchmaking] Error fetching proposing team name', teamError);
  }

  const targetUserId = requestRows?.[0]?.created_by;
  const fromTeamName = teamRows?.[0]?.name ?? 'Un equipo';

  if (targetUserId) {
    const { error: notifyError } = await supabase.functions.invoke('notify-reservation', {
      body: {
        type: 'MATCH_PROPOSAL',
        targetUserId,
        fromTeamName,
        requestId: data.requestId,
      },
    });

    if (notifyError) {
      console.warn('[matchmaking] Error sending match proposal notification', notifyError);
    }
  }

  return responses[0];
}

export async function acceptResponse(responseId: string, requestId: string): Promise<void> {
  const { error: acceptError } = await supabase
    .from('match_request_responses')
    .update({ status: 'accepted' })
    .eq('id', responseId);

  if (acceptError) {
    throwSupabaseError('Error accepting match request response', acceptError);
  }

  const { error: rejectError } = await supabase
    .from('match_request_responses')
    .update({ status: 'rejected' })
    .eq('request_id', requestId)
    .neq('id', responseId);

  if (rejectError) {
    throwSupabaseError('Error rejecting remaining match request responses', rejectError);
  }

  const { error: requestError } = await supabase
    .from('match_requests')
    .update({ status: 'matched' })
    .eq('id', requestId);

  if (requestError) {
    throwSupabaseError('Error marking match request as matched', requestError);
  }
}

export async function rejectResponse(responseId: string): Promise<void> {
  const { error } = await supabase
    .from('match_request_responses')
    .update({ status: 'rejected' })
    .eq('id', responseId);

  if (error) {
    throwSupabaseError('Error rejecting match request response', error);
  }
}

export async function getTeamStats(teamId: string): Promise<TeamStats | null> {
  const { data, error } = await supabase
    .from('team_stats')
    .select('*')
    .eq('team_id', teamId)
    .limit(1)
    .returns<TeamStats[]>();

  if (error) {
    throwSupabaseError('Error fetching team stats', error);
  }

  return data?.[0] ?? null;
}

export async function getPlayerStats(userId: string): Promise<PlayerStats | null> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .returns<PlayerStats[]>();

  if (error) {
    throwSupabaseError('Error fetching player stats', error);
  }

  return data?.[0] ?? null;
}

export async function getTeamPublicProfile(teamId: string): Promise<TeamWithProfile | null> {
  const { data: profiles, error: profileError } = await supabase
    .from('team_public_profiles')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_public', true)
    .limit(1)
    .returns<TeamPublicProfile[]>();

  if (profileError) {
    throwSupabaseError('Error fetching team public profile', profileError);
  }

  const profile = profiles?.[0];

  if (!profile) {
    return null;
  }

  const { data: teams, error: teamError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .limit(1)
    .returns<Array<{ id: string; name: string }>>();

  if (teamError) {
    throwSupabaseError('Error fetching public profile team', teamError);
  }

  const team = teams?.[0];

  if (!team) {
    return null;
  }

  const stats = await getTeamStats(teamId);
  const { count, error: membersError } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId);

  if (membersError) {
    throwSupabaseError('Error counting team members', membersError);
  }

  return {
    id: team.id,
    name: team.name,
    stats,
    profile,
    members_count: count ?? 0,
  };
}

export async function getEditableTeamPublicProfile(
  teamId: string
): Promise<TeamWithProfile | null> {
  const { data: teams, error: teamError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .limit(1)
    .returns<Array<{ id: string; name: string }>>();

  if (teamError) {
    throwSupabaseError('Error fetching editable profile team', teamError);
  }

  const team = teams?.[0];
  if (!team) {
    return null;
  }

  const { data: profiles, error: profileError } = await supabase
    .from('team_public_profiles')
    .select('*')
    .eq('team_id', teamId)
    .limit(1)
    .returns<TeamPublicProfile[]>();

  if (profileError) {
    throwSupabaseError('Error fetching editable team public profile', profileError);
  }

  const stats = await getTeamStats(teamId);
  const { count, error: membersError } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId);

  if (membersError) {
    throwSupabaseError('Error counting editable team members', membersError);
  }

  return {
    id: team.id,
    name: team.name,
    stats,
    profile: profiles?.[0] ?? null,
    members_count: count ?? 0,
  };
}

export async function getRanking(
  limit: number = 20
): Promise<Array<TeamStats & { name: string }>> {
  const { data, error } = await supabase
    .from('team_stats')
    .select(
      `
        *,
        teams (
          name
        )
      `
    )
    .order('elo', { ascending: false })
    .order('wins', { ascending: false })
    .limit(limit)
    .returns<RankingRow[]>();

  if (error) {
    throwSupabaseError('Error fetching team ranking', error);
  }

  const rows = data ?? [];
  const teamIds = rows.map((row) => row.team_id);

  if (teamIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('team_public_profiles')
    .select('team_id')
    .eq('is_public', true)
    .in('team_id', teamIds)
    .returns<Array<{ team_id: string }>>();

  if (profilesError) {
    throwSupabaseError('Error filtering public ranking teams', profilesError);
  }

  const publicTeamIds = new Set((profiles ?? []).map((profile) => profile.team_id));

  return rows
    .filter((row) => publicTeamIds.has(row.team_id))
    .map(({ teams, ...stats }) => ({
      ...stats,
      name: teams?.name ?? 'Equipo',
    }));
}

export const getTeamRecentForm = async (teamId: string) => {
  const { data, error } = await supabase
    .from('match_results')
    .select('team_home_id, team_away_id, goals_home, goals_away')
    .or(`team_home_id.eq.${teamId},team_away_id.eq.${teamId}`)
    .order('confirmed_at', { ascending: false })
    .limit(5)
    .returns<
      Array<{
        team_home_id: string;
        team_away_id: string;
        goals_home: number;
        goals_away: number;
      }>
    >();

  if (error) throw error;

  return (data ?? []).map((result) => {
    const isHome = result.team_home_id === teamId;
    const myGoals = isHome ? result.goals_home : result.goals_away;
    const theirGoals = isHome ? result.goals_away : result.goals_home;
    if (myGoals > theirGoals) return 'win' as const;
    if (myGoals < theirGoals) return 'loss' as const;
    return 'draw' as const;
  });
};

export async function getTeamMembers(teamId: string): Promise<TeamMemberProfile[]> {
  const { data: members, error } = await supabase
    .from('team_members')
    .select(
      `
        id,
        user_id,
        team_id,
        role,
        users (
          display_name,
          avatar_url
        )
      `
    )
    .eq('team_id', teamId)
    .returns<TeamMemberRow[]>();

  if (error) {
    const { data: fallbackMembers, error: fallbackError } = await supabase
      .from('team_members')
      .select(
        `
          id,
          user_id,
          team_id,
          users (
            display_name,
            avatar_url
          )
        `
      )
      .eq('team_id', teamId)
      .returns<TeamMemberRow[]>();

    if (fallbackError) {
      throwSupabaseError('Error fetching team members', fallbackError);
    }

    return hydrateTeamMembers(fallbackMembers ?? []);
  }

  return hydrateTeamMembers(members ?? []);
}

async function hydrateTeamMembers(members: TeamMemberRow[]): Promise<TeamMemberProfile[]> {
  const userIds = members.map((member) => member.user_id);

  if (userIds.length === 0) {
    return [];
  }

  const { data: stats, error: statsError } = await supabase
    .from('player_stats')
    .select('user_id, matches_played, wins, elo')
    .in('user_id', userIds)
    .returns<
      Array<{
        user_id: string;
        matches_played: number;
        wins: number;
        elo: number;
      }>
    >();

  if (statsError) {
    throwSupabaseError('Error fetching team member stats', statsError);
  }

  const statsByUserId = new Map((stats ?? []).map((stat) => [stat.user_id, stat]));

  return members
    .map((member) => {
      const playerStats = statsByUserId.get(member.user_id);
      return {
        id: member.id,
        user_id: member.user_id,
        team_id: member.team_id,
        role: member.role ?? null,
        display_name: member.users?.display_name ?? 'Jugador',
        avatar_url: member.users?.avatar_url ?? null,
        matches_played: playerStats?.matches_played ?? 0,
        wins: playerStats?.wins ?? 0,
        elo: playerStats?.elo ?? 0,
      };
    })
    .sort((a, b) => Number(b.role === 'captain') - Number(a.role === 'captain'));
}

export async function getTeamMatchHistory(
  teamId: string
): Promise<TeamMatchHistoryItem[]> {
  const { data, error } = await supabase
    .from('match_results')
    .select(
      `
        *,
        home_team:teams!match_results_team_home_id_fkey (
          name
        ),
        away_team:teams!match_results_team_away_id_fkey (
          name
        )
      `
    )
    .or(`team_home_id.eq.${teamId},team_away_id.eq.${teamId}`)
    .order('confirmed_at', { ascending: false })
    .limit(5)
    .returns<MatchHistoryRow[]>();

  if (error) {
    throwSupabaseError('Error fetching team match history', error);
  }

  return (data ?? []).map(({ home_team, away_team, ...result }) => ({
    ...result,
    home_name: home_team?.name ?? 'Local',
    away_name: away_team?.name ?? 'Visita',
  }));
}

export async function submitMatchResult(data: SubmitMatchResultData): Promise<MatchResult> {
  const confirmedBy = await getCurrentUserId();
  const { data: results, error } = await supabase
    .from('match_results')
    .insert({
      match_id: data.matchId,
      team_home_id: data.teamHomeId,
      team_away_id: data.teamAwayId,
      goals_home: data.goalsHome,
      goals_away: data.goalsAway,
      confirmed_by: confirmedBy,
    })
    .select('*')
    .returns<MatchResult[]>();

  if (error) {
    throwSupabaseError('Error submitting match result', error);
  }

  if (!results?.[0]) {
    const insertError = new Error('No data returned after submitting match result');
    console.error('[matchmaking] No data returned after submitting match result', insertError);
    throw insertError;
  }

  const { error: matchError } = await supabase
    .from('matches')
    .update({ status: 'played' })
    .eq('id', data.matchId);

  if (matchError) {
    throwSupabaseError('Error marking match as played after result', matchError);
  }

  return results[0];
}

export const updatePlayerGoals = async (
  scorers: { userId: string; goals: number }[]
) => {
  for (const scorer of scorers) {
    if (scorer.goals <= 0) continue;

    const { error } = await supabase.rpc('increment_player_goals', {
      p_user_id: scorer.userId,
      p_goals: scorer.goals,
    });

    if (error) {
      throwSupabaseError('Error updating player goals', error);
    }
  }
};

export async function upsertTeamPublicProfile(
  teamId: string,
  data: Partial<TeamPublicProfile>
): Promise<TeamPublicProfile> {
  const { data: profiles, error } = await supabase
    .from('team_public_profiles')
    .upsert(
      {
        team_id: teamId,
        bio: data.bio,
        founded_year: data.founded_year,
        home_zone: data.home_zone,
        preferred_size: data.preferred_size,
        preferred_surface: data.preferred_surface,
        logo_url: data.logo_url,
        banner_url: data.banner_url,
        social_instagram: data.social_instagram,
        is_public: data.is_public,
      },
      { onConflict: 'team_id' }
    )
    .select('*')
    .returns<TeamPublicProfile[]>();

  if (error) {
    throwSupabaseError('Error upserting team public profile', error);
  }

  if (!profiles?.[0]) {
    const upsertError = new Error('No data returned after upserting team public profile');
    console.error('[matchmaking] No data returned after upserting team public profile', upsertError);
    throw upsertError;
  }

  return profiles[0];
}
