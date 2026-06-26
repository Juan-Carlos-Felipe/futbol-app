import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';

export class PlayerCardExportService {
  static async exportPlayerCardAsImage(cardRef: any): Promise<string> {
    try {
      if (!cardRef.current) {
        throw new Error('Componente no disponible para captura.');
      }

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 0.9,
      });

      return uri;
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('No se pudo generar la imagen de la carta. Intenta nuevamente.');
    }
  }
}
