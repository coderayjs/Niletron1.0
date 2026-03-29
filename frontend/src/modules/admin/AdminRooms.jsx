import React, { useEffect, useState } from 'react';
import { roomsApi } from '../api/client.js';
import { Toast } from '../ui/Toast.jsx';
import { ConfirmModal } from '../ui/ConfirmModal.jsx';
import styles from './Admin.module.css';

export function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function load() {
    roomsApi.list().then(setRooms).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm({ name: '', description: '' });
    setModal('add');
  }

  function openEdit(room) {
    setForm({ name: room.name, description: room.description || '' });
    setModal({ type: 'edit', id: room.id });
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await roomsApi.create(form);
      } else {
        await roomsApi.update(modal.id, form);
      }
      setModal(null);
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  }

  async function doRemove(room) {
    try {
      await roomsApi.delete(room.id);
      setConfirmDelete(null);
      load();
      setToast({ message: `"${room.name}" deleted.`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
      setConfirmDelete(null);
    }
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>Rooms</h1>
        <button type="button" className={styles.btnPrimary} onClick={openAdd}>
          Add room
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Devices</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.description || '—'}</td>
                <td>{r.device_count ?? 0}</td>
                <td>
                  <button type="button" className={styles.btnSm} onClick={() => openEdit(r)}>Edit</button>
                  <button type="button" className={styles.btnSmDanger} onClick={() => setConfirmDelete(r)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'add' ? 'Add room' : 'Edit room'}</h2>
            <form onSubmit={save}>
              <label>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Description</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete room?"
        message={confirmDelete ? `Delete "${confirmDelete.name}" and all its devices?` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && doRemove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
