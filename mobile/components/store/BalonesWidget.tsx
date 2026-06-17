import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useUserBalones } from '@/hooks/useStore';
import { colors, font, radii } from '@/lib/theme';

export default function BalonesWidget({
  userId,
  onPress,
}: {
  userId: string;
  onPress?: () => void;
}) {
  const router = useRouter();
  const { balones } = useUserBalones(userId);
  const balance = balones?.balance ?? 0;

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress ?? (() => router.push('/tienda'))}
      activeOpacity={0.85}
    >
      <View>
        <AnimatedNumber value={balance} prefix="⚽ " style={styles.value} />
        <Text style={styles.label}>Balones</Text>
        {balance < 50 ? <Text style={styles.warning}>Pocos balones</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSubtle, fontFamily: font.semiBold, fontSize: 10, marginTop: -2 },
  value: { color: '#f59e0b', fontFamily: font.extraBold, fontSize: 18, fontWeight: '900' },
  warning: { color: colors.danger, fontFamily: font.bold, fontSize: 10, marginTop: 2 },
  wrap: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
});
