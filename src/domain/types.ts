/** Tipos compartilhados do domínio do Colors Club. */

export type Subject = 'math' | 'portuguese';

export type Difficulty = 1 | 2 | 3;

export type CategoryId = 'animals' | 'nature' | 'space' | 'home' | 'fantasy' | 'vehicles';

/** Grupo de elementos ilustrados (emoji) usado nos enunciados e nas dicas. */
export interface EmojiGroup {
  emoji: string;
  count: number;
  caption?: string;
}

/** Região fechada de um desenho, colorível com um toque. */
export interface DrawingRegion {
  id: string;
  label: string;
  /** Caminho SVG no espaço do viewBox do desenho. */
  d: string;
}

/** Traço decorativo (olhos, bigodes, contornos internos) não colorível. */
export interface DrawingDetail {
  d: string;
  width?: number;
  fill?: string;
}

export interface Drawing {
  id: string;
  title: string;
  category: CategoryId;
  /** Regra 1:1 — cada desenho aponta para exatamente um desafio. */
  challengeId: string;
  difficulty: Difficulty;
  viewBox: string;
  regions: DrawingRegion[];
  details: DrawingDetail[];
}

export interface ChallengeOption {
  id: string;
  label: string;
  emoji?: string;
}

export interface ChallengeHint {
  text: string;
  groups?: EmojiGroup[];
}

export interface Challenge {
  id: string;
  /** Regra 1:1 — cada desafio aponta para exatamente um desenho. */
  drawingId: string;
  subject: Subject;
  skill: string;
  difficulty: Difficulty;
  prompt: string;
  illustration?: EmojiGroup[];
  options: ChallengeOption[];
  correctOptionId: string;
  hint: ChallengeHint;
  /** Quantidade de erros antes de mostrar a dica visual (regra do produto: 2). */
  attemptsBeforeHint: number;
}

export interface Catalog {
  drawings: Drawing[];
  challenges: Challenge[];
  byDrawingId: Map<string, Drawing>;
  byChallengeId: Map<string, Challenge>;
  challengeForDrawing: Map<string, Challenge>;
}

export interface ChallengeProgress {
  challengeId: string;
  wrongAttempts: number;
  isCompleted: boolean;
  completedAt: string | null;
  hintShown: boolean;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export type ArtAction =
  | { kind: 'fill'; regionId: string; color: string }
  | { kind: 'stroke'; stroke: Stroke }
  | { kind: 'clear' };

export type ArtworkStatus = 'in_progress' | 'finished';

export interface Artwork {
  drawingId: string;
  actions: ArtAction[];
  undone: ArtAction[];
  status: ArtworkStatus;
  updatedAt: string;
}

export type ActivityKind = 'challenge' | 'studio' | 'gallery' | 'album';

export interface LastActivity {
  kind: ActivityKind;
  drawingId: string | null;
  at: string;
}

/** Todo o estado persistido no dispositivo. */
export interface ProgressSnapshot {
  version: number;
  createdAt: string;
  challenges: Record<string, ChallengeProgress>;
  artworks: Record<string, Artwork>;
  lastActivity: LastActivity | null;
}
