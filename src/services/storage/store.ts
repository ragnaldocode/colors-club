import * as SQLite from 'expo-sqlite';

import type { Artwork, ChallengeProgress, ProgressSnapshot } from '../../domain/types';
import type { ProgressStore } from './types';

const DATABASE_NAME = 'colors-club.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS challenge_progress (
          challenge_id TEXT PRIMARY KEY NOT NULL,
          wrong_attempts INTEGER NOT NULL DEFAULT 0,
          is_completed INTEGER NOT NULL DEFAULT 0,
          completed_at TEXT,
          hint_shown INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS artworks (
          drawing_id TEXT PRIMARY KEY NOT NULL,
          actions TEXT NOT NULL,
          undone TEXT NOT NULL,
          status TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return databasePromise;
}

interface MetaRow {
  value: string;
}

interface ChallengeRow {
  challenge_id: string;
  wrong_attempts: number;
  is_completed: number;
  completed_at: string | null;
  hint_shown: number;
}

interface ArtworkRow {
  drawing_id: string;
  actions: string;
  undone: string;
  status: string;
  updated_at: string;
}

async function readMeta(db: SQLite.SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<MetaRow>('SELECT value FROM meta WHERE key = ?', key);
  return row?.value ?? null;
}

async function writeMeta(db: SQLite.SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

function parseArtwork(row: ArtworkRow): Artwork {
  return {
    drawingId: row.drawing_id,
    actions: JSON.parse(row.actions) as Artwork['actions'],
    undone: JSON.parse(row.undone) as Artwork['undone'],
    status: row.status === 'finished' ? 'finished' : 'in_progress',
    updatedAt: row.updated_at,
  };
}

export const progressStore: ProgressStore = {
  async load(): Promise<ProgressSnapshot | null> {
    const db = await database();
    const version = await readMeta(db, 'schema_version');
    if (!version) return null;

    const createdAt = (await readMeta(db, 'created_at')) ?? new Date().toISOString();
    const lastActivityRaw = await readMeta(db, 'last_activity');
    const challengeRows = await db.getAllAsync<ChallengeRow>('SELECT * FROM challenge_progress');
    const artworkRows = await db.getAllAsync<ArtworkRow>('SELECT * FROM artworks');

    const challengeMap: Record<string, ChallengeProgress> = {};
    for (const row of challengeRows) {
      challengeMap[row.challenge_id] = {
        challengeId: row.challenge_id,
        wrongAttempts: row.wrong_attempts,
        isCompleted: row.is_completed === 1,
        completedAt: row.completed_at,
        hintShown: row.hint_shown === 1,
      };
    }

    const artworkMap: Record<string, Artwork> = {};
    for (const row of artworkRows) {
      artworkMap[row.drawing_id] = parseArtwork(row);
    }

    return {
      version: Number(version),
      createdAt,
      challenges: challengeMap,
      artworks: artworkMap,
      lastActivity: lastActivityRaw ? (JSON.parse(lastActivityRaw) as ProgressSnapshot['lastActivity']) : null,
    };
  },

  async save(snapshot: ProgressSnapshot): Promise<void> {
    const db = await database();
    await db.withTransactionAsync(async () => {
      await writeMeta(db, 'schema_version', String(snapshot.version));
      await writeMeta(db, 'created_at', snapshot.createdAt);
      await writeMeta(db, 'last_activity', snapshot.lastActivity ? JSON.stringify(snapshot.lastActivity) : '');

      await db.runAsync('DELETE FROM challenge_progress');
      for (const progress of Object.values(snapshot.challenges)) {
        await db.runAsync(
          `INSERT INTO challenge_progress (challenge_id, wrong_attempts, is_completed, completed_at, hint_shown)
           VALUES (?, ?, ?, ?, ?)`,
          progress.challengeId,
          progress.wrongAttempts,
          progress.isCompleted ? 1 : 0,
          progress.completedAt,
          progress.hintShown ? 1 : 0,
        );
      }

      await db.runAsync('DELETE FROM artworks');
      for (const artwork of Object.values(snapshot.artworks)) {
        await db.runAsync(
          `INSERT INTO artworks (drawing_id, actions, undone, status, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          artwork.drawingId,
          JSON.stringify(artwork.actions),
          JSON.stringify(artwork.undone),
          artwork.status,
          artwork.updatedAt,
        );
      }
    });
  },

  async clear(): Promise<void> {
    const db = await database();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM meta');
      await db.runAsync('DELETE FROM challenge_progress');
      await db.runAsync('DELETE FROM artworks');
    });
  },
};
