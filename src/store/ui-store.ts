import { create } from 'zustand';

export interface UIState {
  isOnboardingOpen: boolean;
  isShortcutsOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOnboardingOpen: false,
  isShortcutsOpen: false,
  openOnboarding: () => set({ isOnboardingOpen: true }),
  closeOnboarding: () => set({ isOnboardingOpen: false }),
  openShortcuts: () => set({ isShortcutsOpen: true }),
  closeShortcuts: () => set({ isShortcutsOpen: false }),
}));
