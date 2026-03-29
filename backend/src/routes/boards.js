import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import * as boardService from '../services/boardService.js';

const router = Router();

router.get('/state', (req, res) => {
  const { board_id, secret_key } = req.query;
  if (!board_id || !secret_key) {
    return res.status(400).json({ error: 'board_id and secret_key required' });
  }
  const state = boardService.getBoardStateForESP32(board_id, secret_key);
  if (!state) return res.status(401).json({ error: 'Invalid board or secret' });
  res.json(state);
});

router.use(authRequired);
router.use(requireRole('admin'));

// Specific route first (so /1/secret is not confused with something else)
router.get('/:id/secret', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).json({ error: 'Board not found', path: req.path });
  }
  const secret = boardService.getBoardSecret(id);
  if (!secret) return res.status(404).json({ error: 'Board not found' });
  res.json(secret);
});

router.get('/', (req, res) => {
  const boards = boardService.listBoards();
  res.json({ boards });
});

router.post('/', (req, res) => {
  try {
    const { board_id, name } = req.body;
    if (!board_id) return res.status(400).json({ error: 'board_id required' });
    const board = boardService.createBoard({ board_id, name });
    res.status(201).json(board);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).json({ error: 'Board not found' });
  }
  const deleted = boardService.deleteBoard(id);
  if (!deleted) return res.status(404).json({ error: 'Board not found' });
  res.status(204).send();
});

export default router;
