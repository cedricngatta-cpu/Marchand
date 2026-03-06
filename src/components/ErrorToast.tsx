'use client';

import React from 'react';
import { useError } from '@/context/ErrorContext';

export const ErrorToast: React.FC = () => {
  const { error, clearError } = useError();

  if (!error) {
    return null;
  }

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#EF4444', // Rouge
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0',
  };

  return (
    <div style={toastStyle}>
      <span>{error}</span>
      <button style={buttonStyle} onClick={clearError}>
        &times;
      </button>
    </div>
  );
};
