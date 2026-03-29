import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './modules/auth/AuthContext.jsx';
import { Layout } from './modules/layout/Layout.jsx';
import { Login } from './modules/auth/Login.jsx';
import { Register } from './modules/auth/Register.jsx';
import { Dashboard } from './modules/dashboard/Dashboard.jsx';
import { RoomDetail } from './modules/rooms/RoomDetail.jsx';
import { AdminRooms } from './modules/admin/AdminRooms.jsx';
import { AdminDevices } from './modules/admin/AdminDevices.jsx';
import { AdminBoards } from './modules/admin/AdminBoards.jsx';
import { AdminUsers } from './modules/admin/AdminUsers.jsx';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="room/:id" element={<RoomDetail />} />
        <Route
          path="admin/rooms"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminRooms />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/devices"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminDevices />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/boards"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminBoards />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminUsers />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
