import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);  // server/db/

// Store DB at project root /data/codelensai.db
const DB_PATH = process.env.DB_PATH || join(__dirname, "../../data/codelensai.db");

export let db;

export async function initDb() {
  mkdirSync(dirname(DB_PATH), { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      verification_expires INTEGER,
      reset_token TEXT,
      reset_expires INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      filename TEXT DEFAULT '',
      score REAL NOT NULL,
      summary TEXT NOT NULL,
      issues TEXT NOT NULL DEFAULT '[]',
      performance TEXT NOT NULL DEFAULT '[]',
      best_practices TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
  `);

  // Clean expired sessions every hour
  setInterval(() => {
    try { db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now()); } catch {}
  }, 60 * 60 * 1000);

  console.log(`✅ Database ready → ${DB_PATH}`);
  return db;
}
