import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme/tokens';

interface ProgressBarProps {
  value: number;
  total: number;
  label?: string;
  tone?: 'primary' | 'secondary' | 'success';
}

/** Barra de progresso com rótulo falado (não depende só de cor). */
export function ProgressBar({ value, total, label, tone = 'primary' }: ProgressBarProps) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  const percent = Math.round(ratio * 100);
  const background =
    tone === 'secondary' ? colors.secondary : tone === 'success' ? colors.success : colors.primary;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label ?? 'Progresso'}: ${value} de ${total}`}
      accessibilityValue={{ min: 0, max: total, now: value }}>
      {label ? (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.counter}>
            {value}/{total}
          </Text>
        </View>
      ) : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: background }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.inkSoft,
  },
  counter: {
    ...typography.label,
    color: colors.ink,
  },
  track: {
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
