import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

export function MatchRequestSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <SkeletonBox width={44} height={44} borderRadius={22} />
        <View style={styles.teamText}>
          <SkeletonBox width={120} height={14} />
          <SkeletonBox width={80} height={12} style={styles.timeBox} />
        </View>
      </View>

      <SkeletonBox width="100%" height={18} style={styles.titleBox} />
      <SkeletonBox width="70%" height={14} style={styles.lineBox} />
      <SkeletonBox width="50%" height={14} style={styles.lineBox} />

      <View style={styles.detailsRow}>
        <SkeletonBox width={86} height={24} borderRadius={999} />
        <SkeletonBox width={74} height={24} borderRadius={999} />
        <SkeletonBox width={116} height={24} borderRadius={999} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  teamText: {
    marginLeft: 10,
  },
  timeBox: {
    marginTop: 7,
  },
  titleBox: {
    marginBottom: 9,
  },
  lineBox: {
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
});
