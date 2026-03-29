import { Router } from 'express';
import { authRequired, requireRole, ROLES } from '../middleware/auth.js';
import * as authService from '../services/authService.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name required' });
    }
    const result = authService.register({ email, password, name, role });
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const result = authService.login(email, password);
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

export default router;
