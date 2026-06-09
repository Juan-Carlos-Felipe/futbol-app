import { supabase } from './supabase';

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  price_base: number;
  price_platform: number;
  price_public: number | null;
  surface: string | null;
  size: string | null;
  photos: string[] | null;
  amenities: string[] | null;
  schedule: Record<string, unknown> | null;
  mp_collector_id: string | null;
  is_featured: boolean | null;
  is_municipal: boolean | null;
  discount_pct: number | null;
  rating: number | null;
  review_count: number | null;
  created_at: string | null;
}

export interface VenueSlot {
  id: string;
  venue_id: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean | null;
  reserved_by: string | null;
}

export interface VenueReview {
  id: string;
  venue_id: string | null;
  user_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface VenueFilters {
  surface?: string;
  size?: string;
  maxPrice?: number;
  soloHoy?: boolean;
}

export type VenueWithDistance = Venue & {
  distanceKm: number;
};

type VenueReviewRow = Omit<VenueReview, 'display_name' | 'avatar_url'> & {
  users: {
    display_name: string;
    avatar_url: string | null;
  } | null;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) {
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(destination.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function todayIsoDate() {
  return new Date().toISOString().split('T')[0];
}

export async function getNearbyVenues({
  lat,
  lng,
  filters,
}: {
  lat?: number;
  lng?: number;
  filters?: VenueFilters;
}): Promise<Array<Venue | VenueWithDistance>> {
  console.log('[venues] getNearbyVenues called with lat/lng:', lat, lng);
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .returns<Venue[]>();

  if (error) {
    console.error('[venues] Error fetching venues', error);
    throw error;
  }

  console.log('[venues] Fetched venues:', data?.length, data);
  let venues = data ?? [];

  if (filters?.surface) {
    venues = venues.filter((venue) => venue.surface === filters.surface);
  }

  if (filters?.size) {
    venues = venues.filter((venue) => venue.size === filters.size);
  }

  if (typeof filters?.maxPrice === 'number') {
    const maxPrice = filters.maxPrice;
    venues = venues.filter((venue) => venue.price_platform <= maxPrice);
  }

  if (filters?.soloHoy) {
    const { data: slots, error: slotsError } = await supabase
      .from('venue_slots')
      .select('venue_id')
      .eq('date', todayIsoDate())
      .eq('is_available', true)
      .returns<Array<Pick<VenueSlot, 'venue_id'>>>();

    if (slotsError) {
      console.error('[venues] Error fetching available slots for today', slotsError);
      throw slotsError;
    }

    const availableVenueIds = new Set(
      (slots ?? [])
        .map((slot) => slot.venue_id)
        .filter((venueId): venueId is string => venueId !== null)
    );

    venues = venues.filter((venue) => availableVenueIds.has(venue.id));
  }

  if (typeof lat === 'number' && typeof lng === 'number') {
    return venues
      .map((venue) => ({
        ...venue,
        distanceKm:
          venue.lat === null || venue.lng === null
            ? Number.POSITIVE_INFINITY
            : getDistanceKm({ lat, lng }, { lat: venue.lat, lng: venue.lng }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return venues;
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .limit(1)
    .returns<Venue[]>();

  if (error) {
    console.error('[venues] Error fetching venue by id', error);
    throw error;
  }

  return data?.[0] ?? null;
}

export async function getVenueSlots(
  venueId: string,
  date: string
): Promise<VenueSlot[]> {
  const { data, error } = await supabase
    .from('venue_slots')
    .select('*')
    .eq('venue_id', venueId)
    .eq('date', date)
    .order('start_time', { ascending: true })
    .returns<VenueSlot[]>();

  if (error) {
    console.error('[venues] Error fetching venue slots', error);
    throw error;
  }

  return data ?? [];
}

export async function getVenueReviews(venueId: string): Promise<VenueReview[]> {
  const { data, error } = await supabase
    .from('venue_reviews')
    .select(
      `
        *,
        users (
          display_name,
          avatar_url
        )
      `
    )
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<VenueReviewRow[]>();

  if (error) {
    console.error('[venues] Error fetching venue reviews', error);
    throw error;
  }

  return (data ?? []).map((review) => ({
    id: review.id,
    venue_id: review.venue_id,
    user_id: review.user_id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    display_name: review.users?.display_name ?? null,
    avatar_url: review.users?.avatar_url ?? null,
  }));
}
