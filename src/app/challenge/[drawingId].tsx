import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { DrawingPreview } from '@/components/drawing-preview';
import { EmojiGroups } from '@/components/emoji-groups';
import { Mascot } from '@/components/mascot';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { catalog } from '@/data';
import { challengeProgress } from '@/domain/progress';
import type { ChallengeOption } from '@/domain/types';
import { speak } from '@/services/audio/speech';
import { errorFeedback, successFeedback, tapFeedback } from '@/services/haptics';
import { useProgress } from '@/state/progress-context';
import { colors, radii, spacing, typography } from '@/theme/tokens';

type Outcome = 'none' | 'incorrect' | 'correct' | 'already';

function OptionCard({
  option,
  state,
  disabled,
  onPress,
}: {
  option: ChallengeOption;
  state: 'idle' | 'correct' | 'wrong' | 'muted';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Alternativa ${option.label}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        state === 'correct' && styles.optionCorrect,
        state === 'wrong' && styles.optionWrong,
        state === 'muted' && styles.optionMuted,
        pressed && !disabled && styles.pressed,
      ]}>
      {option.emoji ? <Text style={styles.optionEmoji}>{option.emoji}</Text> : null}
      <Text style={styles.optionLabel}>{option.label}</Text>
    </Pressable>
  );
}

function RewardPanel({
  drawingTitle,
  alreadyCompleted,
  drawingId,
}: {
  drawingTitle: string;
  alreadyCompleted: boolean;
  drawingId: string;
}) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
        friction: 5,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [opacity, scale]);

  const drawing = catalog.byDrawingId.get(drawingId);

  return (
    <Animated.View style={[styles.reward, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.rewardEmoji}>🎉</Text>
      <Mascot size={96} mood="cheer" />
      <Text style={styles.rewardTitle}>
        {alreadyCompleted ? 'Este desenho já é seu!' : 'Você conquistou um desenho!'}
      </Text>
      <Text style={styles.rewardDrawing}>{drawingTitle}</Text>
      {drawing ? <DrawingPreview drawing={drawing} size={140} /> : null}
      <AppButton
        label="Colorir agora"
        emoji="🖌️"
        onPress={() => router.replace(`/studio/${drawingId}`)}
      />
      <AppButton
        label="Voltar à galeria"
        emoji="🖼️"
        variant="ghost"
        onPress={() => router.replace('/gallery')}
      />
    </Animated.View>
  );
}

export default function ChallengeScreen() {
  const { drawingId } = useLocalSearchParams<{ drawingId?: string }>();
  const { snapshot, answer } = useProgress();
  const [outcome, setOutcome] = useState<Outcome>('none');
  const [wrongOptionId, setWrongOptionId] = useState<string | null>(null);

  const drawing = drawingId ? catalog.byDrawingId.get(drawingId) : undefined;
  const challenge = drawing ? catalog.challengeForDrawing.get(drawing.id) : undefined;

  if (!drawing || !challenge) {
    return (
      <Screen>
        <TopBar title="Desafio" showBack />
        <View style={styles.missing}>
          <Text style={styles.missingEmoji}>🧭</Text>
          <Text style={styles.missingText}>Não encontramos este desafio.</Text>
          <AppButton label="Ir para a galeria" onPress={() => router.replace('/gallery')} />
        </View>
      </Screen>
    );
  }

  const progress = challengeProgress(snapshot, challenge.id);
  const completed = progress.isCompleted;
  const showReward = outcome === 'correct' || outcome === 'already' || completed;
  const feedbackMessage = outcome === 'incorrect' ? 'Quase! Tente outra vez. Você consegue!' : null;
  const subjectLabel = challenge.subject === 'math' ? 'Matemática' : 'Português';

  const handleOption = (option: ChallengeOption) => {
    if (showReward) return;
    tapFeedback();
    const result = answer(challenge.id, option.id);
    if (!result) return;
    if (result.kind === 'correct') {
      successFeedback();
      setWrongOptionId(null);
      setOutcome('correct');
    } else if (result.kind === 'incorrect') {
      errorFeedback();
      setWrongOptionId(option.id);
      setOutcome('incorrect');
    } else {
      setOutcome('already');
    }
  };

  return (
    <Screen>
      <TopBar
        title="Desafio"
        subtitle={`${subjectLabel} • ${challenge.skill}`}
        showBack
        onBack={() => router.replace('/gallery')}
      />

      {showReward ? (
        <RewardPanel
          drawingTitle={drawing.title}
          alreadyCompleted={outcome !== 'correct'}
          drawingId={drawing.id}
        />
      ) : (
        <>
          <View style={styles.promptCard}>
            <Text style={styles.prompt}>{challenge.prompt}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvir o enunciado"
              onPress={() => speak(challenge.prompt)}
              style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}>
              <Text style={styles.audioIcon}>🔊</Text>
              <Text style={styles.audioLabel}>Ouvir</Text>
            </Pressable>
            {challenge.illustration ? (
              <EmojiGroups
                groups={challenge.illustration}
                caption={`Ilustração: ${challenge.prompt}`}
              />
            ) : null}
          </View>

          <Text style={styles.instruction}>
            {progress.wrongAttempts > 0 ? 'Vamos tentar de novo!' : 'Escolha uma resposta:'}
          </Text>

          <View style={styles.options}>
            {challenge.options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                disabled={false}
                state={
                  wrongOptionId === option.id
                    ? 'wrong'
                    : feedbackMessage && wrongOptionId
                      ? 'muted'
                      : 'idle'
                }
                onPress={() => handleOption(option)}
              />
            ))}
          </View>

          {feedbackMessage ? (
            <View style={styles.feedback}>
              <Text style={styles.feedbackEmoji}>🤔</Text>
              <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            </View>
          ) : null}

          {progress.hintShown ? (
            <View style={styles.hint}>
              <View style={styles.hintHeader}>
                <Text style={styles.hintTitle}>💡 Uma ajudinha</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ouvir a dica"
                  onPress={() => speak(challenge.hint.text)}
                  style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}>
                  <Text style={styles.audioIcon}>🔊</Text>
                </Pressable>
              </View>
              <Text style={styles.hintText}>{challenge.hint.text}</Text>
              {challenge.hint.groups ? (
                <EmojiGroups groups={challenge.hint.groups} size={26} caption="Dica visual" />
              ) : null}
            </View>
          ) : null}

          <View style={styles.prize}>
            <Text style={styles.prizeLabel}>🎁 Desenho para conquistar</Text>
            <View style={styles.prizeContent}>
              <DrawingPreview drawing={drawing} size={64} />
              <Text style={styles.prizeTitle}>{drawing.title}</Text>
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.outline,
    padding: spacing.lg,
    gap: spacing.md,
  },
  prompt: {
    ...typography.title,
    color: colors.ink,
    lineHeight: 32,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  audioIcon: {
    fontSize: 16,
  },
  audioLabel: {
    ...typography.label,
    color: colors.secondaryDark,
  },
  instruction: {
    ...typography.heading,
    color: colors.inkSoft,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  option: {
    flexGrow: 1,
    minWidth: '28%',
    minHeight: 84,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.outline,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  optionCorrect: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  optionWrong: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  optionMuted: {
    opacity: 0.6,
  },
  optionEmoji: {
    fontSize: 34,
  },
  optionLabel: {
    ...typography.title,
    color: colors.ink,
    fontSize: 22,
  },
  pressed: {
    opacity: 0.8,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  feedbackEmoji: {
    fontSize: 24,
  },
  feedbackText: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  hint: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hintTitle: {
    ...typography.heading,
    color: colors.ink,
  },
  hintText: {
    ...typography.body,
    color: colors.ink,
  },
  prize: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outline,
    gap: spacing.sm,
  },
  prizeLabel: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  prizeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  prizeTitle: {
    ...typography.heading,
    color: colors.ink,
  },
  reward: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.success,
    padding: spacing.xl,
  },
  rewardEmoji: {
    fontSize: 34,
  },
  rewardTitle: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'center',
  },
  rewardDrawing: {
    ...typography.heading,
    color: colors.successDark,
  },
  missing: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  missingEmoji: {
    fontSize: 40,
  },
  missingText: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
