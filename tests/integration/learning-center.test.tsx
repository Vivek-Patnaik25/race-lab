import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LearningPage } from '../../src/features/learning/LearningPage';
import { ConceptDetailPage } from '../../src/features/learning/ConceptDetailPage';
import { CONCEPTS } from '../../src/data/concepts';

describe('Phase 5 Learning Centre & Interactive Concepts Integration', () => {
  it('renders all core concepts on the LearningPage', () => {
    render(
      <MemoryRouter initialEntries={['/app/learn']}>
        <LearningPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Learning Centre')).toBeInTheDocument();

    // Verify all 7 concepts are present
    for (const concept of CONCEPTS) {
      expect(screen.getByText(concept.title)).toBeInTheDocument();
    }
  });

  it('filters concepts by category tab', () => {
    render(
      <MemoryRouter initialEntries={['/app/learn']}>
        <LearningPage />
      </MemoryRouter>
    );

    // Click 'Synchronization' filter tab
    const syncTab = screen.getByRole('button', { name: /^Synchronization$/i });
    fireEvent.click(syncTab);

    // Synchronization concepts should be visible
    expect(screen.getByText(/Mutual Exclusion & Locks/i)).toBeInTheDocument();
    expect(screen.getByText(/Counting Semaphores & Capacity Guards/i)).toBeInTheDocument();

    // Other categories should be filtered out
    expect(screen.queryByText(/Deadlocks & The Coffman Conditions/i)).not.toBeInTheDocument();
  });

  it('filters concepts by search input', () => {
    render(
      <MemoryRouter initialEntries={['/app/learn']}>
        <LearningPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search concepts or topics/i);
    fireEvent.change(searchInput, { target: { value: 'Dijkstra' } });

    expect(screen.getByText(/Counting Semaphores & Capacity Guards/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mutual Exclusion & Locks/i)).not.toBeInTheDocument();
  });

  it('renders ConceptDetailPage with interactive vector clock widget for happens-before', () => {
    render(
      <MemoryRouter initialEntries={['/app/learn/happens-before']}>
        <Routes>
          <Route path="/app/learn/:concept" element={<ConceptDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Title and Summary
    expect(
      screen.getByText(/The Happens-Before Relationship & Vector Clocks/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Interactive Vector Clock Comparator/i)).toBeInTheDocument();

    // Formulas and sections
    expect(screen.getByText(/Lamport Causality & Vector Clocks/i)).toBeInTheDocument();
    expect(screen.getByText(/Clock Merging on Synchronization/i)).toBeInTheDocument();

    // Test Interactive Vector Clock Widget: Click Preset: Concurrent
    const concurrentPresetBtn = screen.getByRole('button', { name: /Preset: Concurrent/i });
    fireEvent.click(concurrentPresetBtn);

    // Should indicate Concurrent relation
    expect(screen.getByText(/Concurrent: V₁ ∥ V₂/i)).toBeInTheDocument();

    // Test Merge button
    const mergeBtn = screen.getByRole('button', { name: /Merge max\(V₁, V₂\)/i });
    fireEvent.click(mergeBtn);

    expect(screen.getByText(/Merged Clock V_merged = max\(V₁, V₂\):/i)).toBeInTheDocument();
  });

  it('renders ConceptDetailPage with interactive race demo and triggers lost update', () => {
    render(
      <MemoryRouter initialEntries={['/app/learn/race-conditions']}>
        <Routes>
          <Route path="/app/learn/:concept" element={<ConceptDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Data Races & Race Conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive Race Condition Stepper/i)).toBeInTheDocument();

    // Click Race Interleaving button
    const raceInterleavingBtn = screen.getByRole('button', { name: /Race Interleaving/i });
    fireEvent.click(raceInterleavingBtn);

    // Should confirm lost update
    expect(screen.getByText(/LOST UPDATE CONFIRMED/i)).toBeInTheDocument();
  });

  it('renders ConceptDetailPage with interactive deadlock cycle detector', () => {
    render(
      <MemoryRouter initialEntries={['/app/learn/deadlocks']}>
        <Routes>
          <Route path="/app/learn/:concept" element={<ConceptDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Deadlocks & The Coffman Conditions/i)).toBeInTheDocument();

    // Step through to deadlock
    const stepNextBtn = screen.getByRole('button', { name: /Step Next/i });
    fireEvent.click(stepNextBtn); // step 1
    fireEvent.click(stepNextBtn); // step 2
    fireEvent.click(stepNextBtn); // step 3
    fireEvent.click(stepNextBtn); // step 4

    // Cycle detected
    expect(screen.getByText(/UNRESOLVABLE DEADLOCK CONFIRMED/i)).toBeInTheDocument();
    expect(screen.getByText(/Thread A → Thread B → Thread A/i)).toBeInTheDocument();
  });
});
