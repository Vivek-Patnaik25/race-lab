import React, { useEffect } from 'react';
import { useGameStore } from '../store/game-store';

export interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  useEffect(() => {
    useGameStore.getState().loadFromPersistence();
  }, []);

  return <>{children}</>;
};
