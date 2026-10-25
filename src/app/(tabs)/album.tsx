import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { DrawingPreview } from '@/components/drawing-preview';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { catalog } from '@/data';
import { computeMedals, deriveFills } from '@/domain/progress';
import { useProgress } from '@/state/progress-context';
import { colors, radii, spacing, typography } from '@/theme/tokens';

export default function AlbumScreen() {
  const { snapshot, stats } = useProgress();
  const medals = computeMedals(snapshot, catalog.drawings, catalog.challenges);
  const artworks = Object.values(snapshot.artworks)
    .filter((artwork) => artwork.actions.length > 0)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <Screen>
      <TopBar title="Meu álbum" subtitle="Suas conquistas e suas artes" />

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.unlockedDrawings}</Text>
          <Text style={styles.summaryLabel}>desenhos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.completedChallenges}</Text>
          <Text style={styles.summaryLabel}>desafios</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.finishedArtworks}</Text>
          <Text style={styles.summaryLabel}>artes prontas</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <ProgressBar
          label="Coleção completa"
          value={stats.unlockedDrawings}
          total={stats.totalDrawings}
          tone="secondary"
        />
      </View>

      <Text style={styles.sectionTitle}>Medalhas</Text>
      <View style={styles.medalGrid}>
        {medals.map((medal) => (
          <View
            key={medal.id}
            accessible
            accessibilityLabel={`${medal.title}. ${medal.description} ${
              medal.earned ? 'Conquistada' : 'Ainda não conquistada'
            }`}
            style={[styles.medal, !medal.earned && styles.medalLocked]}>
            <Text style={[styles.medalEmoji, !medal.earned && styles.medalEmojiLocked]}>
              {medal.earned ? medal.emoji : '🔒'}
            </Text>
            <Text style={styles.medalTitle}>{medal.title}</Text>
            <Text style={styles.medalDescription}>{medal.description}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Minhas artes</Text>
      {artworks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🖌️</Text>
          <Text style={styles.emptyText}>
            Ainda não há pinturas aqui. Escolha um desenho na galeria e comece a criar.
          </Text>
          <AppButton
            label="Ir para a galeria"
            emoji="🖼️"
            variant="secondary"
            onPress={() => router.push('/gallery')}
          />
        </View>
      ) : (
        <View style={styles.artList}>
          {artworks.map((artwork) => {
            const drawing = catalog.byDrawingId.get(artwork.drawingId);
            if (!drawing) return null;
            const fills = deriveFills(artwork);
            const painted = Object.keys(fills).length;
            return (
              <Pressable
                key={artwork.drawingId}
                accessibilityRole="button"
                accessibilityLabel={`${drawing.title}, ${
                  artwork.status === 'finished' ? 'finalizada' : 'em andamento'
                }`}
                onPress={() => router.push(`/studio/${drawing.id}`)}
                style={({ pressed }) => [styles.artCard, pressed && styles.pressed]}>
                <DrawingPreview drawing={drawing} fills={fills} size={84} />
                <View style={styles.artInfo}>
                  <Text style={styles.artTitle}>{drawing.title}</Text>
                  <Text
                    style={[
                      styles.artStatus,
                      artwork.status === 'finished' && styles.artStatusDone,
                    ]}>
                    {artwork.status === 'finished' ? 'Finalizada' : 'Em andamento'}
                  </Text>
                  <Text style={styles.artMeta}>{painted} áreas pintadas</Text>
                </View>
                <Text style={styles.artArrow}>›</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.footer}>Sem rankings e sem comparações: cada conquista é sua.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.outline,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.display,
    color: colors.ink,
    fontSize: 26,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.outline,
  },
  progressCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.outline,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  medalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  medal: {
    width: '47.5%',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 2,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  medalLocked: {
    backgroundColor: colors.lockedSoft,
    borderColor: colors.outline,
  },
  medalEmoji: {
    fontSize: 26,
  },
  medalEmojiLocked: {
    fontSize: 22,
    opacity: 0.7,
  },
  medalTitle: {
    ...typography.label,
    color: colors.ink,
  },
  medalDescription: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  artList: {
    gap: spacing.md,
  },
  artCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.outline,
    padding: spacing.md,
  },
  artInfo: {
    flex: 1,
    gap: 2,
  },
  artTitle: {
    ...typography.heading,
    color: colors.ink,
  },
  artStatus: {
    ...typography.label,
    color: colors.primaryDark,
  },
  artStatusDone: {
    color: colors.successDark,
  },
  artMeta: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  artArrow: {
    fontSize: 26,
    color: colors.inkSoft,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.outline,
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyText: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  footer: {
    ...typography.caption,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
