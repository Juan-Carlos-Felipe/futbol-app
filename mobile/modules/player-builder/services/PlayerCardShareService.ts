import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

export class PlayerCardShareService {
  static async sharePlayerCard(imageUri: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir mi jugador',
          UTI: 'public.png',
        });
      } else if (Platform.OS === 'web') {
        // En web, simplemente intentamos una descarga o Share API si existe
        if (navigator.share) {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const file = new File([blob], 'mi_jugador.png', { type: 'image/png' });
            await navigator.share({
                files: [file],
                title: 'Mi Jugador',
            });
        } else {
            // Fallback: descargar
            const link = document.createElement('a');
            link.href = imageUri;
            link.download = 'mi_jugador.png';
            link.click();
        }
      } else {
        // Fallback para plataformas sin expo-sharing
        await Share.share({
          url: imageUri,
          title: 'Mi Jugador',
        });
      }
    } catch (error) {
      console.error('Sharing error:', error);
    }
  }
}
