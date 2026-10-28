import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import { dbFile } from './config';
import * as schema from './schema';

const sqlite = new Database(dbFile);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export type Db = typeof db;

/** Aplica as migrations geradas pelo drizzle-kit (pasta backend/drizzle). */
export function runMigrations(): void {
  const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));
  migrate(db, { migrationsFolder });
}
