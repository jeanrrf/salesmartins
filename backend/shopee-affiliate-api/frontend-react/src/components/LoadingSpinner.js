import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ fullScreen, text }) => {
  return (
    <div className={`${styles.container} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.spinner}>
        <div className={styles.inner}></div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;