import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';

import { distance } from '@/domain/progress';
import type { Drawing, Stroke, StrokePoint } from '@/domain/types';
import { colors, radii } from '@/theme/tokens';

export type PaintMode = 'fill' | 'brush' | 'eraser';

interface PaintCanvasProps {
  drawing: Drawing;
  fills: Record<string, string>;
  strokes: Stroke[];
  mode: PaintMode;
  color: string;
  brushWidth: number;
  onFill: (regionId: string) => void;
  onStroke: (stroke: Stroke) => void;
  onErase: (point: StrokePoint) => void;
}

const ERASER_RADIUS = 14;

/**
 * Superfície de pintura:
 * - modo "preencher": tocar numa região fechada pinta aquela área (sem flood-fill de pixels);
 * - modo "desenhar": traço livre em camada separada do desenho-base;
 * - modo "borracha": remove os traços tocados.
 */
export function PaintCanvas({
  drawing,
  fills,
  strokes,
  mode,
  color,
  brushWidth,
  onFill,
  onStroke,
  onErase,
}: PaintCanvasProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<Stroke | null>(null);

  const viewBox = useMemo(() => {
    const [x, y, width, height] = drawing.viewBox.split(' ').map(Number);
    return { x, y, width, height };
  }, [drawing.viewBox]);

  const latest = useRef({ mode, color, brushWidth, size, viewBox, onStroke, onErase });
  latest.current = { mode, color, brushWidth, size, viewBox, onStroke, onErase };

  const toCanvasPoint = (locationX: number, locationY: number): StrokePoint | null => {
    const { size: currentSize, viewBox: box } = latest.current;
    if (currentSize.width <= 0 || currentSize.height <= 0) return null;
    return {
      x: (locationX / currentSize.width) * box.width,
      y: (locationY / currentSize.height) * box.height,
    };
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => latest.current.mode !== 'fill',
        onMoveShouldSetPanResponder: () => latest.current.mode !== 'fill',
        onStartShouldSetPanResponderCapture: () => latest.current.mode !== 'fill',
        onPanResponderGrant: (event) => {
          const point = toCanvasPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
          if (!point) return;
          if (latest.current.mode === 'eraser') {
            latest.current.onErase(point);
            return;
          }
          setDraft({
            points: [point],
            color: latest.current.color,
            width: latest.current.brushWidth,
          });
        },
        onPanResponderMove: (event) => {
          const point = toCanvasPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
          if (!point) return;
          if (latest.current.mode === 'eraser') {
            latest.current.onErase(point);
            return;
          }
          setDraft((current) => {
            if (!current) return current;
            const last = current.points[current.points.length - 1];
            if (last && distance(last, point) < 1.5) return current;
            if (current.points.length >= 400) return current;
            return { ...current, points: [...current.points, point] };
          });
        },
        onPanResponderRelease: () => {
          setDraft((current) => {
            if (current && current.points.length > 0 && latest.current.mode === 'brush') {
              latest.current.onStroke(current);
            }
            return null;
          });
        },
        onPanResponderTerminate: () => setDraft(null),
      }),
    [],
  );

  return (
    <View
      style={styles.canvas}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
      {...responder.panHandlers}>
      <Svg width="100%" height="100%" viewBox={drawing.viewBox}>
        {drawing.regions.map((region) => (
          <Path
            key={region.id}
            d={region.d}
            fill={fills[region.id] ?? colors.canvas}
            stroke={colors.ink}
            strokeWidth={2.4}
            strokeLinejoin="round"
            onPress={mode === 'fill' ? () => onFill(region.id) : undefined}
          />
        ))}
        {drawing.details.map((detailData, index) => (
          <Path
            key={`detail-${index}`}
            d={detailData.d}
            fill={detailData.fill ?? 'none'}
            stroke={colors.ink}
            strokeWidth={detailData.width ?? 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        ))}
        {strokes.map((stroke, index) => (
          <Polyline
            key={`stroke-${index}`}
            points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        ))}
        {draft ? (
          <Polyline
            points={draft.points.map((point) => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke={draft.color}
            strokeWidth={draft.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.canvas,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
});
