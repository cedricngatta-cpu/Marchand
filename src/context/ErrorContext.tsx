'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ErrorContextType {
  error: string | null;
  addError: (message: string) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  const addError = useCallback((message: string) => {
    setError(message);
    // On peut imaginer une disparition automatique après quelques secondes
    setTimeout(() => {
      setError(null);
    }, 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ error, addError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};
