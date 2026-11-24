import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadExplorer } from '../../src/features/simulation/components/ThreadExplorer';
import type { ThreadState, MutexState } from '../../src/engine';

describe('Phase 2 Visual Simulator: ThreadExplorer Component', () => {
  const dummyThreads: ThreadState[] = [
    {
      id: 'thread-a',
      name: 'Thread A',
      instructions: [
        { op: 'READ', source: 'counter', target: 'a' },
        { op: 'ADD', target: 'a', value: 1 },
        { op: 'WRITE', target: 'counter', source: 'a' },
      ],
      programCounter: 1,
      localMemory: { a: 42 },
      status: 'READY',
      clock: { values: { 'thread-a': 1 } },
      color: 'thread-a',
    },
    {
      id: 'thread-b',
      name: 'Thread B',
      instructions: [{ op: 'LOCK', mutexId: 'vault_mutex' }],
      programCounter: 0,
      localMemory: {},
      status: 'BLOCKED',
      clock: { values: {} },
      color: 'thread-b',
    },
  ];

  const dummyMutexes: MutexState[] = [
    {
      id: 'vault_mutex',
      owner: 'thread-a',
      waitingQueue: ['thread-b'],
      releaseClock: { values: {} },
    },
  ];

  it('renders threads with names, PC indicators, and status badges', () => {
    render(
      <ThreadExplorer
        threads={dummyThreads}
        mutexes={dummyMutexes}
        selectedThreadId="thread-a"
        schedulerMode="MANUAL"
        onSelectThread={vi.fn()}
        onStepThread={vi.fn()}
      />
    );

    expect(screen.getByText('Thread A')).toBeInTheDocument();
    expect(screen.getByText('Thread B')).toBeInTheDocument();
    expect(screen.getByText('READY')).toBeInTheDocument();
    expect(screen.getByText('BLOCKED')).toBeInTheDocument();
    expect(screen.getByText(/PC: 1\/3/)).toBeInTheDocument();
  });

  it('highlights current instruction and displays local registers', () => {
    render(
      <ThreadExplorer
        threads={dummyThreads}
        mutexes={dummyMutexes}
        selectedThreadId="thread-a"
        schedulerMode="MANUAL"
        onSelectThread={vi.fn()}
        onStepThread={vi.fn()}
      />
    );

    // Current instruction (PC: 1 -> ADD a BY 1) should have NEXT badge
    expect(screen.getByText('NEXT')).toBeInTheDocument();
    expect(screen.getByText('ADD a BY 1')).toBeInTheDocument();

    // Local register value
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays blocked mutex diagnostic information', () => {
    render(
      <ThreadExplorer
        threads={dummyThreads}
        mutexes={dummyMutexes}
        selectedThreadId="thread-a"
        schedulerMode="MANUAL"
        onSelectThread={vi.fn()}
        onStepThread={vi.fn()}
      />
    );

    expect(screen.getByText(/Blocked on mutex/i)).toBeInTheDocument();
    expect(screen.getByText('vault_mutex')).toBeInTheDocument();
    expect(screen.getByText('thread-a')).toBeInTheDocument();
  });

  it('triggers onSelectThread and onStepThread callbacks', () => {
    const handleSelect = vi.fn();
    const handleStep = vi.fn();

    render(
      <ThreadExplorer
        threads={dummyThreads}
        mutexes={dummyMutexes}
        selectedThreadId="thread-a"
        schedulerMode="MANUAL"
        onSelectThread={handleSelect}
        onStepThread={handleStep}
      />
    );

    // Click Thread B card
    fireEvent.click(screen.getByText('Thread B'));
    expect(handleSelect).toHaveBeenCalledWith('thread-b');

    // Click Step button on Thread A
    const stepButtons = screen.getAllByRole('button', { name: /Step/i });
    fireEvent.click(stepButtons[0]);
    expect(handleStep).toHaveBeenCalledWith('thread-a');
  });
});
