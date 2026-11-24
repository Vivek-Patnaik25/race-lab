import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SimulationStudioPage } from '../../src/features/simulation/SimulationStudioPage';
import { useSimulationStore } from '../../src/store/simulation-store';

describe('Phase 2 Visual Simulator: SimulationStudio Full Integration', () => {
  it('loads mission 01 and coordinates stepping, memory updates, and history rewinds', () => {
    // Reset store
    useSimulationStore.getState().resetSimulation();

    render(
      <MemoryRouter initialEntries={['/app/simulate/mission-01']}>
        <Routes>
          <Route path="/app/simulate/:id" element={<SimulationStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial assertions
    expect(screen.getByText('Mission 01')).toBeInTheDocument();
    expect(screen.getByText('The Lost Update')).toBeInTheDocument();
    expect(screen.getByText(/Thread Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/Execution Timeline \(Interleaving Lanes\)/i)).toBeInTheDocument();

    // Step 0 check
    expect(screen.getByText('Step 0 of 0')).toBeInTheDocument();

    // Find the Step button in controls
    const stepControlsButton = screen.getByRole('button', {
      name: /Execute single instruction step/i,
    });
    expect(stepControlsButton).toBeInTheDocument();

    // Step 1: Execute Thread A: READ counter INTO a
    fireEvent.click(stepControlsButton);

    expect(screen.getByText(/Thread A read counter \(0\) into a/i)).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();

    // Step 2: Click "Back" to rewind
    const backButton = screen.getByRole('button', { name: /Step Backward/i });
    expect(backButton).toBeEnabled();
    fireEvent.click(backButton);

    // After rewinding, step is back to 0
    expect(screen.getByText('Step 0 of 1')).toBeInTheDocument();

    // Reset button
    const resetButton = screen.getByRole('button', { name: /Reset simulation to initial state/i });
    fireEvent.click(resetButton);
    expect(screen.getByText('Step 0 of 0')).toBeInTheDocument();
  });
});
