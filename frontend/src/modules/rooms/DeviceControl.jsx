import React, { useState } from 'react';
import { devicesApi } from '../api/client.js';
import styles from './DeviceControl.module.css';

export function DeviceControl({ device, onUpdate, canControlFan }) {
  const [loading, setLoading] = useState(false);
  const isLight = device.type === 'light';
  const disabled = !isLight && !canControlFan;

  async function setValue(value) {
    if (disabled) return;
    setLoading(true);
    try {
      await devicesApi.setState(device.id, value);
      onUpdate(device.id, value);
    } finally {
      setLoading(false);
    }
  }

  if (isLight) {
    const on = Number(device.value) > 0;
    return (
      <div className={styles.card}>
        <div className={styles.icon} data-type="light">💡</div>
        <span className={styles.name}>{device.name}</span>
        <button
          type="button"
          className={`${styles.toggle} ${on ? styles.on : ''}`}
          onClick={() => setValue(on ? 0 : 255)}
          disabled={loading}
          aria-pressed={on}
        >
          {on ? 'ON' : 'OFF'}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.icon} data-type="fan">🌀</div>
      <span className={styles.name}>{device.name}</span>
      {canControlFan ? (
        <div className={styles.fanControl}>
          <input
            type="range"
            min="0"
            max="255"
            value={device.value ?? 0}
            onChange={(e) => setValue(Number(e.target.value))}
            onMouseUp={(e) => setValue(Number(e.target.value))}
            onTouchEnd={(e) => setValue(Number(e.target.value))}
            disabled={loading}
            className={styles.slider}
          />
          <span className={styles.speed}>
            {Math.round(((device.value ?? 0) / 255) * 100)}%
          </span>
        </div>
      ) : (
        <span className={styles.restricted}>Lighting only</span>
      )}
    </div>
  );
}
