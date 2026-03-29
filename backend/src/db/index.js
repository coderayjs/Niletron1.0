import bcrypt from 'bcryptjs';
import { initDb } from './schema.js';

let db = null;

export function getDb() {
  if (!db) db = initDb();
  return db;
}

export function resetDatabase() {
  const database = getDb();
  database.exec(`
    DELETE FROM device_states;
    DELETE FROM user_room_access;
    DELETE FROM devices;
    DELETE FROM rooms;
    DELETE FROM boards;
    DELETE FROM users;
  `);
  const hash = bcrypt.hashSync('admin123', 10);
  database.prepare(
    "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')"
  ).run('admin@niletron.local', hash, 'Administrator');
}
