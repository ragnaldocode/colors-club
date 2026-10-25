import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PaintCanvas } from '@/components/paint-canvas';
import type { PaintMode } from '@/components/paint-canvas';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { catalog } from '@/data';
import {
  artworkFor,
  challengeProgress,
  deriveFills,
  deriveStrokes,
  eraseAt,
  redoArt,
  undoArt,
} from '@/domain/progress';
import type { StrokePoint } from '@/domain/types';
import { tapFeedback } from '@/services/haptics';
import { useProgress } from '@/state/progress-context';
import { colors as theme, palette, radii, spacing, typography } from '@/theme/tokens';

const COLOR_NAMES = [
  'vermelho',
  'laranja',
  'amarelo',
  'verde-limão',
  'verde',
  'turquesa',
  'azul',
  'azul-escuro',
  'violeta',
  'pink',
  'rosa',
  'marrom',
  'preto',
  'branco',
];

const BRUSH_SIZES = [
  { value: 6, label: 'fino' },
  { value: 12, label: 'médio' },
  { value: 22, label: 'grosso' },
];

const MODES: { id: PaintMode; label: string; emoji: string }[] = [
  { id: 'fill', label: 'Preencher', emoji: '🪣' },
  { id: 'brush', label: 'Desenhar', emoji: '✏️' },
  { id: 'eraser', label: 'Borracha', emoji: '🧽' },
];

export default function StudioScreen() {
  const { drawingId } = useLocalSearchParams<{ drawingId?: string }>();
  const {
    snapshot,
    fillRegion,
    applyAction,
    replaceArtwork,
    finishArtwork,
    recordActivity,
    saveState,
  } = useProgress();

  const [mode, setMode] = useState<PaintMode>('fill');
  const [color, setColor] = useState<string>(palette[0]);
  const [brushWidth, setBrushWidth] = useState(12);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const drawing = drawingId ? catalog.byDrawingId.get(drawingId) : undefined;
  const challenge = drawing ? catalog.challengeForDrawing.get(drawing.id) : undefined;
  const unlocked = challenge ? challengeProgress(snapshot, challenge.id).isCompleted : false;

  useEffect(() => {
    if (drawing && unlocked) recordActivity('studio', drawing.id);
  }, [drawing, unlocked, recordActivity]);

  const artwork = useMemo(() => {
    if (!drawing) return null;
    return artworkFor(snapshot, drawing.id, new Date().toISOString());
  }, [snapshot, drawing]);

  const fills = useMemo(() => (artwork ? deriveFills(artwork) : {}), [artwork]);
  const strokes = useMemo(() => (artwork ? deriveStrokes(artwork) : []), [artwork]);
  const paintedCount = Object.keys(fills).length;

  if (!drawing || !challenge) {
    return (
      <Screen>
        <TopBar title="Estúdio" showBack />
        <View style={styles.locked}>
          <Text style={styles.lockedEmoji}>🧭</Text>
          <Text style={styles.lockedText}>Este desenho não existe.</Text>
          <AppButton label="Ir para a galeria" onPress={() => router.replace('/gallery')} />
        </View>
      </Screen>
    );
  }

  if (!unlocked) {
    return (
      <Screen>
        <TopBar title="Estúdio" showBack onBack={() => router.replace('/gallery')} />
        <View style={styles.locked}>
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>Este desenho ainda está guardado</Text>
          <Text style={styles.lockedText}>
            Resolva o desafio “{challenge.prompt}” para conquistar “{drawing.title}”.
          </Text>
          <AppButton
            label="Ir para o desafio"
            emoji="🧩"
            onPress={() => router.replace(`/challenge/${drawing.id}`)}
          />
        </View>
      </Screen>
    );
  }

  const canUndo = (artwork?.actions.length ?? 0) > 0;
  const canRedo = (artwork?.undone.length ?? 0) > 0;
  const finished = artwork?.status === 'finished';

  return (
    <Screen>
      <TopBar
        title={drawing.title}
        subtitle={
          saveState === 'saving'
            ? 'Salvando…'
            : saveState === 'error'
              ? 'Não foi possível salvar'
              : 'Salvo no aparelho'
        }
        showBack
        onBack={() => router.replace('/gallery')}
      />

      <PaintCanvas
        drawing={drawing}
        fills={fills}
        strokes={strokes}
        mode={mode}
        color={color}
        brushWidth={brushWidth}
        onFill={(regionId) => {
          tapFeedback();
          fillRegion(drawing.id, regionId, color);
        }}
        onStroke={(stroke) => applyAction(drawing.id, { kind: 'stroke', stroke })}
        onErase={(point: StrokePoint) =>
          replaceArtwork(drawing.id, (current, now) => eraseAt(current, point, 14, now))
        }
      />

      <Text style={styles.hintLine}>
        {mode === 'fill'
          ? 'Toque numa área do desenho para pintar com a cor escolhida.'
          : mode === 'brush'
            ? 'Arraste o dedo para desenhar. O contorno do desenho fica por cima.'
            : 'Toque ou arraste sobre um traço para apagá-lo.'}
      </Text>

      <View style={styles.modeRow}>
        {MODES.map((item) => {
          const selected = item.id === mode;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.label}${selected ? ', selecionado' : ''}`}
              onPress={() => {
                tapFeedback();
                setMode(item.id);
              }}
              style={[styles.modeButton, selected && styles.modeButtonSelected]}>
              <Text style={styles.modeEmoji}>{item.emoji}</Text>
              <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Cores</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteRow}>
        {palette.map((swatch, index) => {
          const selected = swatch === color;
          return (
            <Pressable
              key={swatch}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Cor ${COLOR_NAMES[index] ?? String(index + 1)}${selected ? ', selecionada' : ''}`}
              onPress={() => {
                setColor(swatch);
                if (mode === 'eraser') setMode('fill');
              }}
              style={[
                styles.swatch,
                { backgroundColor: swatch },
                selected && styles.swatchSelected,
              ]}
            />
          );
        })}
      </ScrollView>

      <Text style={styles.sectionLabel}>Pincel</Text>
      <View style={styles.brushRow}>
        {BRUSH_SIZES.map((size) => {
          const selected = size.value === brushWidth;
          return (
            <Pressable
              key={size.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Pincel ${size.label}${selected ? ', selecionado' : ''}`}
              onPress={() => setBrushWidth(size.value)}
              style={[styles.brushButton, selected && styles.brushButtonSelected]}>
              <View
                style={{
                  width: size.value,
                  height: size.value,
                  borderRadius: size.value / 2,
                  backgroundColor: theme.ink,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        <AppButton
          label="Desfazer"
          emoji="↩️"
          variant="ghost"
          size="md"
          disabled={!canUndo}
          style={styles.actionButton}
          onPress={() =>
            replaceArtwork(drawing.id, (current, now) => undoArt(current, now))
          }
        />
        <AppButton
          label="Refazer"
          emoji="↪️"
          variant="ghost"
          size="md"
          disabled={!canRedo}
          style={styles.actionButton}
          onPress={() =>
            replaceArtwork(drawing.id, (current, now) => redoArt(current, now))
          }
        />
      </View>

      <View style={styles.actionRow}>
        <AppButton
          label="Limpar"
          emoji="🧼"
          variant="ghost"
          size="md"
          style={styles.actionButton}
          onPress={() => setConfirmVisible(true)}
        />
        <AppButton
          label={finished ? 'Pintura finalizada' : 'Finalizar pintura'}
          emoji={finished ? '✅' : '🏁'}
          variant={finished ? 'success' : 'secondary'}
          size="md"
          style={styles.actionButton}
          onPress={() => {
            finishArtwork(drawing.id, finished ? 'in_progress' : 'finished');
            if (!finished) router.replace('/album');
          }}
        />
      </View>

      <Text style={styles.meta}>
        {paintedCount} {paintedCount === 1 ? 'área pintada' : 'áreas pintadas'} •{' '}
        {strokes.length} {strokes.length === 1 ? 'traço' : 'traços'}
      </Text>

      <ConfirmDialog
        visible={confirmVisible}
        title="Limpar a pintura?"
        message="Tudo o que você pintou neste desenho será apagado. Você pode pintar de novo depois."
        confirmLabel="Sim, limpar"
        cancelLabel="Continuar pintando"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          applyAction(drawing.id, { kind: 'clear' });
          setConfirmVisible(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hintLine: {
    ...typography.caption,
    color: theme.inkSoft,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modeButton: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: theme.outline,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  modeButtonSelected: {
    backgroundColor: theme.primarySoft,
    borderColor: theme.primary,
  },
  modeEmoji: {
    fontSize: 20,
  },
  modeLabel: {
    ...typography.caption,
    color: theme.inkSoft,
  },
  modeLabelSelected: {
    color: theme.primaryDark,
  },
  sectionLabel: {
    ...typography.label,
    color: theme.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paletteRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: theme.surface,
  },
  swatchSelected: {
    borderColor: theme.ink,
  },
  brushRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  brushButton: {
    flex: 1,
    height: 52,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: theme.outline,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brushButtonSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primarySoft,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  meta: {
    ...typography.caption,
    color: theme.inkSoft,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  locked: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: theme.surface,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: theme.outline,
    padding: spacing.xl,
  },
  lockedEmoji: {
    fontSize: 40,
  },
  lockedTitle: {
    ...typography.title,
    color: theme.ink,
    textAlign: 'center',
  },
  lockedText: {
    ...typography.body,
    color: theme.inkSoft,
    textAlign: 'center',
  },
});
