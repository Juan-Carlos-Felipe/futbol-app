import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

type UserCoords = {
  lat: number;
  lng: number;
};

type UserLocationState = {
  coords: UserCoords | null;
  permissionDenied: boolean;
  isLoading: boolean;
};

const DEFAULT_COORDS: UserCoords = {
  lat: -34.6037,
  lng: -58.3816,
};

export function useUserLocation(): UserLocationState {
  const [state, setState] = useState<UserLocationState>({
    coords: null,
    permissionDenied: false,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function loadLocation() {
      try {
        console.log('[useUserLocation] loadLocation called, Platform.OS:', Platform.OS);
        if (Platform.OS === 'web') {
          console.log('[useUserLocation] web, using DEFAULT_COORDS');
          if (mounted) {
            setState({
              coords: DEFAULT_COORDS,
              permissionDenied: false,
              isLoading: false,
            });
          }
          return;
        }

        console.log('[useUserLocation] requesting permissions');
        const permission = await Location.requestForegroundPermissionsAsync();
        console.log('[useUserLocation] permission status:', permission.status);

        if (permission.status !== Location.PermissionStatus.GRANTED) {
          if (mounted) {
            setState({
              coords: DEFAULT_COORDS,
              permissionDenied: true,
              isLoading: false,
            });
          }
          return;
        }

        console.log('[useUserLocation] getting current position');
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        console.log('[useUserLocation] got position:', position);

        if (mounted) {
          setState({
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            permissionDenied: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('[location] Error getting user location', error);
        if (mounted) {
          setState({
            coords: DEFAULT_COORDS,
            permissionDenied: false,
            isLoading: false,
          });
        }
      }
    }

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

  console.log('[useUserLocation] returning state:', state);
  return state;
}
