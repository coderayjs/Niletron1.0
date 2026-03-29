import { getDb } from '../db/index.js';

export function listRooms(userId, userRole) {
  const db = getDb();
  if (userRole === 'admin') {
    return db.prepare(`
      SELECT r.id, r.name, r.description, r.created_at,
             (SELECT COUNT(*) FROM devices d WHERE d.room_id = r.id) AS device_count
      FROM rooms r
      ORDER BY r.name
    `).all();
  }
  return db.prepare(`
    SELECT r.id, r.name, r.description, r.created_at,
           (SELECT COUNT(*) FROM devices d WHERE d.room_id = r.id) AS device_count
    FROM rooms r
    INNER JOIN user_room_access ura ON ura.room_id = r.id AND ura.user_id = ?
    ORDER BY r.name
  `).all(userId);
}

export function getRoom(id, userId, userRole) {
  const db = getDb();
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  if (!room) return null;
  if (userRole !== 'admin') {
    const access = db.prepare(
      'SELECT 1 FROM user_room_access WHERE user_id = ? AND room_id = ?'
    ).get(userId, id);
    if (!access) return null;
  }
  return room;
}

export function createRoom({ name, description }) {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO rooms (name, description) VALUES (?, ?)'
  ).run(name || 'New Room', description || null);
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid);
}

export function updateRoom(id, { name, description }) {
  const db = getDb();
  db.prepare(
    'UPDATE rooms SET name = COALESCE(?, name), description = ? WHERE id = ?'
  ).run(name, description ?? undefined, id);
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
}

export function deleteRoom(id) {
  const db = getDb();
  db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  return { deleted: id };
}

export function setUserRoomAccess(userId, roomIds) {
  const db = getDb();
  db.prepare('DELETE FROM user_room_access WHERE user_id = ?').run(userId);
  const stmt = db.prepare('INSERT INTO user_room_access (user_id, room_id) VALUES (?, ?)');
  for (const roomId of roomIds) {
    stmt.run(userId, roomId);
  }
  return { userId, roomIds };
}

export function getUserRoomAccess(userId) {
  const db = getDb();
  return db.prepare(
    'SELECT room_id FROM user_room_access WHERE user_id = ?'
  ).all(userId).map(r => r.room_id);
}
