import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMyTeams } from '@/hooks/useTeams';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PlayerCard } from '@/components/player-card/PlayerCard';
import { getShirtById } from '@/lib/shirts';
import { colors, font } from '@/lib/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function AlbumEquipoScreen() {
  const router = useRouter();
  const { data: teams } = useMyTeams();
  const activeTeamId = (teams as any)?.[0]?.team_id;

  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const { data: players } = useQuery({
    queryKey: ['team-laminas', activeTeamId],
    queryFn: async () => {
      if (!activeTeamId) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          users:user_id (
            display_name,
            card_photo_url,
            card_shirt_id,
            card_shirt_number,
            card_position,
            card_country_flag,
            card_style,
            player_stats (
                matches_played,
                wins,
                goals,
                assists,
                elo
            )
          )
        `)
        .eq('team_id', activeTeamId);

      if (error) throw error;
      return (data as any).map((m: any) => m.users).filter((u: any) => u.card_photo_url);
    },
    enabled: !!activeTeamId
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>ÁLBUM DEL EQUIPO</Text>
          <Text style={styles.headerSub}>{(players as any)?.length || 0} jugadores con lámina</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={players as any[]}
        numColumns={2}
        keyExtractor={(item: any) => item.display_name + Math.random()}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={styles.cardItem}
            onPress={() => setSelectedPlayer(item)}
          >
            <PlayerCard
              photoUri={item.card_photo_url}
              playerName={item.display_name}
              teamName={(teams as any)?.[0]?.teams?.name || 'Equipo'}
              shirt={getShirtById(item.card_shirt_id)}
              shirtNumber={item.card_shirt_number}
              position={item.card_position}
              stats={{
                pj: item.player_stats?.[0]?.matches_played || 0,
                g: item.player_stats?.[0]?.wins || 0,
                gl: item.player_stats?.[0]?.goals || 0,
                ast: item.player_stats?.[0]?.assists || 0,
              }}
              elo={item.player_stats?.[0]?.elo || 1000}
              level={`NIVEL ${Math.floor((item.player_stats?.[0]?.elo || 1000) / 200)}`}
              countryFlag={item.card_country_flag}
              cardStyle={item.card_style}
              width={screenWidth / 2 - 25}
              height={(screenWidth / 2 - 25) * 1.4}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      <Modal
        visible={!!selectedPlayer}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPlayer(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            onPress={() => setSelectedPlayer(null)}
          />
          {selectedPlayer && (
            <View style={styles.modalContent}>
               <PlayerCard
                photoUri={selectedPlayer.card_photo_url}
                playerName={selectedPlayer.display_name}
                teamName={(teams as any)?.[0]?.teams?.name || 'Equipo'}
                shirt={getShirtById(selectedPlayer.card_shirt_id)}
                shirtNumber={selectedPlayer.card_shirt_number}
                position={selectedPlayer.card_position}
                stats={{
                  pj: selectedPlayer.player_stats?.[0]?.matches_played || 0,
                  g: selectedPlayer.player_stats?.[0]?.wins || 0,
                  gl: selectedPlayer.player_stats?.[0]?.goals || 0,
                  ast: selectedPlayer.player_stats?.[0]?.assists || 0,
                }}
                elo={selectedPlayer.player_stats?.[0]?.elo || 1000}
                level={`NIVEL ${Math.floor((selectedPlayer.player_stats?.[0]?.elo || 1000) / 200)}`}
                countryFlag={selectedPlayer.card_country_flag}
                cardStyle={selectedPlayer.card_style}
                width={screenWidth * 0.85}
                height={screenWidth * 0.85 * 1.4}
              />
              <TouchableOpacity style={styles.proposeBtn} onPress={() => {
                setSelectedPlayer(null);
              }}>
                <Text style={styles.proposeBtnText}>⚽ Proponer partido</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 120,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40
  },
  headerTitle: { color: 'white', fontFamily: font.bebas, fontSize: 32 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontFamily: font.dmRegular, fontSize: 14 },
  backBtn: { padding: 8 },
  list: { padding: 15 },
  cardItem: { flex: 1, marginBottom: 20, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCloseArea: { ...StyleSheet.absoluteFillObject },
  modalContent: { alignItems: 'center', gap: 20 },
  proposeBtn: { backgroundColor: colors.success, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10 },
  proposeBtnText: { color: 'white', fontFamily: font.dmBold, fontSize: 16 },
});
