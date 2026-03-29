import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import * as roomService from '../services/roomService.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const rooms = roomService.listRooms(req.user.id, req.user.role);
  res.json({ rooms });
});

router.get('/:id', (req, res) => {
  const room = roomService.getRoom(Number(req.params.id), req.user.id, req.user.role);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

router.post('/', requireRole('admin'), (req, res) => {
  try {
    const room = roomService.createRoom(req.body);
    res.status(201).json(room);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/:id', requireRole('admin'), (req, res) => {
  const room = roomService.updateRoom(Number(req.params.id), req.body);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  roomService.deleteRoom(Number(req.params.id));
  res.status(204).send();
});

export default router;
