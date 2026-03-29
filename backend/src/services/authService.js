import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/index.js';
import { config } from '../config/index.js';
import { ROLES } from '../middleware/auth.js';

export function register({ email, password, name, role = ROLES.user }) {
  const db = getDb();
  const allowed = [ROLES.user, ROLES.kids];
  if (!allowed.includes(role)) role = ROLES.user;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('Email already registered');
  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).run(email, password_hash, name, role);
  const user = db.prepare(
    'SELECT id, email, name, role, created_at FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);
  return { user, token: createToken(user.id) };
}

export function login(email, password) {
  const db = getDb();
  const row = db.prepare(
    'SELECT id, email, name, role, password_hash FROM users WHERE email = ?'
  ).get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw new Error('Invalid email or password');
  }
  const user = { id: row.id, email: row.email, name: row.name, role: row.role };
  return { user, token: createToken(user.id) };
}

function createToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}
