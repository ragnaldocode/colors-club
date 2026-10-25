import type React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Contêiner base: fundo quente, respeito ao notch e rolagem quando necessário. */
export function Screen({ children, scroll = true, padded = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const contentStyle = {
    paddingTop: insets.top + spacing.sm,
    paddingBottom: insets.bottom + spacing.xxl,
    paddingHorizontal: padded ? spacing.lg : 0,
  } as const;

  if (!scroll) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[contentStyle, style]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
