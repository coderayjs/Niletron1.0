import React, { useEffect, useState } from 'react';
import { boardsApi, adminApi } from '../api/client.js';
import { Toast } from '../ui/Toast.jsx';
import { ConfirmModal } from '../ui/ConfirmModal.jsx';
import styles from './Admin.module.css';

export function AdminBoards() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ board_id: '', name: '' });
  const [showSecret, setShowSecret] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  async function copySecret(text, field) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_) {
      setToast({ message: 'Copy failed. Manually select and copy the key.', type: 'error' });
    }
  }

  async function showSecretForBoard(id) {
    try {
      const s = await boardsApi.getSecret(id);
      setShowSecret(s);
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    }
  }

  function openDeleteBoard(b) {
    setConfirmDelete({
      board: b,
      message: (b.device_count ?? 0) > 0
        ? `This will also remove ${b.device_count} device(s) on this board.`
        : null,
    });
  }

  async function doDeleteBoard() {
    if (!confirmDelete) return;
    const b = confirmDelete.board;
    try {
      await boardsApi.delete(b.id);
      setShowSecret(null);
      setConfirmDelete(null);
      load();
      setToast({ message: `"${b.name}" deleted.`, type: 'success' });
    } catch (e) {
      setConfirmDelete(null);
      setToast({ message: e.message, type: 'error' });
    }
  }

  function load() {
    boardsApi.list().then(setBoards).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm({ board_id: '', name: '' });
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    const { name } = form;
    try {
      const board = await boardsApi.create(form);
      setModal(false);
      setShowSecret(board);
      load();
      setToast({ message: `Board "${name}" added.`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  }

  async function doResetDb() {
    try {
      await adminApi.resetDb();
      setConfirmReset(false);
      setToast({ message: 'Database reset. Log in again with admin@niletron.local / admin123', type: 'success' });
      localStorage.clear();
      sessionStorage.clear();
      setTimeout(() => { window.location.href = '/login'; }, 800);
    } catch (e) {
      setConfirmReset(false);
      setToast({ message: e.message || 'Reset failed', type: 'error' });
    }
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>ESP32 Boards</h1>
        <button type="button" className={styles.btnPrimary} onClick={openAdd}>
          Register board
        </button>
      </div>
      <p className={styles.hint}>
        Register each ESP32 so it can poll device state. After registering, <strong>copy the secret key</strong> into <code>esp32/include/config.h</code> as <code>SECRET_KEY</code>. You can reveal it again with “Show secret” below.
      </p>
      <p className={styles.hint}>
        <button type="button" className={styles.resetDbBtn} onClick={() => setConfirmReset(true)}>
          Reset database
        </button>
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Board ID</th>
              <th>Name</th>
              <th>Devices</th>
              <th>Last seen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {boards.map((b) => (
              <tr key={b.id}>
                <td><code>{b.board_id}</code></td>
                <td>{b.name}</td>
                <td>{b.device_count ?? 0}</td>
                <td>{b.last_seen_at ? new Date(b.last_seen_at).toLocaleString() : '—'}</td>
                <td>
                  <button type="button" className={styles.btnSm} onClick={() => showSecretForBoard(b.id)}>
                    Show secret
                  </button>
                  <button type="button" className={styles.btnSmDanger} onClick={() => openDeleteBoard(b)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSecret && (
        <div className={styles.modalOverlay} onClick={() => setShowSecret(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>ESP32 config: Board ID &amp; secret key</h2>
            <p className={styles.secretHelp}>
              Put these in <code>esp32/include/config.h</code>. The secret key is required for the ESP32 to talk to the API.
            </p>
            <label className={styles.secretLabel}>
              <span>BOARD_ID</span>
              <div className={styles.secretRow}>
                <code>{showSecret.board_id}</code>
                <button type="button" className={styles.copyBtn} onClick={() => copySecret(showSecret.board_id, 'board')}>
                  {copiedField === 'board' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </label>
            <label className={styles.secretLabel}>
              <span>SECRET_KEY</span>
              <div className={styles.secretRow}>
                <code className={styles.secretCode}>{showSecret.secret_key}</code>
                <button type="button" className={styles.copyBtn} onClick={() => copySecret(showSecret.secret_key, 'secret')}>
                  {copiedField === 'secret' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </label>
            <button type="button" className={styles.btnPrimary} onClick={() => setShowSecret(null)}>Done</button>
          </div>
        </div>
      )}

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Register ESP32 board</h2>
            <form onSubmit={save}>
              <label>
                <span>Board ID</span>
                <input
                  value={form.board_id}
                  onChange={(e) => setForm((f) => ({ ...f, board_id: e.target.value }))}
                  placeholder="e.g. ESP32_LIVING"
                  required
                />
              </label>
              <label>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Living room board"
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmReset}
        title="Reset database?"
        message="Delete all rooms, boards, devices and users. Only the default admin (admin@niletron.local) will remain. You will be signed out."
        confirmLabel="Reset"
        danger
        onConfirm={doResetDb}
        onCancel={() => setConfirmReset(false)}
      />

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete board?"
        message={confirmDelete ? (
          <>
            Delete &quot;{confirmDelete.board.name}&quot;?
            {confirmDelete.message && (
              <><br /><br />{confirmDelete.message}</>
            )}
          </>
        ) : ''}
        confirmLabel="Delete"
        danger
        onConfirm={doDeleteBoard}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
