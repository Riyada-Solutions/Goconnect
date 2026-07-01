import * as SQLite from 'expo-sqlite'
import { Platform } from 'react-native'

// SQLite is unavailable on web — all callers guard with Platform.OS checks.
export let db: SQLite.SQLiteDatabase | null = null
if (Platform.OS !== 'web') {
  try {
    db = SQLite.openDatabaseSync('goconnect.db')
  } catch (e) {
    console.error('[db] Failed to open SQLite database:', e)
  }
}

export function initDb(): void {
  if (!db) return
  db.execSync(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      method     TEXT    NOT NULL,
      url        TEXT    NOT NULL,
      body       TEXT    NOT NULL,
      visit_id   TEXT,
      retries    INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );
  `)
}
