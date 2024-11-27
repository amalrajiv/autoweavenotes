import React, { createContext, useContext, useState } from 'react';
import SageChat from './sage-chat';

interface SageContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SageContext = createContext<SageContextType | undefined>(undefined);

export const useSage = () => {
  const context = useContext(SageContext);
  if (!context) {
    throw new Error('useSage must be used within a SageProvider');
  }
  return context;
};

interface SageProviderProps {
  children: React.ReactNode;
}

export const SageProvider: React.FC<SageProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SageContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      {isOpen && <SageChat />}
    </SageContext.Provider>
  );
};