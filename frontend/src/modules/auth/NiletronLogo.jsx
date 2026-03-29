import React from 'react';
import styles from './NiletronLogo.module.css';

/**
 * NILETRON brand logo: smart home mark (house + hub) + wordmark.
 * Used on login, register, and optionally in app shell.
 */
export function NiletronLogo({ variant = 'auth', showWordmark = true, className = '' }) {
  const isAuth = variant === 'auth';
  const size = isAuth ? 80 : 36;

  return (
    <div className={`${styles.logo} ${styles[variant]} ${className}`} aria-hidden>
      <svg
        className={styles.mark}
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* House shape - roof + body */}
        <path
          d="M32 8L8 28v28h16V40h24v16h16V28L32 8z"
          fill="currentColor"
          opacity="0.95"
        />
        {/* Door / hub entrance */}
        <path
          d="M28 44h8v12h-8z"
          className={styles.door}
        />
        {/* Central hub dot - smart control */}
        <circle cx="32" cy="34" r="5" fill="currentColor" className={styles.hub} />
        <circle cx="32" cy="34" r="2.5" className={styles.innerDot} />
        {/* Connection nodes - automation feel */}
        <circle cx="20" cy="22" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="44" cy="22" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="32" cy="18" r="2" fill="currentColor" opacity="0.7" />
      </svg>
      {showWordmark && (
        <span className={styles.wordmark}>NILETRON</span>
      )}
    </div>
  );
}
