import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomsApi, devicesApi } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { DeviceControl } from './DeviceControl.jsx';
import styles from './RoomDetail.module.css';

export function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const roomId = Number(id);

  useEffect(() => {
    if (!roomId) return;
    Promise.all([
      roomsApi.get(roomId).catch(() => null),
      devicesApi.listByRoom(roomId).catch(() => []),
    ]).then(([r, d]) => {
      setRoom(r);
      setDevices(Array.isArray(d) ? d : []);
      if (!r) setError('Room not found');
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [roomId]);

  const updateDeviceState = (deviceId, value) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, value } : d))
    );
  };

  if (loading) return <div className={styles.loading}>Loading…</div>;
  if (error || !room) {
    return (
      <div className={styles.error}>
        {error || 'Room not found'}
        <button type="button" onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    );
  }

  const canControlFan = user?.role !== 'kids';

  return (
    <div className={styles.room}>
      <div className={styles.header}>
        <button type="button" className={styles.back} onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className={styles.title}>{room.name}</h1>
        {room.description && (
          <p className={styles.desc}>{room.description}</p>
        )}
      </div>
      <div className={styles.devices}>
        {devices.map((device) => (
          <DeviceControl
            key={device.id}
            device={device}
            onUpdate={updateDeviceState}
            canControlFan={canControlFan}
          />
        ))}
      </div>
      {devices.length === 0 && (
        <p className={styles.empty}>No devices in this room.</p>
      )}
    </div>
  );
}
