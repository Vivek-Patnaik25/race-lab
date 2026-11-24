import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorBoundary } from '../../src/components/ui/ErrorBoundary';
import { NotFoundPage } from '../../src/features/not-found/NotFoundPage';
import { KeyboardShortcutsModal } from '../../src/components/ui/KeyboardShortcutsModal';
import { OnboardingModal, ONBOARDING_COMPLETED_KEY } from '../../src/components/ui/OnboardingModal';
import { Header } from '../../src/components/layout/Header';
import { AppShell } from '../../src/components/layout/AppShell';
import { useUIStore } from '../../src/store/ui-store';

// Helper component that throws on render for ErrorBoundary test
const ProblematicChild: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test concurrency assertion failure');
  }
  return <div>Healthy child component</div>;
};

describe('Phase 6: Production Release & Accessibility Features', () => {
  beforeEach(() => {
    localStorage.clear();
    useUIStore.setState({
      isOnboardingOpen: false,
      isShortcutsOpen: false,
    });
  });

  describe('ErrorBoundary Component', () => {
    it('renders child components when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Safe Content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Safe Content')).toBeInTheDocument();
    });

    it('catches render errors and renders accessible error fallback UI', () => {
      // Suppress console.error in vitest output for expected thrown error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ProblematicChild shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Simulation Studio Interrupted/i)).toBeInTheDocument();
      expect(screen.getByText(/Test concurrency assertion failure/i)).toBeInTheDocument();
      expect(screen.getByText(/Recover Session/i)).toBeInTheDocument();
      expect(screen.getByText(/Return to Dashboard/i)).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('toggles error details stack trace display', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ProblematicChild shouldThrow={true} />
        </ErrorBoundary>
      );

      const toggleBtn = screen.getByText(/Show component stack/i);
      expect(toggleBtn).toBeInTheDocument();

      fireEvent.click(toggleBtn);
      expect(screen.getByText(/Hide stack trace/i)).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('NotFoundPage Component', () => {
    it('renders 404 message and navigation links to primary app areas', () => {
      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/404 • Thread unreachable/i)).toBeInTheDocument();
      expect(screen.getByText(/Instruction Pointer Lost/i)).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Challenges')).toBeInTheDocument();
      expect(screen.getByText('Simulation Lab')).toBeInTheDocument();
      expect(screen.getByText('Learning Centre')).toBeInTheDocument();
      expect(screen.getByText(/Back to Safety/i)).toBeInTheDocument();
    });
  });

  describe('KeyboardShortcutsModal Component', () => {
    it('does not render when closed', () => {
      render(<KeyboardShortcutsModal />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders when opened and displays all key bindings', () => {
      useUIStore.getState().openShortcuts();

      render(<KeyboardShortcutsModal />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Space')).toBeInTheDocument();
      expect(screen.getByText('→')).toBeInTheDocument();
      expect(screen.getByText('←')).toBeInTheDocument();
      expect(screen.getByText('R')).toBeInTheDocument();
      expect(screen.getByText('H')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('closes on close button click', () => {
      useUIStore.getState().openShortcuts();

      render(<KeyboardShortcutsModal />);
      const closeBtn = screen.getByLabelText(/Close keyboard shortcuts dialog/i);
      fireEvent.click(closeBtn);

      expect(useUIStore.getState().isShortcutsOpen).toBe(false);
    });

    it('closes on Escape key press', () => {
      useUIStore.getState().openShortcuts();

      render(<KeyboardShortcutsModal />);
      fireEvent.keyDown(window, { key: 'Escape' });

      expect(useUIStore.getState().isShortcutsOpen).toBe(false);
    });
  });

  describe('OnboardingModal Component', () => {
    it('renders when opened and guides through tour slides', () => {
      useUIStore.getState().openOnboarding();

      render(<OnboardingModal />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Welcome to RaceLab/i)).toBeInTheDocument();
      expect(screen.getByText(/1 of 5/i)).toBeInTheDocument();

      // Advance to next slide
      const nextBtn = screen.getByText(/Next/i);
      fireEvent.click(nextBtn);

      expect(screen.getByText(/Simulation Studio/i)).toBeInTheDocument();
      expect(screen.getByText(/2 of 5/i)).toBeInTheDocument();

      // Go back
      const backBtn = screen.getByText(/Back/i);
      fireEvent.click(backBtn);
      expect(screen.getByText(/Welcome to RaceLab/i)).toBeInTheDocument();
    });

    it('persists completion flag in localStorage when completed or dismissed', () => {
      useUIStore.getState().openOnboarding();

      render(<OnboardingModal />);
      const skipBtn = screen.getByLabelText(/Skip and close onboarding tour/i);
      fireEvent.click(skipBtn);

      expect(useUIStore.getState().isOnboardingOpen).toBe(false);
      expect(localStorage.getItem(ONBOARDING_COMPLETED_KEY)).toBe('true');
    });

    it('supports keyboard ArrowRight and ArrowLeft navigation', () => {
      useUIStore.getState().openOnboarding();

      render(<OnboardingModal />);
      expect(screen.getByText(/1 of 5/i)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(screen.getByText(/2 of 5/i)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(screen.getByText(/1 of 5/i)).toBeInTheDocument();
    });
  });

  describe('AppShell Accessibility & Header Controls', () => {
    it('includes a skip to main content accessible link', () => {
      render(
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      );

      const skipLink = screen.getByText(/Skip to main content/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('triggers tour and shortcuts modal from Header buttons', () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      const tourBtn = screen.getByRole('button', { name: /Open tour guide/i });
      fireEvent.click(tourBtn);
      expect(useUIStore.getState().isOnboardingOpen).toBe(true);

      const shortcutsBtn = screen.getByRole('button', { name: /View keyboard shortcuts/i });
      fireEvent.click(shortcutsBtn);
      expect(useUIStore.getState().isShortcutsOpen).toBe(true);
    });
  });
});
