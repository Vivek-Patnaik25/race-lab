import { create } from 'zustand';

export interface SettingsState {
  theme: 'dark';
  reducedMotion: boolean;
  defaultExecutionSpeed: number; // in milliseconds per step
  codeFont: string;
  setReducedMotion: (enabled: boolean) => void;
  setDefaultExecutionSpeed: (speed: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark',
  reducedMotion: false,
  defaultExecutionSpeed: 600,
  codeFont: 'JetBrains Mono',
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setDefaultExecutionSpeed: (defaultExecutionSpeed) => set({ defaultExecutionSpeed }),
}));
