import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import * as deviceService from '../services/deviceService.js';

const router = Router();
router.use(authRequired);

router.get('/room/:roomId', (req, res) => {
  const devices = deviceService.listDevicesByRoom(
    Number(req.params.roomId),
    req.user.id,
    req.user.role
  );
  res.json({ devices });
});

router.get('/:id', (req, res) => {
  const device = deviceService.getDevice(
    Number(req.params.id),
    req.user.id,
    req.user.role
  );
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

router.post('/', requireRole('admin'), (req, res) => {
  try {
    const device = deviceService.createDevice(req.body);
    res.status(201).json(device);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/:id', requireRole('admin'), (req, res) => {
  try {
    const device = deviceService.updateDevice(Number(req.params.id), req.body);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  deviceService.deleteDevice(Number(req.params.id));
  res.status(204).send();
});

router.post('/:id/state', (req, res) => {
  const value = req.body.value ?? req.body;
  const kidsOnlyLights = req.user.role === 'kids';
  const state = deviceService.setDeviceState(
    Number(req.params.id),
    value,
    req.user.id,
    req.user.role,
    kidsOnlyLights
  );
  if (!state) return res.status(403).json({ error: 'Cannot control this device' });
  res.json(state);
});

export default router;
