import { supabase } from '@/lib/supabase';

export type StoreItemType = 'jersey_color' | 'jersey_design' | 'pose' | 'badge' | 'card_frame';

export interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  type: StoreItemType;
  price_balones: number;
  is_free: boolean;
  is_premium: boolean;
  level_required: number;
  preview_url: string | null;
  data: Record<string, any>;
  is_active: boolean;
}

export interface UserInventory {
  id: string;
  user_id: string;
  item_id: string;
  equipped: boolean;
  obtained_at: string;
  store_items?: StoreItem | null;
}

export interface UserBalones {
  user_id: string;
  balance: number;
  total_earned: number;
}

export async function getStoreItems(): Promise<StoreItem[]> {
  const { data, error } = await supabase
    .from('store_items')
    .select('*')
    .eq('is_active', true)
    .order('price_balones', { ascending: true });

  if (error) throw error;
  return (data ?? []) as StoreItem[];
}

export async function getUserInventory(userId: string): Promise<UserInventory[]> {
  const { data, error } = await supabase
    .from('user_inventory')
    .select('*, store_items(*)')
    .eq('user_id', userId)
    .order('obtained_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserInventory[];
}

export async function getUserBalones(userId: string): Promise<UserBalones | null> {
  const { data, error } = await supabase
    .from('user_balones')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return null;
  return data as UserBalones | null;
}

export async function purchaseItem(
  userId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('purchase_item', {
    p_user_id: userId,
    p_item_id: itemId,
  });

  if (error) throw error;
  return data as { success: boolean; error?: string };
}

export async function equipItem(
  userId: string,
  itemId: string,
  type: StoreItemType
): Promise<void> {
  const { data: equippedItems, error: equippedError } = await supabase
    .from('user_inventory')
    .select('id, store_items(type)')
    .eq('user_id', userId)
    .eq('equipped', true);

  if (equippedError) throw equippedError;

  const toUnequip = (equippedItems ?? []).filter(
    (inventoryItem: any) => inventoryItem.store_items?.type === type
  );

  if (toUnequip.length > 0) {
    const { error } = await supabase
      .from('user_inventory')
      .update({ equipped: false })
      .in(
        'id',
        toUnequip.map((inventoryItem) => inventoryItem.id)
      );

    if (error) throw error;
  }

  const { error } = await supabase
    .from('user_inventory')
    .update({ equipped: true })
    .eq('user_id', userId)
    .eq('item_id', itemId);

  if (error) throw error;
}
