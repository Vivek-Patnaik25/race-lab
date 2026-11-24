import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SimulationStudioPage } from '../../src/features/simulation/SimulationStudioPage';
import { ChallengesPage } from '../../src/features/challenges/ChallengesPage';
import { useSimulationStore } from '../../src/store/simulation-store';
import { useGameStore } from '../../src/store/game-store';

describe('Phase 3 Integration: Challenge & Game Progression Workflow', () => {
  beforeEach(async () => {
    localStorage.clear();
    await useGameStore.getState().resetAllProgress();
    useSimulationStore.getState().resetSimulation();
  });

  it('runs complete mission 01 lifecycle: unlock hint, reproduce lost update, verify objective, and persist score', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/app/simulate/mission-01']}>
        <Routes>
          <Route path="/app/simulate/:id" element={<SimulationStudioPage />} />
          <Route path="/app/challenges" element={<ChallengesPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial assertions
    expect(screen.getByText('Mission 01')).toBeInTheDocument();
    expect(screen.getByText('The Lost Update')).toBeInTheDocument();

    // 1. Open Hints Drawer and unlock Hint Tier 1
    const hintsButton = screen.getByRole('button', { name: /Hints/i });
    fireEvent.click(hintsButton);

    expect(screen.getByText(/Mission Hints & Intel/i)).toBeInTheDocument();
    const unlockHint1Button = screen.getByRole('button', {
      name: /Unlock Hint \(-150 pts\)/i,
    });
    fireEvent.click(unlockHint1Button);

    // Verify unlocked content is visible
    expect(
      screen.getByText(/What happens if both threads read the initial value/i)
    ).toBeInTheDocument();
    expect(useGameStore.getState().isHintUnlocked('m1-h1')).toBe(true);

    // Close Hint Drawer
    const closeDrawerBtn = screen.getByRole('button', { name: /Close hints drawer/i });
    fireEvent.click(closeDrawerBtn);

    // 2. Execute Lost Update interleaving
    // Thread A: READ (step 1)
    const stepControlsButton = screen.getByRole('button', {
      name: /Execute single instruction step/i,
    });
    fireEvent.click(stepControlsButton);

    // Switch to Thread B and step it (B: READ -> step 2)
    const getThreadBCard = () => screen.getAllByText('Thread B')[0];
    const getThreadACard = () => screen.getAllByText('Thread A')[0];

    fireEvent.click(getThreadBCard());
    fireEvent.click(stepControlsButton);

    // Switch to Thread A (A: ADD -> step 3)
    fireEvent.click(getThreadACard());
    fireEvent.click(stepControlsButton);

    // Switch to Thread B (B: ADD -> step 4)
    fireEvent.click(getThreadBCard());
    fireEvent.click(stepControlsButton);

    // Switch to Thread A (A: WRITE -> step 5)
    fireEvent.click(getThreadACard());
    fireEvent.click(stepControlsButton);

    // Switch to Thread B (B: WRITE -> step 6)
    fireEvent.click(getThreadBCard());
    fireEvent.click(stepControlsButton);

    // Final state assertions
    expect(screen.getByText('Step 6 of 6')).toBeInTheDocument();
    expect(screen.getAllByText(/DATA RACE DETECTED/i).length).toBeGreaterThan(0);

    // 3. Verify Objective
    const verifyButton = screen.getByRole('button', { name: /Verify Objective/i });
    fireEvent.click(verifyButton);

    // Modal pops up with Mission Accomplished
    expect(screen.getByText(/Mission Accomplished/i)).toBeInTheDocument();
    expect(screen.getByText(/You reproduced the Lost Update anomaly/i)).toBeInTheDocument();

    // Score checks: 1000 base + 500 step bonus - 150 hint penalty = 1350 pts
    expect(screen.getByText('1350')).toBeInTheDocument();
    expect(screen.getByText('Engineering Takeaway')).toBeInTheDocument();

    // Store assertions
    const savedMission = useGameStore.getState().challenges['mission-01'];
    expect(savedMission).toBeDefined();
    expect(savedMission.completed).toBe(true);
    expect(savedMission.bestScore).toBe(1350);
    expect(savedMission.stars).toBe(3);
    expect(useGameStore.getState().xp).toBeGreaterThan(0);

    // Achievement checks
    const firstRaceAch = useGameStore.getState().achievements.find((a) => a.id === 'first-race');
    expect(firstRaceAch?.unlocked).toBe(true);

    unmount();

    // 4. Mount ChallengesPage and check that Mission 01 displays COMPLETED
    render(
      <MemoryRouter initialEntries={['/app/challenges']}>
        <Routes>
          <Route path="/app/challenges" element={<ChallengesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText(/Best: 1350 pts/i)).toBeInTheDocument();
  });
});
