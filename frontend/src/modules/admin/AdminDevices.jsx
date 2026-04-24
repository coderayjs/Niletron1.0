import React, { useEffect, useState } from 'react';
import { devicesApi, roomsApi, boardsApi } from '../api/client.js';
import { Toast } from '../ui/Toast.jsx';
import { ConfirmModal } from '../ui/ConfirmModal.jsx';
import styles from './Admin.module.css';

export function AdminDevices() {
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    room_id: '',
    board_id: '',
    pin: 2,
    type: 'light',
    name: '',
  });

  function load() {
    setLoading(true);
    Promise.all([roomsApi.list(), boardsApi.list()]).then(([r, b]) => {
      setRooms(r);
      setBoards(b);
      return Promise.all(r.map((room) => devicesApi.listByRoom(room.id).then((d) => ({ room, devices: d }))));
    }).then((byRoom) => {
      setDevices(byRoom.flatMap((x) => x.devices.map((d) => ({ ...d, roomName: x.room.name }))));
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm({
      room_id: rooms[0]?.id ?? '',
      board_id: boards[0]?.id ?? '',
      pin: 2,
      type: 'light',
      name: '',
    });
    setModal('add');
  }

  function openEdit(device) {
    setForm({
      room_id: device.room_id,
      board_id: device.board_id,
      pin: device.pin,
      type: device.type,
      name: device.name,
    });
    setModal({ type: 'edit', id: device.id });
  }

  async function save(e) {
    e.preventDefault();
    const { name } = form;
    const payload = {
      ...form,
      room_id: Number(form.room_id),
      board_id: Number(form.board_id),
      pin: Number(form.pin),
    };
    try {
      if (modal === 'add') {
        await devicesApi.create(payload);
        setToast({ message: `Device "${name}" added.`, type: 'success' });
      } else {
        await devicesApi.update(modal.id, payload);
        setToast({ message: `Device "${name}" updated.`, type: 'success' });
      }
      setModal(null);
      load();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  }

  async function doRemove(device) {
    try {
      await devicesApi.delete(device.id);
      setConfirmDelete(null);
      load();
      setToast({ message: `"${device.name}" deleted.`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
      setConfirmDelete(null);
    }
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>Devices</h1>
        <button type="button" className={styles.btnPrimary} onClick={openAdd}>
          Add device
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Room</th>
              <th>Type</th>
              <th>Board ID</th>
              <th>Pin</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.roomName}</td>
                <td>{d.type}</td>
                <td>{d.board_id}</td>
                <td>{d.pin}</td>
                <td>
                  <button type="button" className={styles.btnSm} onClick={() => openEdit(d)}>Edit</button>
                  <button type="button" className={styles.btnSmDanger} onClick={() => setConfirmDelete(d)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'add' ? 'Add device' : 'Edit device'}</h2>
            <form onSubmit={save}>
              <label>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Living room light"
                  required
                />
              </label>
              <label>
                <span>Room</span>
                <select
                  value={form.room_id}
                  onChange={(e) => setForm((f) => ({ ...f, room_id: e.target.value }))}
                  required
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Board</span>
                <select
                  value={form.board_id}
                  onChange={(e) => setForm((f) => ({ ...f, board_id: e.target.value }))}
                  required
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.board_id})</option>
                  ))}
                </select>
              </label>
              <label>
                <span>GPIO Pin</span>
                <input
                  type="number"
                  min="0"
                  max="39"
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: Number(e.target.value) }))}
                />
              </label>
              <label>
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="light">Light</option>
                  <option value="fan">Fan</option>
                </select>
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
        title="Delete device?"
        message={confirmDelete ? `Delete "${confirmDelete.name}"?` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && doRemove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
