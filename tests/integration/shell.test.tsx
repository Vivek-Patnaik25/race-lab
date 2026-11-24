import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/features/landing/LandingPage';
import { DashboardPage } from '../../src/features/dashboard/DashboardPage';

describe('RaceLab UI Shell Integration (Phase 0)', () => {
  it('renders landing page with headline and key CTAs', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Break concurrency/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Mission 01/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Dashboard/i)).toBeInTheDocument();
  });

  it('renders dashboard with recommended challenge card', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Engineering Console/i)).toBeInTheDocument();
    expect(screen.getAllByText(/The Lost Update/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Progression Overview/i)).toBeInTheDocument();
  });
});
