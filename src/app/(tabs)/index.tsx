import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Mascot } from '@/components/mascot';
import { ProgressBar } from '@/components/progress-bar';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { catalog } from '@/data';
import { challengeProgress } from '@/domain/progress';
import type { ProgressSnapshot } from '@/domain/types';
import { useProgress } from '@/state/progress-context';
import { colors, radii, spacing, typography } from '@/theme/tokens';

interface ContinueTarget {
  href: string;
  label: string;
  emoji: string;
  hint: string;
}

function nextTarget(snapshot: ProgressSnapshot): ContinueTarget {
  const last = snapshot.lastActivity;
  const lastDrawing = last?.drawingId ? catalog.byDrawingId.get(last.drawingId) : undefined;
  if (lastDrawing) {
    const challenge = catalog.challengeForDrawing.get(lastDrawing.id);
    const unlocked = challenge ? challengeProgress(snapshot, challenge.id).isCompleted : false;
    if (last?.kind === 'studio' && unlocked) {
      return {
        href: `/studio/${lastDrawing.id}`,
        label: 'Continuar pintando',
        emoji: '🖌️',
        hint: lastDrawing.title,
      };
    }
    if (challenge && !unlocked) {
      return {
        href: `/challenge/${lastDrawing.id}`,
        label: 'Continuar desafio',
        emoji: '🧩',
        hint: challenge.prompt,
      };
    }
  }

  const pending = catalog.challenges.find(
    (challenge) => !challengeProgress(snapshot, challenge.id).isCompleted,
  );
  const pendingDrawing = pending ? catalog.byDrawingId.get(pending.drawingId) : undefined;

  if (pending && pendingDrawing) {
    return {
      href: `/challenge/${pendingDrawing.id}`,
      label: 'Começar a brincar',
      emoji: '✨',
      hint: `Próximo desenho: ${pendingDrawing.title}`,
    };
  }

  return {
    href: '/gallery',
    label: 'Ver meus desenhos',
    emoji: '🖼️',
    hint: 'Todos os desenhos já são seus!',
  };
}

const SUBJECTS = [
  {
    id: 'math' as const,
    title: 'Matemática',
    emoji: '🔢',
    color: colors.secondarySoft,
    ink: colors.secondaryDark,
  },
  {
    id: 'portuguese' as const,
    title: 'Português',
    emoji: '🔤',
    color: colors.accentSoft,
    ink: colors.accentDark ?? colors.ink,
  },
];

export default function HomeScreen() {
  const { snapshot, stats } = useProgress();
  const target = nextTarget(snapshot);
  const completed = stats.completedChallenges;
  const total = stats.totalChallenges;

  return (
    <Screen>
      <TopBar title="Meu mundo" subtitle="Um cantinho para criar e aprender" />

      <View style={styles.hero}>
        <Mascot size={104} mood={stats.unlockedDrawings > 0 ? 'cheer' : 'happy'} />
        <View style={styles.speech}>
          <Text style={styles.speechText}>
            {stats.unlockedDrawings === 0
              ? 'Oi! Eu sou a Lumi. Vamos conquistar nosso primeiro desenho?'
              : `Que alegria! Você já conquistou ${stats.unlockedDrawings} ${
                  stats.unlockedDrawings === 1 ? 'desenho' : 'desenhos'
                }.`}
          </Text>
        </View>
      </View>

      <View style={styles.continueCard}>
        <Text style={styles.continueHint}>{target.hint}</Text>
        <AppButton
          label={target.label}
          emoji={target.emoji}
          onPress={() => router.push(target.href)}
          accessibilityLabel={`${target.label}. ${target.hint}`}
        />
      </View>

      <View style={styles.progressCard}>
        <ProgressBar
          label="Desenhos conquistados"
          value={stats.unlockedDrawings}
          total={stats.totalDrawings}
        />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {completed}/{total}
            </Text>
            <Text style={styles.statLabel}>desafios</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.finishedArtworks}</Text>
            <Text style={styles.statLabel}>artes prontas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.startedArtworks}</Text>
            <Text style={styles.statLabel}>em andamento</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Brincar de quê?</Text>
      <View style={styles.subjectRow}>
        {SUBJECTS.map((subject) => {
          const subjectChallenges = catalog.challenges.filter(
            (challenge) => challenge.subject === subject.id,
          );
          const done = subjectChallenges.filter(
            (challenge) => challengeProgress(snapshot, challenge.id).isCompleted,
          ).length;
          return (
            <Pressable
              key={subject.id}
              accessibilityRole="button"
              accessibilityLabel={`${subject.title}, ${done} de ${subjectChallenges.length} desafios concluídos`}
              onPress={() => router.push(`/gallery?subject=${subject.id}`)}
              style={({ pressed }) => [
                styles.subjectCard,
                { backgroundColor: subject.color },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
              <Text style={[styles.subjectTitle, { color: subject.ink }]}>{subject.title}</Text>
              <Text style={[styles.subjectCount, { color: subject.ink }]}>
                {done}/{subjectChallenges.length}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.linkRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir a galeria de desenhos"
          onPress={() => router.push('/gallery')}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Text style={styles.linkEmoji}>🖼️</Text>
          <Text style={styles.linkText}>Galeria</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir meu álbum de conquistas"
          onPress={() => router.push('/album')}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Text style={styles.linkEmoji}>🏅</Text>
          <Text style={styles.linkText}>Meu álbum</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>Tudo funciona sem internet. Seu progresso fica guardado no aparelho.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  speech: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.outline,
    padding: spacing.lg,
  },
  speechText: {
    ...typography.body,
    color: colors.ink,
  },
  continueCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  continueHint: {
    ...typography.label,
    color: colors.inkSoft,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.outline,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading,
    color: colors.ink,
  },
  statLabel: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.outline,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  subjectRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  subjectCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  subjectEmoji: {
    fontSize: 30,
  },
  subjectTitle: {
    ...typography.heading,
  },
  subjectCount: {
    ...typography.label,
    opacity: 0.8,
  },
  linkRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  link: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.outline,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  linkEmoji: {
    fontSize: 24,
  },
  linkText: {
    ...typography.label,
    color: colors.ink,
  },
  pressed: {
    opacity: 0.75,
  },
  footer: {
    ...typography.caption,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
