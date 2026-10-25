import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DrawingPreview } from '@/components/drawing-preview';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { catalog, categories } from '@/data';
import { artworkFor, challengeProgress } from '@/domain/progress';
import type { CategoryId, Drawing, Subject } from '@/domain/types';
import { useProgress } from '@/state/progress-context';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type SubjectFilter = Subject | 'all';
type CategoryFilter = CategoryId | 'all';

const SUBJECT_OPTIONS: { id: SubjectFilter; label: string; emoji: string }[] = [
  { id: 'all', label: 'Todos', emoji: '🌈' },
  { id: 'math', label: 'Matemática', emoji: '🔢' },
  { id: 'portuguese', label: 'Português', emoji: '🔤' },
];

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; emoji?: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}${selected ? ', selecionado' : ''}`}
            onPress={() => onChange(option.id)}
            style={[styles.chip, selected && styles.chipSelected]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {option.emoji ? `${option.emoji} ` : ''}
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function GalleryCard({
  drawing,
  unlocked,
  hasArtwork,
  finished,
  onPress,
}: {
  drawing: Drawing;
  unlocked: boolean;
  hasArtwork: boolean;
  finished: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${drawing.title}. ${
        unlocked ? (finished ? 'Pintura finalizada' : 'Desbloqueado') : 'Bloqueado, resolva o desafio para conquistar'
      }`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.thumb}>
        <DrawingPreview drawing={drawing} size={128} />
        {!unlocked ? (
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {drawing.title}
      </Text>
      {unlocked ? (
        <Text style={[styles.cardStatus, finished && styles.cardStatusDone]}>
          {finished ? 'Finalizada' : hasArtwork ? 'Em andamento' : 'Pronto para colorir'}
        </Text>
      ) : (
        <Text style={styles.cardStatus}>Toque para o desafio</Text>
      )}
    </Pressable>
  );
}

export default function GalleryScreen() {
  const params = useLocalSearchParams<{ subject?: string }>();
  const { snapshot, stats } = useProgress();
  const [subject, setSubject] = useState<SubjectFilter>(
    params.subject === 'math' || params.subject === 'portuguese' ? params.subject : 'all',
  );
  const [category, setCategory] = useState<CategoryFilter>('all');

  const drawings = useMemo(
    () =>
      catalog.drawings.filter((drawing) => {
        const challenge = catalog.challengeForDrawing.get(drawing.id);
        const matchesSubject = subject === 'all' || challenge?.subject === subject;
        const matchesCategory = category === 'all' || drawing.category === category;
        return matchesSubject && matchesCategory;
      }),
    [subject, category],
  );

  return (
    <Screen>
      <TopBar
        title="Galeria"
        subtitle={`${stats.unlockedDrawings} de ${stats.totalDrawings} desenhos conquistados`}
        right={
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>
              {stats.unlockedDrawings}/{stats.totalDrawings}
            </Text>
          </View>
        }
      />

      <Chips options={SUBJECT_OPTIONS} value={subject} onChange={setSubject} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: category === 'all' }}
          onPress={() => setCategory('all')}
          style={[styles.chip, styles.chipSmall, category === 'all' && styles.chipSelected]}>
          <Text style={[styles.chipText, category === 'all' && styles.chipTextSelected]}>Todas as coleções</Text>
        </Pressable>
        {categories.map((item) => {
          const selected = category === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.label}${selected ? ', selecionado' : ''}`}
              onPress={() => setCategory(item.id)}
              style={[styles.chip, styles.chipSmall, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {item.emoji} {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {drawings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎨</Text>
          <Text style={styles.emptyText}>Nenhum desenho nesta combinação. Tente outra coleção.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {drawings.map((drawing) => {
            const challenge = catalog.challengeForDrawing.get(drawing.id);
            const progress = challenge ? challengeProgress(snapshot, challenge.id) : null;
            const unlocked = progress?.isCompleted ?? false;
            const artwork = artworkFor(snapshot, drawing.id, new Date().toISOString());
            const hasArtwork = artwork.actions.length > 0;
            const finished = artwork.status === 'finished';
            return (
              <GalleryCard
                key={drawing.id}
                drawing={drawing}
                unlocked={unlocked}
                hasArtwork={hasArtwork}
                finished={finished && hasArtwork}
                onPress={() =>
                  router.push(
                    unlocked ? `/studio/${drawing.id}` : `/challenge/${drawing.id}`,
                  )
                }
              />
            );
          })}
        </View>
      )}

      <View style={styles.legend}>
        <Text style={styles.legendText}>🔒 Cada desenho tem um desafio só dele.</Text>
        <Text style={styles.legendText}>✅ Ao acertar, o desenho é seu para sempre.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.outline,
  },
  chipSmall: {
    paddingHorizontal: spacing.md,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.label,
    color: colors.inkSoft,
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
  counterPill: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  counterText: {
    ...typography.label,
    color: colors.secondaryDark,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  card: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.outline,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: spacing.xs,
  },
  lockBadge: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  lockIcon: {
    fontSize: 16,
  },
  cardTitle: {
    ...typography.label,
    color: colors.ink,
    paddingHorizontal: spacing.xs,
  },
  cardStatus: {
    ...typography.caption,
    color: colors.inkSoft,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  cardStatusDone: {
    color: colors.successDark,
  },
  pressed: {
    opacity: 0.8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  legend: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  legendText: {
    ...typography.caption,
    color: colors.inkSoft,
  },
});
