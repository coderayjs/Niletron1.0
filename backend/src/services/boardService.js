import { getDb } from '../db/index.js';
import { randomBytes } from 'crypto';

export function listBoards() {
  const db = getDb();
  return db.prepare(`
    SELECT b.id, b.board_id, b.name, b.last_seen_at, b.created_at,
           (SELECT COUNT(*) FROM devices d WHERE d.board_id = b.id) AS device_count
    FROM boards b
    ORDER BY b.name
  `).all();
}

export function getBoardByBoardId(boardId) {
  const db = getDb();
  return db.prepare('SELECT * FROM boards WHERE board_id = ?').get(boardId);
}

export function getBoardSecret(boardId) {
  const db = getDb();
  const row = db.prepare('SELECT board_id, secret_key FROM boards WHERE id = ?').get(boardId);
  return row;
}

export function createBoard({ board_id, name }) {
  const db = getDb();
  const secret_key = randomBytes(24).toString('hex');
  db.prepare(
    'INSERT INTO boards (board_id, name, secret_key) VALUES (?, ?, ?)'
  ).run(board_id, name || board_id, secret_key);
  return db.prepare('SELECT id, board_id, name, secret_key, created_at FROM boards WHERE board_id = ?').get(board_id);
}

export function deleteBoard(id) {
  const db = getDb();
  const board = db.prepare('SELECT id FROM boards WHERE id = ?').get(id);
  if (!board) return false;
  db.prepare('DELETE FROM device_states WHERE device_id IN (SELECT id FROM devices WHERE board_id = ?)').run(id);
  db.prepare('DELETE FROM devices WHERE board_id = ?').run(id);
  db.prepare('DELETE FROM boards WHERE id = ?').run(id);
  return true;
}

export function updateBoardLastSeen(boardId) {
  const db = getDb();
  db.prepare('UPDATE boards SET last_seen_at = datetime(\'now\') WHERE board_id = ?').run(boardId);
}

export function getBoardStateForESP32(boardId, secretKey) {
  const db = getDb();
  const board = db.prepare('SELECT id FROM boards WHERE board_id = ? AND secret_key = ?').get(boardId, secretKey);
  if (!board) return null;
  const devices = db.prepare(`
    SELECT d.pin, d.type, COALESCE(ds.value, 0) AS value
    FROM devices d
    LEFT JOIN device_states ds ON ds.device_id = d.id
    WHERE d.board_id = ?
  `).all(board.id);
  updateBoardLastSeen(boardId);
  return devices.reduce((acc, d) => {
    acc[d.pin] = { type: d.type, value: d.value };
    return acc;
  }, {});
}
