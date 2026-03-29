import React, { useEffect } from 'react';
import styles from './Toast.module.css';

export function Toast({ message, type = 'info', onDismiss, autoHideMs = 4000 }) {
  useEffect(() => {
    if (!autoHideMs) return;
    const t = setTimeout(() => onDismiss?.(), autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert">
      <span>{message}</span>
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
