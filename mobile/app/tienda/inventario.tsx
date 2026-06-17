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
import BalonesWidget from '@/components/store/BalonesWidget';
import { StorePreview } from '@/components/store/StorePreview';
import { useAuth } from '@/hooks/useAuth';
import { useEquipItem, useUserInventory } from '@/hooks/useStore';
import { type StoreItemType, type UserInventory } from '@/lib/store';
import { colors, font, radii, shadows, spacing } from '@/lib/theme';

const CATEGORIES = ['Camisetas', 'Poses', 'Badges', 'Marcos'] as const;
type InventoryCategory = (typeof CATEGORIES)[number];

export default function InventoryScreen() {
  const { userId } = useAuth();
  const [category, setCategory] = useState<InventoryCategory>('Camisetas');
  const { inventory, isLoading } = useUserInventory(userId);
  const { equip, isEquipping } = useEquipItem();

  const filteredInventory = useMemo(
    () =>
      inventory.filter((item) => {
        const type = item.store_items?.type;
        if (!type) return false;
        return isInCategory(type, category);
      }),
    [category, inventory]
  );

  async function handleEquip(item: UserInventory) {
    if (!userId || !item.store_items) return;

    try {
      await equip({ userId, itemId: item.item_id, type: item.store_items.type });
      Alert.alert('Listo', `${item.store_items.name} equipado.`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo equipar.');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MI INVENTARIO</Text>
          <Text style={styles.subtitle}>Tus skins y premios</Text>
        </View>
        {userId ? <BalonesWidget userId={userId} /> : null}
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
          data={filteredInventory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No tienes items en esta categoria todavia.</Text>
          }
          renderItem={({ item }) =>
            item.store_items ? (
              <View style={styles.card}>
                <View style={styles.preview}>
                  <StorePreview item={item.store_items} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.store_items.name}</Text>
                  <Text style={styles.description}>{item.store_items.description}</Text>
                </View>
                {item.equipped ? (
                  <View style={styles.equippedBadge}>
                    <Text style={styles.equippedText}>Equipado</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.equipButton}
                    onPress={() => handleEquip(item)}
                    disabled={isEquipping}
                  >
                    <Text style={styles.equipText}>Equipar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

function isInCategory(type: StoreItemType, category: InventoryCategory) {
  if (category === 'Camisetas') return type === 'jersey_color' || type === 'jersey_design';
  if (category === 'Poses') return type === 'pose';
  if (category === 'Badges') return type === 'badge';
  return type === 'card_frame';
}

const styles = StyleSheet.create({
  activeTab: { backgroundColor: colors.success },
  activeTabText: { color: colors.background },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 14,
    ...shadows.card,
  },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  description: { color: colors.textSubtle, fontFamily: font.regular, fontSize: 12, marginTop: 3 },
  empty: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 14,
    padding: spacing.lg,
    textAlign: 'center',
  },
  equipButton: {
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  equipText: { color: colors.background, fontFamily: font.bold, fontSize: 12, fontWeight: '900' },
  equippedBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  equippedText: { color: '#16a34a', fontFamily: font.bold, fontSize: 12, fontWeight: '900' },
  header: {
    alignItems: 'center',
    backgroundColor: '#0a3d1f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
  },
  info: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: 120 },
  name: { color: colors.text, fontFamily: font.bold, fontSize: 15, fontWeight: '900' },
  preview: { alignItems: 'center', width: 78 },
  screen: { backgroundColor: colors.background, flex: 1 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontFamily: font.medium, fontSize: 13 },
  tab: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tabText: { color: colors.textMuted, fontFamily: font.bold, fontSize: 12, fontWeight: '900' },
  tabs: { gap: 8, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  title: { color: colors.white, fontFamily: font.extraBold, fontSize: 32, fontWeight: '900' },
});
