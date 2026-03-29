import React, { useEffect, useState } from 'react';
import { usersApi, roomsApi } from '../api/client.js';
import { Toast } from '../ui/Toast.jsx';
import styles from './Admin.module.css';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'user' });
  const [roomAccess, setRoomAccess] = useState([]);

  function load() {
    Promise.all([usersApi.list(), roomsApi.list()]).then(([u, r]) => {
      setUsers(u);
      setRooms(r);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm({ email: '', password: '', name: '', role: 'user' });
    setModal('add');
  }

  async function openRoomAccess(user) {
    const roomIds = await usersApi.getRoomAccess(user.id);
    setRoomAccess(roomIds);
    setModal({ type: 'rooms', user });
  }

  async function saveUser(e) {
    e.preventDefault();
    try {
      await usersApi.create(form);
      setModal(null);
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  }

  async function saveRoomAccess(e) {
    e.preventDefault();
    try {
      await usersApi.setRoomAccess(modal.user.id, roomAccess);
      setModal(null);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>Users</h1>
        <button type="button" className={styles.btnPrimary} onClick={openAdd}>
          Add user
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button type="button" className={styles.btnSm} onClick={() => openRoomAccess(u)}>
                    Room access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'add' && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Add user</h2>
            <form onSubmit={saveUser}>
              <label>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  minLength={6}
                  required
                />
              </label>
              <label>
                <span>Role</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="user">User</option>
                  <option value="kids">Kids (lighting only)</option>
                </select>
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal?.type === 'rooms' && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Room access: {modal.user.name}</h2>
            <p className={styles.hint}>Select rooms this user can see and control.</p>
            <form onSubmit={saveRoomAccess}>
              <div className={styles.checkboxList}>
                {rooms.map((r) => (
                  <label key={r.id} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={roomAccess.includes(r.id)}
                      onChange={(e) => {
                        if (e.target.checked) setRoomAccess((a) => [...a, r.id]);
                        else setRoomAccess((a) => a.filter((id) => id !== r.id));
                      }}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
