import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { getDb, resetDatabase } from './db/index.js';
import { authRequired, requireRole } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import roomsRoutes from './routes/rooms.js';
import devicesRoutes from './routes/devices.js';
import boardsRoutes from './routes/boards.js';
import usersRoutes from './routes/users.js';
import * as boardService from './services/boardService.js';
import * as configExportService from './services/configExportService.js';

getDb();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Root: show API is running when visiting the base URL
app.get('/', (_, res) => {
  res.type('text/html').send(`
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>NILETRON API</title></head>
      <body style="font-family: system-ui; max-width: 600px; margin: 3rem auto; padding: 0 1rem;">
        <h1>NILETRON API</h1>
        <p><strong>Status:</strong> <span style="color: green;">Running</span></p>
        <p>Smart Home Automation – NILE University</p>
        <p><a href="/api/health">/api/health</a> – health check</p>
      </body>
    </html>
  `);
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/devices', devicesRoutes);

// Board routes that must be before app.use('/api/boards', ...) so they match first
app.get('/api/boards/:id/secret', authRequired, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).json({ error: 'Board not found' });
  }
  const secret = boardService.getBoardSecret(id);
  if (!secret) return res.status(404).json({ error: 'Board not found' });
  res.json(secret);
});

app.delete('/api/boards/:id', authRequired, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).json({ error: 'Board not found' });
  }
  const deleted = boardService.deleteBoard(id);
  if (!deleted) return res.status(404).json({ error: 'Board not found' });
  res.status(204).send();
});

app.post('/api/admin/reset-db', authRequired, requireRole('admin'), (req, res) => {
  try {
    resetDatabase();
    res.json({ ok: true, message: 'Database reset. Default admin: admin@niletron.local / admin123' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Reset failed' });
  }
});

app.get('/api/admin/export-config', authRequired, requireRole('admin'), (req, res) => {
  try {
    const data = configExportService.exportFullConfig();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Export failed' });
  }
});

app.post('/api/admin/import-config', authRequired, requireRole('admin'), (req, res) => {
  try {
    const result = configExportService.importFullConfig(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Import failed' });
  }
});

app.use('/api/boards', boardsRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, message: 'NILETRON API is running' }));

// 404 for any API path that didn't match (return JSON so frontend can show a clear message)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`NILETRON API running at http://localhost:${config.port}`);
});
