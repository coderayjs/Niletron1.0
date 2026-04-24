-- Export of backend/data/niletron.db (text you can open in the editor).
-- Regenerate: sqlite3 backend/data/niletron.db ".schema" > backend/sql/schema.sql

CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'kids')),
      created_at TEXT DEFAULT (datetime('now'))
    );
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
CREATE TABLE boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      secret_key TEXT NOT NULL,
      last_seen_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
CREATE TABLE devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      board_id INTEGER NOT NULL REFERENCES boards(id),
      pin INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('light', 'fan')),
      name TEXT NOT NULL,
      UNIQUE(board_id, pin)
    );
CREATE TABLE device_states (
      device_id INTEGER PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
      value INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );
CREATE TABLE user_room_access (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, room_id)
    );
CREATE INDEX idx_devices_room ON devices(room_id);
CREATE INDEX idx_devices_board ON devices(board_id);
