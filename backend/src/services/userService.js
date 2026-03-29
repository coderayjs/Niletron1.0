import bcrypt from 'bcryptjs';
import { getDb } from '../db/index.js';
import { ROLES } from '../middleware/auth.js';

export function listUsers() {
  const db = getDb();
  return db.prepare(
    'SELECT id, email, name, role, created_at FROM users ORDER BY name'
  ).all();
}

export function createUser({ email, password, name, role = ROLES.user }) {
  const db = getDb();
  const allowed = [ROLES.user, ROLES.kids];
  const r = allowed.includes(role) ? role : ROLES.user;
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).run(email, hash, name, r);
  return db.prepare(
    'SELECT id, email, name, role, created_at FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);
}
