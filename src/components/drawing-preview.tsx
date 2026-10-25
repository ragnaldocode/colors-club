import Svg, { Path } from 'react-native-svg';

import type { Drawing } from '@/domain/types';
import { colors } from '@/theme/tokens';

interface DrawingPreviewProps {
  drawing: Drawing;
  fills?: Record<string, string>;
  size?: number;
  strokeWidth?: number;
  showDetails?: boolean;
}

/** Renderiza o desenho vetorial (miniatura e estúdio compartilham o mesmo desenho). */
export function DrawingPreview({
  drawing,
  fills,
  size = 120,
  strokeWidth = 2,
  showDetails = true,
}: DrawingPreviewProps) {
  return (
    <Svg width={size} height={size} viewBox={drawing.viewBox}>
      {drawing.regions.map((region) => (
        <Path
          key={region.id}
          d={region.d}
          fill={fills?.[region.id] ?? colors.canvas}
          stroke={colors.ink}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      ))}
      {showDetails
        ? drawing.details.map((detailData, index) => (
            <Path
              key={`detail-${index}`}
              d={detailData.d}
              fill={detailData.fill ?? 'none'}
              stroke={colors.ink}
              strokeWidth={detailData.width ?? 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))
        : null}
    </Svg>
  );
}
