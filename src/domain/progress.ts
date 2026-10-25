import type {
  ActivityKind,
  ArtAction,
  Artwork,
  ArtworkStatus,
  Challenge,
  ChallengeProgress,
  Drawing,
  ProgressSnapshot,
  Stroke,
  StrokePoint,
} from './types';

/** Versão do formato persistido. Incrementar exige migração em storage. */
export const SCHEMA_VERSION = 1;

/** Limite do histórico de pintura para conter o tamanho do arquivo local. */
export const MAX_ART_ACTIONS = 240;

/** Limite de pontos por traço (amostragem do dedo). */
export const MAX_POINTS_PER_STROKE = 400;

export const DEFAULT_ATTEMPTS_BEFORE_HINT = 2;

export function createProgress(now: string): ProgressSnapshot {
  return {
    version: SCHEMA_VERSION,
    createdAt: now,
    challenges: {},
    artworks: {},
    lastActivity: null,
  };
}

export function emptyChallengeProgress(challengeId: string): ChallengeProgress {
  return {
    challengeId,
    wrongAttempts: 0,
    isCompleted: false,
    completedAt: null,
    hintShown: false,
  };
}

export function challengeProgress(snapshot: ProgressSnapshot, challengeId: string): ChallengeProgress {
  return snapshot.challenges[challengeId] ?? emptyChallengeProgress(challengeId);
}

export function attemptsBeforeHint(challenge: Challenge): number {
  return challenge.attemptsBeforeHint || DEFAULT_ATTEMPTS_BEFORE_HINT;
}

/** Um desenho só é considerado desbloqueado se o seu desafio foi concluído. */
export function isDrawingUnlocked(snapshot: ProgressSnapshot, challengeId: string): boolean {
  return challengeProgress(snapshot, challengeId).isCompleted;
}

export type AnswerResult =
  | {
      kind: 'correct';
      snapshot: ProgressSnapshot;
      drawingId: string;
      /** false quando o desenho já estava desbloqueado antes da resposta. */
      newlyUnlocked: boolean;
      hintWasShown: boolean;
    }
  | {
      kind: 'incorrect';
      snapshot: ProgressSnapshot;
      wrongAttempts: number;
      hintVisible: boolean;
    }
  | {
      kind: 'already-completed';
      snapshot: ProgressSnapshot;
      drawingId: string;
    };

/**
 * Resolve uma resposta do desafio.
 * - Erro nunca desbloqueia desenho, apenas incrementa tentativas e habilita a dica.
 * - Acerto conclui o desafio e desbloqueia exatamente o desenho associado.
 * - Desafio já concluído não gera segunda recompensa.
 */
export function answerChallenge(
  snapshot: ProgressSnapshot,
  challenge: Challenge,
  optionId: string,
  now: string,
): AnswerResult {
  const previous = challengeProgress(snapshot, challenge.id);

  if (previous.isCompleted) {
    return { kind: 'already-completed', snapshot, drawingId: challenge.drawingId };
  }

  const correct = optionId === challenge.correctOptionId;

  if (correct) {
    const nextProgress: ChallengeProgress = {
      ...previous,
      isCompleted: true,
      completedAt: now,
    };
    const next: ProgressSnapshot = {
      ...snapshot,
      challenges: { ...snapshot.challenges, [challenge.id]: nextProgress },
      lastActivity: { kind: 'challenge', drawingId: challenge.drawingId, at: now },
    };
    return {
      kind: 'correct',
      snapshot: next,
      drawingId: challenge.drawingId,
      newlyUnlocked: true,
      hintWasShown: previous.hintShown,
    };
  }

  const wrongAttempts = previous.wrongAttempts + 1;
  const hintVisible = previous.hintShown || wrongAttempts >= attemptsBeforeHint(challenge);
  const next: ProgressSnapshot = {
    ...snapshot,
    challenges: {
      ...snapshot.challenges,
      [challenge.id]: {
        ...previous,
        wrongAttempts,
        hintShown: hintVisible,
      },
    },
  };

  return { kind: 'incorrect', snapshot: next, wrongAttempts, hintVisible };
}

export function noteActivity(
  snapshot: ProgressSnapshot,
  kind: ActivityKind,
  drawingId: string | null,
  now: string,
): ProgressSnapshot {
  return { ...snapshot, lastActivity: { kind, drawingId, at: now } };
}

export function createArtwork(drawingId: string, now: string): Artwork {
  return {
    drawingId,
    actions: [],
    undone: [],
    status: 'in_progress',
    updatedAt: now,
  };
}

export function artworkFor(snapshot: ProgressSnapshot, drawingId: string, now: string): Artwork {
  return snapshot.artworks[drawingId] ?? createArtwork(drawingId, now);
}

function capActions(actions: ArtAction[]): ArtAction[] {
  if (actions.length <= MAX_ART_ACTIONS) return actions;
  return actions.slice(actions.length - MAX_ART_ACTIONS);
}

/** Aplica uma ação de pintura e limpa a pilha de refazer. */
export function applyArtAction(artwork: Artwork, action: ArtAction, now: string): Artwork {
  return {
    ...artwork,
    actions: capActions([...artwork.actions, action]),
    undone: [],
    updatedAt: now,
  };
}

export function undoArt(artwork: Artwork, now: string): Artwork {
  if (artwork.actions.length === 0) return artwork;
  const actions = artwork.actions.slice(0, -1);
  const last = artwork.actions[artwork.actions.length - 1];
  return {
    ...artwork,
    actions,
    undone: [...artwork.undone, last],
    updatedAt: now,
  };
}

export function redoArt(artwork: Artwork, now: string): Artwork {
  if (artwork.undone.length === 0) return artwork;
  const undone = artwork.undone.slice(0, -1);
  const restored = artwork.undone[artwork.undone.length - 1];
  return {
    ...artwork,
    actions: capActions([...artwork.actions, restored]),
    undone,
    updatedAt: now,
  };
}

export function setArtworkStatus(artwork: Artwork, status: ArtworkStatus, now: string): Artwork {
  return { ...artwork, status, updatedAt: now };
}

/** Cores finais por região, aplicando preenchimentos e limpezas na ordem. */
export function deriveFills(artwork: Artwork): Record<string, string> {
  let fills: Record<string, string> = {};
  for (const action of artwork.actions) {
    if (action.kind === 'fill') {
      fills = { ...fills, [action.regionId]: action.color };
    } else if (action.kind === 'clear') {
      fills = {};
    }
  }
  return fills;
}

export function deriveStrokes(artwork: Artwork): Stroke[] {
  let strokes: Stroke[] = [];
  for (const action of artwork.actions) {
    if (action.kind === 'stroke') {
      strokes = [...strokes, action.stroke];
    } else if (action.kind === 'clear') {
      strokes = [];
    }
  }
  return strokes;
}

export function distance(a: StrokePoint, b: StrokePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function strokeTouchesPoint(stroke: Stroke, point: StrokePoint, radius: number): boolean {
  return stroke.points.some((candidate) => distance(candidate, point) <= radius);
}

/** Borracha: remove os traços tocados pelo dedo (mantém desenho-base intacto). */
export function eraseAt(artwork: Artwork, point: StrokePoint, radius: number, now: string): Artwork {
  const kept = artwork.actions.filter(
    (action) => !(action.kind === 'stroke' && strokeTouchesPoint(action.stroke, point, radius)),
  );
  if (kept.length === artwork.actions.length) return artwork;
  return { ...artwork, actions: kept, undone: [], updatedAt: now };
}

export interface ProgressStats {
  totalDrawings: number;
  unlockedDrawings: number;
  totalChallenges: number;
  completedChallenges: number;
  startedArtworks: number;
  finishedArtworks: number;
  wrongAttempts: number;
}

export function computeStats(
  snapshot: ProgressSnapshot,
  drawings: Drawing[],
  challenges: Challenge[],
): ProgressStats {
  const completed = challenges.filter((challenge) => challengeProgress(snapshot, challenge.id).isCompleted);
  const unlocked = drawings.filter((drawing) => isDrawingUnlocked(snapshot, drawing.challengeId));
  const artworks = Object.values(snapshot.artworks);
  return {
    totalDrawings: drawings.length,
    unlockedDrawings: unlocked.length,
    totalChallenges: challenges.length,
    completedChallenges: completed.length,
    startedArtworks: artworks.filter((artwork) => artwork.actions.length > 0).length,
    finishedArtworks: artworks.filter((artwork) => artwork.status === 'finished').length,
    wrongAttempts: challenges.reduce(
      (total, challenge) => total + challengeProgress(snapshot, challenge.id).wrongAttempts,
      0,
    ),
  };
}

export interface Medal {
  id: string;
  title: string;
  description: string;
  emoji: string;
  earned: boolean;
}

/** Medalhas são complementares: não alteram a regra 1 desafio → 1 desenho. */
export function computeMedals(
  snapshot: ProgressSnapshot,
  drawings: Drawing[],
  challenges: Challenge[],
): Medal[] {
  const stats = computeStats(snapshot, drawings, challenges);
  const mathChallenges = challenges.filter((challenge) => challenge.subject === 'math');
  const languageChallenges = challenges.filter((challenge) => challenge.subject === 'portuguese');
  const allCompleted = (list: Challenge[]) =>
    list.length > 0 && list.every((challenge) => challengeProgress(snapshot, challenge.id).isCompleted);

  return [
    {
      id: 'first-drawing',
      title: 'Primeira cor',
      description: 'Conquiste seu primeiro desenho.',
      emoji: '🎨',
      earned: stats.unlockedDrawings >= 1,
    },
    {
      id: 'three-drawings',
      title: 'Colecionador',
      description: 'Conquiste 3 desenhos.',
      emoji: '🌈',
      earned: stats.unlockedDrawings >= 3,
    },
    {
      id: 'all-drawings',
      title: 'Galeria completa',
      description: 'Conquiste todos os desenhos da coleção.',
      emoji: '🏆',
      earned: stats.unlockedDrawings >= stats.totalDrawings && stats.totalDrawings > 0,
    },
    {
      id: 'math-master',
      title: 'Amigo dos números',
      description: 'Conclua todos os desafios de Matemática.',
      emoji: '🔢',
      earned: allCompleted(mathChallenges),
    },
    {
      id: 'word-friend',
      title: 'Amigo das letras',
      description: 'Conclua todos os desafios de Português.',
      emoji: '🔤',
      earned: allCompleted(languageChallenges),
    },
    {
      id: 'first-artwork',
      title: 'Artista',
      description: 'Finalize sua primeira pintura.',
      emoji: '🖌️',
      earned: stats.finishedArtworks >= 1,
    },
    {
      id: 'three-artworks',
      title: 'Grande artista',
      description: 'Finalize 3 pinturas.',
      emoji: '🌟',
      earned: stats.finishedArtworks >= 3,
    },
  ];
}
