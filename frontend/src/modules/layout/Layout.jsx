import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { NiletronLogo } from '../auth/NiletronLogo.jsx';
import { WelcomeModal } from '../ui/WelcomeModal.jsx';
import styles from './Layout.module.css';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(null);

  useEffect(() => {
    const w = location.state?.welcomeToast;
    if (w !== 'login' && w !== 'register') return;
    setWelcomeOpen(w);
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null }
    );
  }, [location.state, location.pathname, location.search, location.hash, navigate]);

  const isAdmin = user?.role === 'admin';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.layout}>
      {/* Mobile: top bar with menu + logo + user */}
      <header className={styles.header}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          <span className={styles.menuIcon} />
        </button>
        <NavLink to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          NILETRON
        </NavLink>
        <div className={styles.headerUser}>
          <span className={styles.userName}>{user?.name}</span>
          <span className={styles.userRole}>{isAdmin ? 'Admin' : user?.role}</span>
        </div>
      </header>

      {/* Sidebar: on desktop always visible; on mobile slides in */}
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarLogo}>
          <NavLink to="/" onClick={() => setMenuOpen(false)} className={styles.logoLink}>
            <NiletronLogo variant="sidebar" showWordmark={true} />
          </NavLink>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>
            Dashboard
          </NavLink>
          {isAdmin && (
            <>
              <span className={styles.navLabel}>Admin</span>
              <NavLink to="/admin/rooms" onClick={() => setMenuOpen(false)}>Rooms</NavLink>
              <NavLink to="/admin/devices" onClick={() => setMenuOpen(false)}>Devices</NavLink>
              <NavLink to="/admin/boards" onClick={() => setMenuOpen(false)}>Boards</NavLink>
              <NavLink to="/admin/users" onClick={() => setMenuOpen(false)}>Users</NavLink>
              <NavLink to="/admin/backup" onClick={() => setMenuOpen(false)}>Backup</NavLink>
            </>
          )}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{isAdmin ? 'Admin' : user?.role}</span>
          </div>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      <main className={styles.main}>
        <Outlet />
      </main>

      {welcomeOpen && (
        <WelcomeModal
          variant={welcomeOpen}
          userName={user?.name}
          onContinue={() => setWelcomeOpen(null)}
        />
      )}
    </div>
  );
}
