import type { ProgressSnapshot } from '../../domain/types';
import type { ProgressStore } from './types';

/**
 * Versão web (usada apenas para desenvolvimento/verificação no navegador).
 * O app publicado é mobile; aqui o armazenamento é o localStorage do navegador.
 */
const STORAGE_KEY = 'colors-club:progress:v1';

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export const progressStore: ProgressStore = {
  async load(): Promise<ProgressSnapshot | null> {
    const store = storage();
    if (!store) return null;
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ProgressSnapshot;
    } catch {
      return null;
    }
  },

  async save(snapshot: ProgressSnapshot): Promise<void> {
    const store = storage();
    if (!store) return;
    store.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  },

  async clear(): Promise<void> {
    storage()?.removeItem(STORAGE_KEY);
  },
};
