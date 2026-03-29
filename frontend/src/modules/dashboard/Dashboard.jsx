import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { roomsApi } from '../api/client.js';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    roomsApi
      .list()
      .then(setRooms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === 'admin';

  if (loading) return <div className={styles.loading}>Loading rooms…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Select a room to control devices</p>
      <div className={styles.grid}>
        {rooms.map((room) => (
          <Link
            key={room.id}
            to={`/room/${room.id}`}
            className={styles.card}
          >
            <span className={styles.cardName}>{room.name}</span>
            <span className={styles.cardMeta}>
              {room.device_count ?? 0} device(s)
            </span>
          </Link>
        ))}
      </div>
      {rooms.length === 0 && (
        <div className={styles.emptyCard}>
          <p>
            {isAdmin
              ? 'No rooms yet. Add your first room to get started.'
              : 'No rooms yet. Ask an admin to add rooms and assign you access.'}
          </p>
          {isAdmin && (
            <Link to="/admin/rooms">Add room</Link>
          )}
        </div>
      )}
    </div>
  );
}
