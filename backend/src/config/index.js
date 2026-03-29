import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const defaultJwt = 'niletron-dev-secret-change-in-production';
const jwtSecret = process.env.JWT_SECRET || defaultJwt;

if (isProd && jwtSecret === defaultJwt) {
  console.warn(
    '[NILETRON] Set JWT_SECRET in production (Render dashboard → Environment).'
  );
}

export const config = {
  // Render and other hosts set PORT; local dev defaults to 4009
  port: Number(process.env.PORT) || 4009,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || './data/niletron.db',
};
