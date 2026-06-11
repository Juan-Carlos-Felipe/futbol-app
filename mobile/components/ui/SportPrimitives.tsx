import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font, gradients, radii, shadows, spacing } from '@/lib/theme';

type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SportScreen({ children, style }: ScreenProps) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

type HeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function SportHero({ eyebrow, title, subtitle, children }: HeroProps) {
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.heroOverlay} />
      <View style={styles.heroCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </LinearGradient>
  );
}

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SportCard({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type SectionTitleProps = {
  title: string;
  action?: string;
};

export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

type StatPillProps = {
  label: string;
  value: string | number;
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'muted';
};

const TONE = {
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  muted: colors.textMuted,
};

export function StatPill({ label, value, tone = 'accent' }: StatPillProps) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color: TONE[tone] }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  hero: {
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    minHeight: 190,
    overflow: 'hidden',
    padding: spacing.xl,
    paddingTop: spacing.xl,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23,24,39,0.32)',
  },
  heroCopy: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  eyebrow: {
    color: colors.backgroundDeep,
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.white,
    fontFamily: font.extraBold,
    fontSize: 28,
    lineHeight: 34,
  },
  heroSubtitle: {
    color: colors.white,
    fontFamily: font.medium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
    opacity: 0.88,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 18,
  },
  sectionAction: {
    color: colors.accent,
    fontFamily: font.semiBold,
    fontSize: 12,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    flex: 1,
    paddingVertical: spacing.md,
  },
  statValue: {
    fontFamily: font.extraBold,
    fontSize: 20,
  },
  statLabel: {
    color: colors.textSubtle,
    fontFamily: font.medium,
    fontSize: 10,
    marginTop: 2,
  },
});
