# NILETRON – Smart Home Automation

Final year project (Postgraduate Diploma, Software Engineering, NILE University, Nigeria): design and development of a **Smart Home Automation** web application with ESP32 hardware proof of concept.

**Repository:** [github.com/coderayjs/Niletron1.0](https://github.com/coderayjs/Niletron1.0)

## Features

- **Progressive Web App (PWA)** – Installable on phones and desktops.
- **Roles**: Admin, User, Kids (kids can control lights only).
- **Rooms** – Add and manage rooms; assign users to rooms.
- **Devices** – Lights (on/off) and DC fan (speed 0–100%) per room.
- **ESP32** – Hardware controller that polls the API and drives GPIO (lights + fan PWM).

## Stack

| Part      | Tech |
|-----------|------|
| Backend   | Node.js, Express, SQLite, JWT |
| Frontend  | React, Vite, PWA (vite-plugin-pwa) |
| Hardware  | ESP32 (Arduino framework, PlatformIO) |

## Quick start

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Runs at **http://localhost:4009** (or `PORT` from `.env`). Default admin: `admin@niletron.local` / `admin123`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:3000** and proxies `/api` to the backend.

### 3. ESP32 (connect hardware)

**→ Full step-by-step: [docs/ESP32-CONNECT.md](docs/ESP32-CONNECT.md)**

Short version:

1. Install [PlatformIO](https://platformio.org/) (VS Code extension or CLI).
2. Copy and edit config:
   - `esp32/include/config.h`: set `WIFI_SSID`, `WIFI_PASSWORD`, `API_BASE_URL` (e.g. `http://192.168.1.100:4000`), `BOARD_ID`, `SECRET_KEY`.
3. In the web app (admin): **Admin → Boards** → Register board with the same `BOARD_ID`; copy the **secret_key** into `config.h`.
4. Add rooms and devices in the app; assign each device to that board and a **GPIO pin** (e.g. 2, 4, 5). Use pins listed in `esp32/src/main.cpp` (`kOutputPins`: 2, 4, 5, 12, 13, 14).
5. Build and upload:

```bash
cd esp32
pio run -t upload
pio device monitor -b 115200
```

## Project structure (modules)

```
NILETRON/
├── backend/
│   └── src/
│       ├── config/          # App config, env
│       ├── db/              # SQLite schema, init
│       ├── middleware/      # Auth, roles
│       ├── routes/          # auth, rooms, devices, boards, users
│       └── services/        # auth, room, device, board, user
├── frontend/
│   └── src/
│       ├── modules/
│       │   ├── api/         # API client
│       │   ├── auth/        # Login, register, context
│       │   ├── dashboard/   # Home, room list
│       │   ├── rooms/       # Room detail, device control
│       │   ├── admin/       # Rooms, devices, boards, users, backup (admin)
│       │   └── layout/      # Layout, nav
│       └── App.jsx
├── esp32/
│   ├── include/config.h     # WiFi, API URL, board id, secret
│   └── src/main.cpp        # WiFi, poll API, set GPIO
└── README.md
```

## API (summary)

- `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- `GET/POST/PATCH/DELETE /api/rooms`
- `GET /api/devices/room/:roomId`, `POST /api/devices`, `PATCH /api/devices/:id`, `POST /api/devices/:id/state`
- `GET /api/boards/state?board_id=...&secret_key=...` (for ESP32, no auth)
- `GET /api/boards`, `POST /api/boards` (admin)
- `GET /api/users`, `POST /api/users`, `GET/PUT /api/users/:id/rooms` (admin)
- `GET /api/admin/export-config`, `POST /api/admin/import-config` (admin) — download/upload JSON backup

**Moving setup to another PC:** In the web app go to **Admin → Backup**, export a JSON file, copy it to the other machine, start the backend there, run the app, sign in as admin, and **Import** the same file. Your ESP32 `config.h` can stay the same if the API URL and board secrets match the imported data.

## Host backend on Render

1. Push this repo to GitHub.
2. In [Render](https://render.com): **New → Blueprint** (select `render.yaml`) **or** **Web Service** with:
   - **Root directory:** `backend`
   - **Build:** `npm install`
   - **Start:** `npm start`
   - **Health check path:** `/api/health`
3. **Environment variables:**
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = long random string (Blueprint can generate one)
4. Copy your service URL, e.g. `https://niletron-api-xxxx.onrender.com`.

**SQLite on the free tier:** The database file lives on disk that can be wiped on redeploys. Use **Admin → Backup** before redeploys, or add a Render **persistent disk** and set `DB_PATH` to a path on that disk (see Render docs).

**Cold starts:** Free web services sleep; the first request after idle can take ~50s. ESP32 polling may see timeouts until the service wakes.

### Point the frontend at Render

When you build or run the PWA against the hosted API, set:

```bash
VITE_API_URL=https://YOUR-SERVICE.onrender.com npm run build
```

Or add `VITE_API_URL` in Vercel / Netlify / Render static site environment variables, then rebuild.

Local `npm run dev` keeps using the Vite proxy to `localhost:4009` unless you set `VITE_API_URL` in `frontend/.env.local`.

### ESP32

In `esp32/include/config.h`, set `API_BASE_URL` to your Render URL (no trailing slash), e.g. `https://niletron-api-xxxx.onrender.com`.

## PWA icons

For install prompt and app icon, add:

- `frontend/public/icons/icon-192.png` (192×192)
- `frontend/public/icons/icon-512.png` (512×512)

Optional: use a single image and [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) to generate them.

## Demo flow

1. Log in as admin → create a room (e.g. “Living room”) → register a board (e.g. `ESP32_LIVING`) → add devices (e.g. light on pin 2, fan on pin 5) → create a user and assign room access.
2. Log in as that user (or kids) → open the room → toggle light, set fan speed.
3. ESP32 on the same network polls `/api/boards/state`, receives pin states, and drives GPIO so the physical light and fan follow the app.

## License

Project for academic use at NILE University, Nigeria.
