import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  equipItem,
  getStoreItems,
  getUserBalones,
  getUserInventory,
  purchaseItem,
  type StoreItemType,
} from '@/lib/store';

export function useStoreItems() {
  const query = useQuery({
    queryKey: ['store-items'],
    queryFn: getStoreItems,
    staleTime: 300000,
  });

  return { items: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useUserInventory(userId: string | null) {
  const query = useQuery({
    queryKey: ['inventory', userId],
    queryFn: () => getUserInventory(userId!),
    enabled: userId !== null,
  });
  const inventory = query.data ?? [];
  const owned = useMemo(() => new Set(inventory.map((item) => item.item_id)), [inventory]);

  return { inventory, owned, isLoading: query.isLoading, isError: query.isError };
}

export function useUserBalones(userId: string | null) {
  const query = useQuery({
    queryKey: ['balones', userId],
    queryFn: () => getUserBalones(userId!),
    enabled: userId !== null,
    refetchInterval: 30000,
  });

  return { balones: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}

export function usePurchaseItem() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ userId, itemId }: { userId: string; itemId: string }) =>
      purchaseItem(userId, itemId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['balones', variables.userId] });
    },
  });

  return { purchase: mutation.mutateAsync, isPurchasing: mutation.isPending };
}

export function useEquipItem() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      userId,
      itemId,
      type,
    }: {
      userId: string;
      itemId: string;
      type: StoreItemType;
    }) => equipItem(userId, itemId, type),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.userId] });
    },
  });

  return { equip: mutation.mutateAsync, isEquipping: mutation.isPending };
}
