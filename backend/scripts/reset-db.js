#!/usr/bin/env node
/**
 * Deletes the SQLite DB file so the backend creates a fresh one on next start.
 * Run from backend dir: node scripts/reset-db.js
 * Then restart the backend (npm run dev).
 */
import { unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../data/niletron.db');

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log('Deleted backend/data/niletron.db — restart the backend for a fresh DB.');
} else {
  console.log('No database file at backend/data/niletron.db — already clear.');
}
