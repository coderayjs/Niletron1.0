import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import * as userService from '../services/userService.js';
import * as roomService from '../services/roomService.js';

const router = Router();
router.use(authRequired);
router.use(requireRole('admin'));

router.get('/', (req, res) => {
  const users = userService.listUsers();
  res.json({ users });
});

router.post('/', (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name required' });
    }
    const user = userService.createUser({ email, password, name, role });
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:id/rooms', (req, res) => {
  const roomIds = roomService.getUserRoomAccess(Number(req.params.id));
  res.json({ roomIds });
});

router.put('/:id/rooms', (req, res) => {
  const roomIds = Array.isArray(req.body.roomIds) ? req.body.roomIds : [];
  roomService.setUserRoomAccess(Number(req.params.id), roomIds);
  res.json({ roomIds });
});

export default router;
