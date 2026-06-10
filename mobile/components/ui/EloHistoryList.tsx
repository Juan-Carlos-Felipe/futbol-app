import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getEloChange } from '@/lib/elo';
import { supabase } from '@/lib/supabase';

type EloHistoryListProps = {
  teamId: string;
};

type EloHistoryItem = {
  id: string;
  match_id: string;
  team_id: string;
  elo_before: number;
  elo_after: number;
  change: number;
  result: 'win' | 'loss' | 'draw';
  opponent_id: string;
  created_at: string;
  opponent: { name: string } | null;
};

const RESULT_ICON: Record<EloHistoryItem['result'], string> = {
  win: '✅',
  draw: '🤝',
  loss: '❌',
};

export default function EloHistoryList({ teamId }: EloHistoryListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['elo-history', teamId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('elo_history')
        .select(
          `
            *,
            opponent:teams!elo_history_opponent_id_fkey (
              name
            )
          `
        )
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(10)
        .returns<EloHistoryItem[]>();

      if (error) throw error;
      return rows ?? [];
    },
    enabled: Boolean(teamId),
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }

  if (!data?.length) {
    return <Text style={styles.empty}>Sin cambios de ELO registrados aun</Text>;
  }

  return (
    <View style={styles.list}>
      {data.map((item) => {
        const change = getEloChange(item.elo_before, item.elo_after);
        const isZero = change.change === 0;
        const changeColor = isZero ? '#6b7280' : change.isPositive ? '#16a34a' : '#dc2626';

        return (
          <View key={item.id} style={styles.row}>
            <Text style={styles.resultIcon}>{RESULT_ICON[item.result]}</Text>
            <View style={styles.body}>
              <Text style={styles.opponent}>vs {item.opponent?.name ?? 'Rival'}</Text>
              <Text style={styles.date}>
                hace {formatDistanceToNow(new Date(item.created_at), { locale: es })}
              </Text>
            </View>
            <Text style={[styles.change, { color: changeColor }]}>
              {isZero ? '±0' : change.display}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 12 },
  empty: { color: '#6b7280', fontSize: 13, fontWeight: '700' },
  list: { gap: 10 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  resultIcon: { fontSize: 18 },
  body: { flex: 1 },
  opponent: { color: '#111827', fontSize: 14, fontWeight: '900' },
  date: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  change: { fontSize: 15, fontWeight: '900' },
});
