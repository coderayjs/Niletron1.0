// Local dev: Vite proxies /api → backend. Production: set VITE_API_URL to your Render URL (no trailing slash).
const API_BASE = import.meta.env.VITE_API_URL
  ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api`
  : '/api';

if (import.meta.env.DEV) {
  console.info('[NILETRON] API base →', API_BASE);
}

function getToken() {
  return localStorage.getItem('niletron_token');
}

export async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || res.statusText || 'Request failed';
    if (res.status === 404) throw new Error(msg + (data.path ? ` (${data.path})` : ''));
    if (res.status === 502 || res.status === 503) {
      throw new Error('Backend unreachable. Check that the API is running and VITE_API_URL is correct.');
    }
    throw new Error(msg);
  }
  return data;
}

export const authApi = {
  login: (email, password) => api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
};

export const roomsApi = {
  list: () => api('/rooms').then((r) => r.rooms),
  get: (id) => api(`/rooms/${id}`),
  create: (body) => api('/rooms', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/rooms/${id}`, { method: 'DELETE' }),
};

export const devicesApi = {
  listByRoom: (roomId) => api(`/devices/room/${roomId}`).then((r) => r.devices),
  get: (id) => api(`/devices/${id}`),
  create: (body) => api('/devices', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/devices/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/devices/${id}`, { method: 'DELETE' }),
  setState: (id, value) => api(`/devices/${id}/state`, { method: 'POST', body: JSON.stringify({ value }) }),
};

export const boardsApi = {
  list: () => api('/boards').then((r) => r.boards),
  create: (body) => api('/boards', { method: 'POST', body: JSON.stringify(body) }),
  getSecret: (boardId) => api(`/boards/${boardId}/secret`),
  delete: (id) => api(`/boards/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  list: () => api('/users').then((r) => r.users),
  create: (body) => api('/users', { method: 'POST', body: JSON.stringify(body) }),
  getRoomAccess: (userId) => api(`/users/${userId}/rooms`).then((r) => r.roomIds),
  setRoomAccess: (userId, roomIds) => api(`/users/${userId}/rooms`, { method: 'PUT', body: JSON.stringify({ roomIds }) }),
};

export const adminApi = {
  resetDb: () => api('/admin/reset-db', { method: 'POST' }),
  exportConfig: () => api('/admin/export-config'),
  importConfig: (body) =>
    api('/admin/import-config', { method: 'POST', body: JSON.stringify(body) }),
};
