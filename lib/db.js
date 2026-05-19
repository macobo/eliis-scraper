import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const DB_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'eliis.db');

let _db = null;

export function db() {
  if (!_db) _db = new Database(DB_PATH);
  return _db;
}

export function drop() {
  db().exec(`
    DROP TABLE IF EXISTS media;
    DROP TABLE IF EXISTS entries;
    DROP TABLE IF EXISTS maps;
    DROP TABLE IF EXISTS config;
  `);
}

export function createSchema() {
  db().exec(`
    CREATE TABLE config (
      key  TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT    NOT NULL UNIQUE,
      content    TEXT    NOT NULL,
      kid_status TEXT    NOT NULL CHECK(kid_status IN ('present', 'missing')),
      kid_note   TEXT,
      updated_at TEXT
    );

    CREATE TABLE media (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id    INTEGER NOT NULL REFERENCES entries(id),
      date_index  INTEGER NOT NULL,
      title       TEXT    NOT NULL,
      remote_url           TEXT    NOT NULL,
      local_url            TEXT,
      p        TEXT,
      local_thumbnail_url  TEXT,
      UNIQUE(entry_id, date_index)
    );

    CREATE TABLE maps (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      title   TEXT NOT NULL,
      date    TEXT NOT NULL,
      content TEXT NOT NULL
    );
  `);
}

export function requiresDb() {
  try {
    const exists = db().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='entries'").get();
    if (!exists) throw new Error('Schema not initialized. Run: node eliis.js clear');
  } catch (e) {
    if (e.code === 'SQLITE_CANTOPEN') throw new Error('Database not found. Run: node eliis.js clear');
    throw e;
  }
}

export function getChildId() {
  requiresDb();
  const row = db().prepare("SELECT data FROM config WHERE key='child_id'").get();
  if (!row) throw new Error('No child ID found. Run: node eliis.js login');
  return JSON.parse(row.data);
}

export function upsertEntry({ date, content, kid_status, kid_note }) {
  const row = db().prepare(`
    INSERT INTO entries (date, content, kid_status, kid_note, updated_at)
    VALUES (?, ?, ?, ?, NULL)
    ON CONFLICT(date) DO UPDATE SET
      content    = excluded.content,
      kid_status = excluded.kid_status,
      kid_note   = excluded.kid_note,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *, updated_at IS NOT NULL AS updated
  `).get(date, content, kid_status, kid_note);
  return row;
}

export function upsertMedia(rows) {
  const stmt = db().prepare(`
    INSERT OR IGNORE INTO media (entry_id, date_index, title, remote_url, thumbnail_url)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertMany = db().transaction(rows => {
    for (const { entry_id, date_index, title, remote_url, thumbnail_url } of rows) {
      stmt.run(entry_id, date_index, title, remote_url, thumbnail_url);
    }
  });
  insertMany(rows);
}

export function saveChildId(childId) {
  db().prepare(`INSERT INTO config (key, data) VALUES ('child_id', ?) ON CONFLICT(key) DO UPDATE SET data=excluded.data`)
    .run(JSON.stringify(childId));
}
