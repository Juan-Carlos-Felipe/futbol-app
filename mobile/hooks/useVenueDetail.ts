import { useQueries } from '@tanstack/react-query';
import {
  getVenueById,
  getVenueSlots,
  getVenueReviews,
  Venue,
  VenueSlot,
  VenueReview,
} from '@/lib/venues';

function defaultDate() {
  return new Date().toISOString().split('T')[0];
}

export function useVenueDetail(venueId: string, selectedDate?: string) {
  const date = selectedDate ?? defaultDate();

  const [venueQuery, slotsQuery, reviewsQuery] = useQueries({
    queries: [
      {
        queryKey: ['venue', venueId],
        queryFn: () => getVenueById(venueId),
        enabled: !!venueId,
      },
      {
        queryKey: ['venue-slots', venueId, date],
        queryFn: () => getVenueSlots(venueId, date),
        enabled: !!venueId,
      },
      {
        queryKey: ['venue-reviews', venueId],
        queryFn: () => getVenueReviews(venueId),
        enabled: !!venueId,
      },
    ],
  }) as [
    { data: Venue | null | undefined; isLoading: boolean; isError: boolean },
    { data: VenueSlot[] | undefined; isLoading: boolean; isError: boolean },
    { data: VenueReview[] | undefined; isLoading: boolean; isError: boolean }
  ];

  return {
    venue: venueQuery.data ?? null,
    slots: slotsQuery.data ?? [],
    reviews: reviewsQuery.data ?? [],
    isLoading: venueQuery.isLoading || slotsQuery.isLoading || reviewsQuery.isLoading,
    isError: venueQuery.isError || slotsQuery.isError || reviewsQuery.isError,
  };
}
