import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AchievementToast } from '../ui/AchievementToast';
import { OnboardingModal, ONBOARDING_COMPLETED_KEY } from '../ui/OnboardingModal';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';
import { useUIStore } from '../../store/ui-store';

export const AppShell: React.FC = () => {
  const { openOnboarding } = useUIStore();

  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (!hasCompleted) {
        openOnboarding();
      }
    } catch {
      // ignore localStorage errors
    }
  }, [openOnboarding]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      {/* Accessible skip link for keyboard & screen-reader navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>

      <AchievementToast />
      <OnboardingModal />
      <KeyboardShortcutsModal />
    </div>
  );
};
