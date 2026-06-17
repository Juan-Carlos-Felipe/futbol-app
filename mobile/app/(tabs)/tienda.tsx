import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import StoreItemCard from '@/components/store/StoreItemCard';
import PurchaseModal from '@/components/store/PurchaseModal';
import { useAuth } from '@/hooks/useAuth';
import {
  useEquipItem,
  usePurchaseItem,
  useStoreItems,
  useUserBalones,
  useUserInventory,
} from '@/hooks/useStore';
import { usePlayerStats } from '@/hooks/useMatchmaking';
import { getLevel } from '@/lib/elo';
import { type StoreItem, type StoreItemType } from '@/lib/store';
import { colors, font, radii, spacing } from '@/lib/theme';

const CATEGORIES = ['Todo', 'Camisetas', 'Poses', 'Badges', 'Marcos FIFA'] as const;
type Category = (typeof CATEGORIES)[number];

export default function StoreScreen() {
  const { userId } = useAuth();
  const [category, setCategory] = useState<Category>('Todo');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const { items, isLoading } = useStoreItems();
  const { inventory, owned } = useUserInventory(userId);
  const { balones } = useUserBalones(userId);
  const { stats } = usePlayerStats(userId);
  const { purchase, isPurchasing } = usePurchaseItem();
  const { equip } = useEquipItem();
  const balance = balones?.balance ?? 0;
  const userLevel = getLevel(stats?.elo ?? 1000).level;

  const equippedByItem = useMemo(() => {
    const equipped = new Set<string>();
    inventory.forEach((item) => {
      if (item.equipped) equipped.add(item.item_id);
    });
    return equipped;
  }, [inventory]);

  const filteredItems = useMemo(
    () => items.filter((item) => category === 'Todo' || isInCategory(item.type, category)),
    [category, items]
  );

  async function handleItemPress(item: StoreItem) {
    if (!userId) return Alert.alert('Inicia sesion', 'Necesitas una cuenta para usar la tienda.');

    if (owned.has(item.id)) {
      try {
        await equip({ userId, itemId: item.id, type: item.type });
        Alert.alert('Listo', `${item.name} equipado.`);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo equipar.');
      }
      return;
    }

    if (item.level_required > userLevel) {
      Alert.alert('Nivel insuficiente', `Necesitas nivel ${item.level_required}.`);
      return;
    }

    if (item.is_free) {
      await confirmPurchase(item);
      return;
    }

    if (item.price_balones > balance) {
      Alert.alert('Balones insuficientes', 'Juega partidos para ganar mas balones.');
      return;
    }

    setSelectedItem(item);
  }

  async function confirmPurchase(item = selectedItem) {
    if (!userId || !item) return;

    try {
      const result = await purchase({ userId, itemId: item.id });
      if (result.success) {
        setSelectedItem(null);
        Alert.alert('Compra exitosa', `${item.name} fue agregado a tu inventario.`);
      } else {
        Alert.alert('Error', result.error ?? 'No se pudo completar la compra.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo completar la compra.');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>TIENDA</Text>
          <Text style={styles.subtitle}>Personaliza tu jugador</Text>
        </View>
        <View style={styles.balancePill}>
          <Text style={styles.balanceText}>⚽ {balance.toLocaleString('es-CL')} Balones</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.tab, category === item && styles.activeTab]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.tabText, category === item && styles.activeTabText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <StoreItemCard
              item={item}
              owned={owned.has(item.id)}
              equipped={equippedByItem.has(item.id)}
              userLevel={userLevel}
              userBalones={balance}
              onPress={() => handleItemPress(item)}
            />
          )}
        />
      )}

      <PurchaseModal
        item={selectedItem}
        visible={selectedItem !== null}
        userBalones={balance}
        isPurchasing={isPurchasing}
        onConfirm={() => confirmPurchase()}
        onClose={() => setSelectedItem(null)}
      />
    </View>
  );
}

function isInCategory(type: StoreItemType, category: Category) {
  if (category === 'Camisetas') return type === 'jersey_color' || type === 'jersey_design';
  if (category === 'Poses') return type === 'pose';
  if (category === 'Badges') return type === 'badge';
  if (category === 'Marcos FIFA') return type === 'card_frame';
  return true;
}

const styles = StyleSheet.create({
  activeTab: { backgroundColor: colors.success },
  activeTabText: { color: colors.background },
  balancePill: {
    backgroundColor: '#fef3c7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  balanceText: { color: '#78350f', fontFamily: font.bold, fontSize: 12, fontWeight: '900' },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  header: {
    alignItems: 'center',
    backgroundColor: '#0a3d1f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: 22,
  },
  list: { padding: 10, paddingBottom: 120 },
  screen: { backgroundColor: colors.background, flex: 1 },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: font.medium,
    fontSize: 14,
    marginTop: 2,
  },
  tab: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tabText: { color: colors.textMuted, fontFamily: font.bold, fontSize: 12, fontWeight: '900' },
  tabs: { gap: 8, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  title: { color: colors.white, fontFamily: font.extraBold, fontSize: 36, fontWeight: '900' },
});
