import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LabPage } from '../../src/features/lab/LabPage';
import { SimulationStudioPage } from '../../src/features/simulation/SimulationStudioPage';
import { useLabStore } from '../../src/store/lab-store';
import { useSimulationStore } from '../../src/store/simulation-store';

describe('Phase 4 Integration: Custom Simulation Lab Builder', () => {
  beforeEach(() => {
    useLabStore.getState().loadPreset('lost-update');
    useSimulationStore.getState().resetSimulation();
  });

  it('configures custom variables, mutexes, and launches scenario into Visual Simulator', () => {
    render(
      <MemoryRouter initialEntries={['/app/lab']}>
        <Routes>
          <Route path="/app/lab" element={<LabPage />} />
          <Route path="/app/simulate/:id" element={<SimulationStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial assertions
    expect(screen.getByText('Custom Simulation Lab')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lost Update Anomaly')).toBeInTheDocument();

    // 1. Add a new shared memory variable
    const varNameInput = screen.getByPlaceholderText('var_name');
    fireEvent.change(varNameInput, { target: { value: 'shared_vault' } });

    // Submit form (plus button near var_name)
    const addVarBtn = varNameInput.parentElement?.querySelector('button[type="submit"]');
    expect(addVarBtn).toBeDefined();
    if (addVarBtn) fireEvent.click(addVarBtn);

    expect(screen.getByText('shared_vault')).toBeInTheDocument();
    expect(useLabStore.getState().sharedMemory.shared_vault).toBe(0);

    // 2. Add a new mutex
    const mutexInput = screen.getByPlaceholderText('mutex_id');
    fireEvent.change(mutexInput, { target: { value: 'vault_guard' } });

    const addMutexBtn = mutexInput.parentElement?.querySelector('button[type="submit"]');
    expect(addMutexBtn).toBeDefined();
    if (addMutexBtn) fireEvent.click(addMutexBtn);

    expect(screen.getByText('vault_guard')).toBeInTheDocument();
    expect(useLabStore.getState().mutexes).toContain('vault_guard');

    // 3. Load Preset Template: Mutex Guard
    const presetSelect = screen.getByDisplayValue('Select Template...');
    fireEvent.change(presetSelect, { target: { value: 'mutex-rescue' } });

    expect(screen.getByDisplayValue('Mutex Synchronization Guard')).toBeInTheDocument();

    // 4. Click "Run in Studio"
    const runInStudioButton = screen.getByRole('button', { name: /Run in Studio/i });
    fireEvent.click(runInStudioButton);

    // Assert that we navigated to the Simulation Studio for custom-lab
    expect(screen.getByText('Mission LAB')).toBeInTheDocument();
    expect(screen.getByText('Mutex Synchronization Guard')).toBeInTheDocument();
    expect(screen.getByText('Step 0 of 0')).toBeInTheDocument();

    // 5. Execute step in studio
    const stepButton = screen.getByRole('button', {
      name: /Execute single instruction step/i,
    });
    fireEvent.click(stepButton);

    expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
  });
});
