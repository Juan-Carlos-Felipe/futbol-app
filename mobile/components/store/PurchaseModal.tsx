import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StorePreview } from '@/components/store/StorePreview';
import { type StoreItem } from '@/lib/store';
import { colors, font, radii } from '@/lib/theme';

type PurchaseModalProps = {
  item: StoreItem | null;
  visible: boolean;
  userBalones: number;
  isPurchasing?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function PurchaseModal({
  item,
  visible,
  userBalones,
  isPurchasing = false,
  onConfirm,
  onClose,
}: PurchaseModalProps) {
  const nextBalance = item ? userBalones - item.price_balones : userBalones;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Confirmar compra</Text>
          {item ? (
            <>
              <View style={styles.preview}>
                <StorePreview item={item} size="lg" />
              </View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <InfoRow label="Precio" value={`⚽ ${item.price_balones.toLocaleString('es-CL')}`} />
              <InfoRow label="Tu balance" value={`⚽ ${userBalones.toLocaleString('es-CL')}`} />
              <InfoRow
                label="Balance despues"
                value={`⚽ ${nextBalance.toLocaleString('es-CL')}`}
                danger={nextBalance < 50}
              />
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={onConfirm}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={styles.buyText}>
                      Comprar ⚽ {item.price_balones.toLocaleString('es-CL')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, danger && styles.dangerText]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  buyButton: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: radii.md,
    flex: 1,
    justifyContent: 'center',
    padding: 14,
  },
  buyText: {
    color: colors.background,
    fontFamily: font.bold,
    fontSize: 13,
    fontWeight: '900',
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  cancelText: { color: colors.textMuted, fontFamily: font.bold, fontSize: 13, fontWeight: '900' },
  dangerText: { color: colors.danger },
  description: {
    color: colors.textMuted,
    fontFamily: font.regular,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoLabel: { color: colors.textSubtle, fontFamily: font.medium, fontSize: 13 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoValue: { color: colors.text, fontFamily: font.bold, fontSize: 13, fontWeight: '900' },
  name: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12,
    textAlign: 'center',
  },
  preview: { alignItems: 'center', minHeight: 150, justifyContent: 'center' },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    width: '100%',
  },
  title: { color: colors.text, fontFamily: font.bold, fontSize: 20, fontWeight: '900' },
});
