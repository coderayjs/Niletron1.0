import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function initDb() {
  const dbDir = join(__dirname, '../../data');
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
  const db = new Database(config.dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'kids')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      secret_key TEXT NOT NULL,
      last_seen_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      board_id INTEGER NOT NULL REFERENCES boards(id),
      pin INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('light', 'fan')),
      name TEXT NOT NULL,
      UNIQUE(board_id, pin)
    );

    CREATE TABLE IF NOT EXISTS device_states (
      device_id INTEGER PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
      value INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_room_access (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, room_id)
    );

    CREATE INDEX IF NOT EXISTS idx_devices_room ON devices(room_id);
    CREATE INDEX IF NOT EXISTS idx_devices_board ON devices(board_id);
  `);

  const adminExists = db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get();
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')"
    ).run('admin@niletron.local', hash, 'Administrator');
  }

  return db;
}
