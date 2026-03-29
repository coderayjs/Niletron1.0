import { getDb } from '../db/index.js';

export function listDevicesByRoom(roomId, userId, userRole) {
  const db = getDb();
  if (userRole !== 'admin') {
    const access = db.prepare(
      'SELECT 1 FROM user_room_access WHERE user_id = ? AND room_id = ?'
    ).get(userId, roomId);
    if (!access) return [];
  }
  const devices = db.prepare(`
    SELECT d.id, d.room_id, d.board_id, d.pin, d.type, d.name,
           ds.value, ds.updated_at AS state_updated_at
    FROM devices d
    LEFT JOIN device_states ds ON ds.device_id = d.id
    WHERE d.room_id = ?
    ORDER BY d.name
  `).all(roomId);
  return devices.map(d => ({
    ...d,
    value: d.value ?? 0,
  }));
}

export function getDevice(id, userId, userRole) {
  const db = getDb();
  const device = db.prepare(`
    SELECT d.*, ds.value, ds.updated_at AS state_updated_at
    FROM devices d
    LEFT JOIN device_states ds ON ds.device_id = d.id
    WHERE d.id = ?
  `).get(id);
  if (!device) return null;
  const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(device.room_id);
  if (userRole !== 'admin') {
    const access = db.prepare(
      'SELECT 1 FROM user_room_access WHERE user_id = ? AND room_id = ?'
    ).get(userId, device.room_id);
    if (!access) return null;
  }
  return { ...device, value: device.value ?? 0 };
}

function isPinAlreadyUsedError(e) {
  const msg = (e && e.message) ? String(e.message) : '';
  return msg.includes('UNIQUE') && (msg.includes('devices') || msg.includes('board_id') || msg.includes('pin'));
}

export function createDevice({ room_id, board_id, pin, type, name }) {
  const db = getDb();
  try {
    const result = db.prepare(
      'INSERT INTO devices (room_id, board_id, pin, type, name) VALUES (?, ?, ?, ?, ?)'
    ).run(room_id, board_id, pin, type, name);
    const id = result.lastInsertRowid;
    db.prepare('INSERT OR REPLACE INTO device_states (device_id, value) VALUES (?, 0)').run(id);
    return getDeviceById(id);
  } catch (e) {
    if (isPinAlreadyUsedError(e)) throw new Error('This pin is already in use on this board. Pick a different pin.');
    throw e;
  }
}

export function updateDevice(id, { room_id, board_id, pin, type, name }) {
  const db = getDb();
  try {
    db.prepare(
      'UPDATE devices SET room_id=?, board_id=?, pin=?, type=?, name=? WHERE id=?'
    ).run(room_id ?? undefined, board_id ?? undefined, pin ?? undefined, type ?? undefined, name ?? undefined, id);
    return getDeviceById(id);
  } catch (e) {
    if (isPinAlreadyUsedError(e)) throw new Error('This pin is already in use on this board. Pick a different pin.');
    throw e;
  }
}

export function deleteDevice(id) {
  const db = getDb();
  db.prepare('DELETE FROM devices WHERE id = ?').run(id);
  return { deleted: id };
}

export function setDeviceState(deviceId, value, userId, userRole, canControlLightsOnly = false) {
  const db = getDb();
  const device = db.prepare('SELECT id, type, room_id FROM devices WHERE id = ?').get(deviceId);
  if (!device) return null;
  if (userRole !== 'admin') {
    const access = db.prepare(
      'SELECT 1 FROM user_room_access WHERE user_id = ? AND room_id = ?'
    ).get(userId, device.room_id);
    if (!access) return null;
  }
  if (canControlLightsOnly && device.type !== 'light') return null;
  const v = Math.min(255, Math.max(0, Number(value)));
  db.prepare(
    'INSERT OR REPLACE INTO device_states (device_id, value, updated_at) VALUES (?, ?, datetime(\'now\'))'
  ).run(deviceId, v);
  return db.prepare('SELECT * FROM device_states WHERE device_id = ?').get(deviceId);
}

function getDeviceById(id) {
  const db = getDb();
  const d = db.prepare(`
    SELECT d.*, ds.value FROM devices d
    LEFT JOIN device_states ds ON ds.device_id = d.id WHERE d.id = ?
  `).get(id);
  return d ? { ...d, value: d.value ?? 0 } : null;
}
