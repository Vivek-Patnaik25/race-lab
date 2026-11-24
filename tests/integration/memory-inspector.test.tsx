import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MemoryInspector } from '../../src/features/simulation/components/MemoryInspector';
import type { MutexState, RaceReport, DeadlockReport } from '../../src/engine';

describe('Phase 2 Visual Simulator: MemoryInspector Component', () => {
  const dummyShared = { counter: 42, balance: 250 };

  const dummyMutexes: MutexState[] = [
    {
      id: 'lock_alpha',
      owner: 'thread-1',
      waitingQueue: ['thread-2'],
      releaseClock: { values: { 'thread-1': 2 } },
    },
    {
      id: 'lock_beta',
      owner: null,
      waitingQueue: [],
      releaseClock: { values: {} },
    },
  ];

  const dummyRaces: RaceReport[] = [
    {
      id: 'race-101',
      variable: 'counter',
      threadA: 'thread-1',
      threadB: 'thread-2',
      accessTypeA: 'READ',
      accessTypeB: 'WRITE',
      stepA: 1,
      stepB: 3,
      explanation: 'Conflicting un-ordered write to counter.',
      suggestedFix: 'Enclose within lock_alpha.',
    },
  ];

  const dummyDeadlock: DeadlockReport = {
    id: 'deadlock-01',
    cycle: ['thread-1', 'thread-2', 'thread-1'],
    waitingRelationships: [
      { waitingThread: 'thread-1', holdingThread: 'thread-2', mutexId: 'lock_beta' },
      { waitingThread: 'thread-2', holdingThread: 'thread-1', mutexId: 'lock_alpha' },
    ],
    explanation: 'Circular dependency between thread-1 and thread-2.',
  };

  it('renders shared memory variables with live values', () => {
    render(
      <MemoryRouter>
        <MemoryInspector
          sharedMemory={dummyShared}
          mutexes={[]}
          activeRaces={[]}
          activeDeadlock={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('counter')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('balance')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('renders mutex states, ownership, and waiting queues', () => {
    render(
      <MemoryRouter>
        <MemoryInspector
          sharedMemory={dummyShared}
          mutexes={dummyMutexes}
          activeRaces={[]}
          activeDeadlock={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('lock_alpha')).toBeInTheDocument();
    expect(screen.getByText(/Owned by thread-1/i)).toBeInTheDocument();
    expect(screen.getByText(/thread-2/)).toBeInTheDocument();

    expect(screen.getByText('lock_beta')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('displays structured race diagnostic report with remediation advice', () => {
    render(
      <MemoryRouter>
        <MemoryInspector
          sharedMemory={dummyShared}
          mutexes={dummyMutexes}
          activeRaces={dummyRaces}
          activeDeadlock={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/DATA RACE #1/i)).toBeInTheDocument();
    expect(screen.getByText(/Conflicting un-ordered write/i)).toBeInTheDocument();
    expect(screen.getByText(/Enclose within lock_alpha/i)).toBeInTheDocument();
  });

  it('displays deadlock alert banner when active', () => {
    render(
      <MemoryRouter>
        <MemoryInspector
          sharedMemory={dummyShared}
          mutexes={dummyMutexes}
          activeRaces={[]}
          activeDeadlock={dummyDeadlock}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/DEADLOCK DETECTED/i)).toBeInTheDocument();
    expect(screen.getByText(/thread-1 → thread-2 → thread-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Circular dependency between/i)).toBeInTheDocument();
  });
});
