import React, { useRef, useState } from 'react';
import { adminApi } from '../api/client.js';
import { Toast } from '../ui/Toast.jsx';
import { ConfirmModal } from '../ui/ConfirmModal.jsx';
import styles from './Admin.module.css';

export function AdminBackup() {
  const fileRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await adminApi.exportConfig();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `niletron-config-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'Configuration downloaded.', type: 'success' });
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setExporting(false);
    }
  }

  function onFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        setPendingImport(json);
      } catch {
        setToast({ message: 'Invalid JSON file.', type: 'error' });
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  async function confirmImport() {
    if (!pendingImport) return;
    setImporting(true);
    try {
      await adminApi.importConfig(pendingImport);
      setPendingImport(null);
      setToast({
        message: 'Import complete. Refresh the page if lists look stale.',
        type: 'success',
      });
    } catch (e) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>Backup & restore</h1>
      </div>
      <p className={styles.hint}>
        Export your setup as a JSON file and import it on another PC (same backend). Includes
        rooms, boards (with ESP32 secrets), devices, device states, user accounts, and room
        access. Keep the file private — it contains passwords (hashed) and board secrets.
      </p>

      <div className={styles.backupActions}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting…' : 'Export configuration'}
        </button>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => fileRef.current?.click()}
          disabled={importing}
        >
          Import from file…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className={styles.hiddenFile}
          onChange={onFileChosen}
          aria-hidden
        />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmModal
        open={!!pendingImport}
        title="Import configuration?"
        message="This replaces all rooms, boards, devices, and room assignments on this machine with the file contents. Users in the file are merged by email (same passwords as when you exported). Continue?"
        confirmLabel={importing ? 'Importing…' : 'Import'}
        onConfirm={confirmImport}
        onCancel={() => !importing && setPendingImport(null)}
        danger
      />
    </div>
  );
}
