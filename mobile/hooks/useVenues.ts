import { useQuery } from '@tanstack/react-query';
import {
  getNearbyVenues,
  Venue,
  VenueFilters,
  VenueWithDistance,
} from '@/lib/venues';

const STALE_TIME_MS = 2 * 60 * 1000;

export function useVenues(
  coords: { lat: number; lng: number } | null,
  filters?: VenueFilters
) {
  const query = useQuery<Array<Venue | VenueWithDistance>>({
    queryKey: ['venues', coords?.lat, coords?.lng, filters],
    queryFn: () => {
      console.log('[useVenues] queryFn called, coords:', coords);
      return getNearbyVenues({
        lat: coords?.lat,
        lng: coords?.lng,
        filters,
      });
    },
    enabled: true,
    staleTime: STALE_TIME_MS,
  });

  console.log('[useVenues] state:', {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  });

  return {
    venues: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
