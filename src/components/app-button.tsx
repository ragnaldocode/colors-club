import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'ghost' | 'soft';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  emoji?: string;
  size?: 'md' | 'lg';
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const VARIANTS: Record<ButtonVariant, { background: string; text: string; border: string }> = {
  primary: { background: colors.primary, text: colors.white, border: colors.primaryDark },
  secondary: { background: colors.secondary, text: colors.white, border: colors.secondaryDark },
  success: { background: colors.success, text: colors.white, border: colors.successDark },
  ghost: { background: colors.surface, text: colors.ink, border: colors.outline },
  soft: { background: colors.primarySoft, text: colors.primaryDark, border: colors.primarySoft },
};

/** Botão grande, com área de toque ampla e rótulo acessível. */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  emoji,
  size = 'lg',
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: AppButtonProps) {
  const theme = VARIANTS[variant];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.large : styles.medium,
        { backgroundColor: theme.background, borderColor: theme.border },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.content}>
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <Text style={[styles.label, { color: theme.text }]} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    minHeight: 64,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  medium: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.heading,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  pressed: {
    transform: [{ translateY: 2 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
});
