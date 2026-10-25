import type { ProgressSnapshot } from '../../domain/types';

/** Contrato de persistência local (SQLite no dispositivo, localStorage na web). */
export interface ProgressStore {
  load(): Promise<ProgressSnapshot | null>;
  save(snapshot: ProgressSnapshot): Promise<void>;
  clear(): Promise<void>;
}

export function isProgressSnapshot(value: unknown): value is ProgressSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProgressSnapshot>;
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.createdAt === 'string' &&
    !!candidate.challenges &&
    typeof candidate.challenges === 'object' &&
    !!candidate.artworks &&
    typeof candidate.artworks === 'object'
  );
}
