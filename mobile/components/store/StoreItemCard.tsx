import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StorePreview } from '@/components/store/StorePreview';
import { type StoreItem } from '@/lib/store';
import { colors, font, radii, shadows } from '@/lib/theme';

type StoreItemCardProps = {
  item: StoreItem;
  owned: boolean;
  equipped: boolean;
  userLevel: number;
  userBalones: number;
  onPress: () => void;
};

export default function StoreItemCard({
  item,
  owned,
  equipped,
  userLevel,
  userBalones,
  onPress,
}: StoreItemCardProps) {
  const locked = !owned && item.level_required > userLevel;
  const affordable = item.price_balones <= userBalones;

  return (
    <View style={[styles.card, locked && styles.locked]}>
      <View style={styles.preview}>
        <StorePreview item={item} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>

      {owned && equipped ? (
        <StatusBadge label="Equipado" tone="success" />
      ) : owned ? (
        <TouchableOpacity style={styles.outlineButton} onPress={onPress}>
          <Text style={styles.outlineText}>Equipar</Text>
        </TouchableOpacity>
      ) : item.is_free ? (
        <StatusBadge label="Gratis" tone="success" />
      ) : locked ? (
        <StatusBadge label={`Nivel ${item.level_required}`} tone="muted" />
      ) : affordable ? (
        <TouchableOpacity style={styles.buyButton} onPress={onPress}>
          <Text style={styles.buyText}>⚽ {item.price_balones.toLocaleString('es-CL')}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noBalance}>
          ⚽ {item.price_balones.toLocaleString('es-CL')} Balones
        </Text>
      )}
    </View>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: 'success' | 'muted' }) {
  return (
    <View style={[styles.badge, tone === 'success' ? styles.successBadge : styles.mutedBadge]}>
      <Text style={[styles.badgeText, tone === 'success' ? styles.successText : styles.mutedText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    marginTop: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeText: { fontFamily: font.bold, fontSize: 12, fontWeight: '900' },
  buyButton: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    marginTop: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  buyText: {
    color: colors.background,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    flex: 1,
    margin: 6,
    minHeight: 218,
    padding: 14,
    ...shadows.card,
  },
  locked: { opacity: 0.5 },
  mutedBadge: { backgroundColor: '#e5e7eb' },
  mutedText: { color: '#4b5563' },
  name: {
    color: '#111827',
    fontFamily: font.bold,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 12,
    minHeight: 36,
    textAlign: 'center',
  },
  noBalance: {
    color: colors.danger,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 'auto',
    textAlign: 'center',
  },
  outlineButton: {
    alignItems: 'center',
    borderColor: colors.success,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  outlineText: {
    color: colors.success,
    fontFamily: font.bold,
    fontSize: 12,
    fontWeight: '900',
  },
  preview: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'center',
    marginBottom: 10,
  },
  successBadge: { backgroundColor: '#dcfce7' },
  successText: { color: '#16a34a' },
});
