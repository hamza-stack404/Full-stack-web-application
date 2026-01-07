"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ErrorContextType {
  error: string | null;
  setError: (message: string | null) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<string | null>(null);

  return (
    <ErrorContext.Provider value={{ error, setError }}>
      {children}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded shadow-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">
            &times;
          </button>
        </div>
      )}
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
