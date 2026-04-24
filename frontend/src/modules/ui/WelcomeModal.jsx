import React from 'react';
import styles from './WelcomeModal.module.css';

export function WelcomeModal({ variant, userName, onContinue }) {
  const name = userName || 'there';
  const isRegister = variant === 'register';
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div className={styles.modal}>
        <h2 id="welcome-modal-title" className={styles.title}>
          {isRegister ? 'Welcome to NILETRON' : 'Welcome back'}
        </h2>
        <p className={styles.message}>
          {isRegister
            ? `You're in, ${name}. Your home dashboard is ready.`
            : `Signed in as ${name}. You're all set to control your home.`}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.continue} onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
