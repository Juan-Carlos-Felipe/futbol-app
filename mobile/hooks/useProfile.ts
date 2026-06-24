import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  skills: { attack: number; defense: number; speed: number; stamina: number };
  created_at: string;
  card_photo_url?: string;
  card_shirt_id: string;
  card_shirt_number: number;
  card_position: 'DEL' | 'MED' | 'DEF' | 'ARQ';
  card_country_flag: string;
  card_style: 'classic' | 'dark' | 'gold' | 'ice' | 'fire';
};

export function useProfile() {
  const { userId } = useAuth();

  return useQuery<UserProfile>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
