import { showLocation } from 'react-native-map-link';

export const openDirections = async ({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) => {
  await showLocation({
    latitude: lat,
    longitude: lng,
    title: name,
    dialogTitle: '¿Con qué app querés ir?',
    dialogMessage: name,
    cancelText: 'Cancelar',
    appsWhiteList: ['google-maps', 'waze', 'apple-maps', 'uber', 'moovit'],
  });
};