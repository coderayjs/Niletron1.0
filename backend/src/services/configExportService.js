import { getDb } from '../db/index.js';

const VERSION = 1;

export function exportFullConfig() {
  const db = getDb();
  const rooms = db.prepare('SELECT name, description FROM rooms ORDER BY id').all();
  const boards = db.prepare('SELECT board_id, name, secret_key FROM boards ORDER BY id').all();
  const devices = db.prepare(`
    SELECT d.name, d.pin, d.type, r.name AS room_name, b.board_id AS board_key,
           COALESCE(ds.value, 0) AS value
    FROM devices d
    JOIN rooms r ON r.id = d.room_id
    JOIN boards b ON b.id = d.board_id
    LEFT JOIN device_states ds ON ds.device_id = d.id
    ORDER BY d.id
  `).all();
  const users = db.prepare('SELECT email, name, role, password_hash FROM users ORDER BY id').all();
  const accessRows = db.prepare(`
    SELECT u.email, r.name AS room_name
    FROM user_room_access ura
    JOIN users u ON u.id = ura.user_id
    JOIN rooms r ON r.id = ura.room_id
    ORDER BY u.email, r.name
  `).all();
  const byEmail = {};
  for (const row of accessRows) {
    if (!byEmail[row.email]) byEmail[row.email] = [];
    byEmail[row.email].push(row.room_name);
  }
  const userRoomAccess = Object.entries(byEmail).map(([email, roomNames]) => ({
    email,
    roomNames,
  }));

  return {
    version: VERSION,
    exportedAt: new Date().toISOString(),
    app: 'NILETRON',
    rooms,
    boards,
    devices: devices.map((d) => ({
      name: d.name,
      pin: d.pin,
      type: d.type,
      roomName: d.room_name,
      boardId: d.board_key,
      value: d.value,
    })),
    users,
    userRoomAccess,
  };
}

export function importFullConfig(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup: expected JSON object');
  }
  if (data.version !== VERSION) {
    throw new Error(`Unsupported backup version: ${data.version} (expected ${VERSION})`);
  }

  const db = getDb();
  const run = db.transaction(() => {
    db.prepare('DELETE FROM user_room_access').run();
    db.prepare('DELETE FROM devices').run();
    db.prepare('DELETE FROM boards').run();
    db.prepare('DELETE FROM rooms').run();

    const roomNameToId = {};
    for (const r of data.rooms || []) {
      if (!r.name) continue;
      const result = db
        .prepare('INSERT INTO rooms (name, description) VALUES (?, ?)')
        .run(r.name, r.description ?? null);
      roomNameToId[r.name] = Number(result.lastInsertRowid);
    }

    const boardKeyToNumericId = {};
    for (const b of data.boards || []) {
      if (!b.board_id || !b.secret_key) continue;
      db.prepare('INSERT INTO boards (board_id, name, secret_key) VALUES (?, ?, ?)').run(
        b.board_id,
        b.name || b.board_id,
        b.secret_key
      );
      const row = db.prepare('SELECT id FROM boards WHERE board_id = ?').get(b.board_id);
      boardKeyToNumericId[b.board_id] = row.id;
    }

    for (const d of data.devices || []) {
      const roomId = roomNameToId[d.roomName];
      const boardNumericId = boardKeyToNumericId[d.boardId];
      if (!roomId || !boardNumericId) continue;
      if (!d.name || d.pin == null || !d.type) continue;
      const result = db
        .prepare(
          'INSERT INTO devices (room_id, board_id, pin, type, name) VALUES (?, ?, ?, ?, ?)'
        )
        .run(roomId, boardNumericId, d.pin, d.type, d.name);
      const devId = Number(result.lastInsertRowid);
      const value = Math.max(0, Math.min(255, Number(d.value) || 0));
      db.prepare('INSERT OR REPLACE INTO device_states (device_id, value) VALUES (?, ?)').run(
        devId,
        value
      );
    }

    if (Array.isArray(data.users) && data.users.length > 0) {
      for (const u of data.users) {
        if (!u.email || !u.password_hash || !u.name || !u.role) continue;
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
        if (existing) {
          db.prepare('UPDATE users SET password_hash = ?, name = ?, role = ? WHERE email = ?').run(
            u.password_hash,
            u.name,
            u.role,
            u.email
          );
        } else {
          db.prepare(
            'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
          ).run(u.email, u.password_hash, u.name, u.role);
        }
      }
    }

    for (const ar of data.userRoomAccess || []) {
      if (!ar.email) continue;
      const user = db.prepare('SELECT id FROM users WHERE email = ?').get(ar.email);
      if (!user) continue;
      const stmt = db.prepare(
        'INSERT OR IGNORE INTO user_room_access (user_id, room_id) VALUES (?, ?)'
      );
      for (const roomName of ar.roomNames || []) {
        const roomId = roomNameToId[roomName];
        if (roomId) stmt.run(user.id, roomId);
      }
    }
  });

  run();
  return { ok: true, message: 'Configuration imported. Log in again if your session was affected.' };
}
