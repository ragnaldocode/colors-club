import { StyleSheet, Text, View } from 'react-native';

import type { EmojiGroup } from '@/domain/types';
import { colors, radii, spacing, typography } from '@/theme/tokens';

interface EmojiGroupsProps {
  groups: EmojiGroup[];
  size?: number;
  caption?: string;
}

/** Ilustração concreta do enunciado: elementos repetidos e legíveis, sem texto longo. */
export function EmojiGroups({ groups, size = 30, caption }: EmojiGroupsProps) {
  return (
    <View style={styles.wrapper} accessible accessibilityLabel={caption ?? 'Ilustração do desafio'}>
      {groups.map((group, groupIndex) => (
        <View key={`${group.emoji}-${groupIndex}`} style={styles.group}>
          <View style={styles.items}>
            {Array.from({ length: group.count }).map((_, index) => (
              <Text key={`${group.emoji}-${groupIndex}-${index}`} style={{ fontSize: size }}>
                {group.emoji}
              </Text>
            ))}
          </View>
          {group.caption ? <Text style={styles.caption}>{group.caption}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  group: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: '100%',
  },
  items: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  caption: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: spacing.xs,
  },
});
