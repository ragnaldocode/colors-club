import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { catalog } from '@/data';
import {
  answerChallenge,
  applyArtAction,
  artworkFor,
  computeStats,
  createProgress,
  noteActivity,
  setArtworkStatus,
} from '@/domain/progress';
import type { AnswerResult, ProgressStats } from '@/domain/progress';
import type { ActivityKind, ArtAction, Artwork, ArtworkStatus, ProgressSnapshot } from '@/domain/types';
import { progressStore } from '@/services/storage';

type LoadStatus = 'loading' | 'ready' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface ProgressContextValue {
  status: LoadStatus;
  error: string | null;
  snapshot: ProgressSnapshot;
  stats: ProgressStats;
  saveState: SaveState;
  answer: (challengeId: string, optionId: string) => AnswerResult | null;
  fillRegion: (drawingId: string, regionId: string, color: string) => void;
  applyAction: (drawingId: string, action: ArtAction) => void;
  replaceArtwork: (drawingId: string, update: (artwork: Artwork, now: string) => Artwork) => void;
  finishArtwork: (drawingId: string, status: ArtworkStatus) => void;
  recordActivity: (kind: ActivityKind, drawingId?: string | null) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

const SAVE_DEBOUNCE_MS = 450;

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(() => createProgress(new Date().toISOString()));
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const snapshotRef = useRef(snapshot);
  const pendingRef = useRef<ProgressSnapshot | null>(null);
  const savingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  const flush = useCallback(async function flushNow() {
    if (savingRef.current) return;
    const next = pendingRef.current;
    if (!next) return;
    pendingRef.current = null;
    savingRef.current = true;
    try {
      await progressStore.save(next);
      if (!pendingRef.current) setSaveState('saved');
    } catch (cause) {
      setSaveState('error');
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        void flushNow();
      }
    }
  }, []);

  const commit = useCallback(
    (next: ProgressSnapshot) => {
      snapshotRef.current = next;
      setSnapshot(next);
      if (!hydratedRef.current) return;
      pendingRef.current = next;
      setSaveState('saving');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void flush();
      }, SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await progressStore.load();
        if (cancelled) return;
        if (loaded) {
          snapshotRef.current = loaded;
          setSnapshot(loaded);
        } else {
          const fresh = createProgress(new Date().toISOString());
          snapshotRef.current = fresh;
          setSnapshot(fresh);
          await progressStore.save(fresh);
        }
        hydratedRef.current = true;
        setStatus('ready');
      } catch (cause) {
        if (cancelled) return;
        hydratedRef.current = true;
        setStatus('error');
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        void flush();
      }
    });
    return () => {
      subscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
      void flush();
    };
  }, [flush]);

  const answer = useCallback(
    (challengeId: string, optionId: string): AnswerResult | null => {
      const challenge = catalog.byChallengeId.get(challengeId);
      if (!challenge) return null;
      const result = answerChallenge(snapshotRef.current, challenge, optionId, new Date().toISOString());
      if (result.snapshot !== snapshotRef.current) commit(result.snapshot);
      return result;
    },
    [commit],
  );

  const applyAction = useCallback(
    (drawingId: string, action: ArtAction) => {
      const now = new Date().toISOString();
      const current = artworkFor(snapshotRef.current, drawingId, now);
      const updated = applyArtAction(current, action, now);
      commit({
        ...snapshotRef.current,
        artworks: { ...snapshotRef.current.artworks, [drawingId]: updated },
      });
    },
    [commit],
  );

  const fillRegion = useCallback(
    (drawingId: string, regionId: string, color: string) => {
      applyAction(drawingId, { kind: 'fill', regionId, color });
    },
    [applyAction],
  );

  const replaceArtwork = useCallback(
    (drawingId: string, update: (artwork: Artwork, now: string) => Artwork) => {
      const now = new Date().toISOString();
      const current = artworkFor(snapshotRef.current, drawingId, now);
      const updated = update(current, now);
      if (updated === current) return;
      commit({
        ...snapshotRef.current,
        artworks: { ...snapshotRef.current.artworks, [drawingId]: updated },
      });
    },
    [commit],
  );

  const finishArtwork = useCallback(
    (drawingId: string, nextStatus: ArtworkStatus) => {
      replaceArtwork(drawingId, (artwork, now) => setArtworkStatus(artwork, nextStatus, now));
    },
    [replaceArtwork],
  );

  const recordActivity = useCallback(
    (kind: ActivityKind, drawingId: string | null = null) => {
      commit(noteActivity(snapshotRef.current, kind, drawingId, new Date().toISOString()));
    },
    [commit],
  );

  const stats = useMemo(
    () => computeStats(snapshot, catalog.drawings, catalog.challenges),
    [snapshot],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      status,
      error,
      snapshot,
      stats,
      saveState,
      answer,
      fillRegion,
      applyAction,
      replaceArtwork,
      finishArtwork,
      recordActivity,
    }),
    [
      status,
      error,
      snapshot,
      stats,
      saveState,
      answer,
      fillRegion,
      applyAction,
      replaceArtwork,
      finishArtwork,
      recordActivity,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress deve ser usado dentro de ProgressProvider');
  return context;
}
