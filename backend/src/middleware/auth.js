import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { getDb } from '../db/index.js';

export const ROLES = Object.freeze({ admin: 'admin', user: 'user', kids: 'kids' });

export function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const db = getDb();
    const user = db.prepare(
      'SELECT id, email, name, role FROM users WHERE id = ?'
    ).get(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (allowedRoles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const db = getDb();
    const user = db.prepare(
      'SELECT id, email, name, role FROM users WHERE id = ?'
    ).get(decoded.userId);
    if (user) req.user = user;
  } catch (_) {}
  next();
}
