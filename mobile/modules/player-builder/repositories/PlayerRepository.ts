import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile } from '../types';

const STORAGE_KEY = '@player_builder_players';

export class PlayerRepository {
  static async savePlayer(player: PlayerProfile): Promise<void> {
    const players = await this.getPlayers();
    const index = players.findIndex((p) => p.id === player.id);

    if (index >= 0) {
      players[index] = player;
    } else {
      players.push(player);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }

  static async getPlayers(): Promise<PlayerProfile[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async getPlayerById(id: string): Promise<PlayerProfile | null> {
    const players = await this.getPlayers();
    return players.find((p) => p.id === id) || null;
  }

  static async deletePlayer(id: string): Promise<void> {
    const players = await this.getPlayers();
    const filtered = players.filter((p) => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  static async updatePlayer(player: PlayerProfile): Promise<void> {
    await this.savePlayer(player);
  }
}
