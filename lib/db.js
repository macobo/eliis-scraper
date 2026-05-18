import Database from 'better-sqlite3';

const DB_PATH = './eliis.db';

export function openDb() {
  return new Database(DB_PATH);
}

export function requiresDb() {
  try {
    const db = openDb();
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='entries'").get();
    if (!exists) throw new Error('Schema not initialized. Run: node eliis.js clear');
    return db;
  } catch (e) {
    if (e.code === 'SQLITE_CANTOPEN') throw new Error('Database not found. Run: node eliis.js clear');
    throw e;
  }
}

export function requiresChild(db) {
  const row = db.prepare('SELECT child_id FROM child LIMIT 1').get();
  if (!row) throw new Error('No child ID found. Run: node eliis.js login');
  return row.child_id;
}
