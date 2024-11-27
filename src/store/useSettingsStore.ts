import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key: string) => set({ apiKey: key }),
    }),
    {
      name: 'settings-storage',
    }
  )
);