import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutionTimeline } from '../../src/features/simulation/components/ExecutionTimeline';
import type { SimulationEvent, ThreadState, RaceReport } from '../../src/engine';

describe('Phase 2 Visual Simulator: ExecutionTimeline Component', () => {
  const dummyThreads: ThreadState[] = [
    {
      id: 'thread-a',
      name: 'Thread A',
      instructions: [{ op: 'READ', source: 'c', target: 'a' }],
      programCounter: 1,
      localMemory: {},
      status: 'COMPLETED',
      clock: { values: { 'thread-a': 1 } },
      color: 'thread-a',
    },
    {
      id: 'thread-b',
      name: 'Thread B',
      instructions: [{ op: 'WRITE', target: 'c', source: 'b' }],
      programCounter: 1,
      localMemory: {},
      status: 'COMPLETED',
      clock: { values: { 'thread-b': 1 } },
      color: 'thread-b',
    },
  ];

  const dummyEvents: SimulationEvent[] = [
    {
      step: 1,
      threadId: 'thread-a',
      instruction: { op: 'READ', source: 'c', target: 'a' },
      previousMemory: { c: 0 },
      resultingMemory: { c: 0 },
      previousThreadState: dummyThreads[0],
      resultingThreadState: dummyThreads[0],
      racesDetected: [],
      message: 'Thread A read c (0) into a',
    },
    {
      step: 2,
      threadId: 'thread-b',
      instruction: { op: 'WRITE', target: 'c', source: 'b' },
      previousMemory: { c: 0 },
      resultingMemory: { c: 1 },
      previousThreadState: dummyThreads[1],
      resultingThreadState: dummyThreads[1],
      racesDetected: [],
      message: 'Thread B wrote b (1) into c',
    },
  ];

  const dummyRaces: RaceReport[] = [
    {
      id: 'race-1',
      variable: 'c',
      threadA: 'thread-a',
      threadB: 'thread-b',
      accessTypeA: 'READ',
      accessTypeB: 'WRITE',
      stepA: 1,
      stepB: 2,
      explanation: 'Concurrent conflict on variable c',
    },
  ];

  it('renders lanes for each thread and step status banner', () => {
    render(
      <ExecutionTimeline
        threads={dummyThreads}
        currentStep={2}
        events={dummyEvents}
        activeRaces={dummyRaces}
        onSeekStep={vi.fn()}
      />
    );

    expect(screen.getByText('Thread A')).toBeInTheDocument();
    expect(screen.getByText('Thread B')).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Thread B wrote b/i)).toBeInTheDocument();
  });

  it('renders event node markers and allows clicking to seek in history', () => {
    const handleSeek = vi.fn();

    render(
      <ExecutionTimeline
        threads={dummyThreads}
        currentStep={2}
        events={dummyEvents}
        activeRaces={dummyRaces}
        onSeekStep={handleSeek}
      />
    );

    // Initial step 0 node
    const step0Button = screen.getAllByRole('button', { name: /Seek to Step 0/i })[0];
    fireEvent.click(step0Button);
    expect(handleSeek).toHaveBeenCalledWith(0);

    // Step 1 node (READ -> R)
    const step1Buttons = screen.getAllByRole('button', { name: /Step 1:/i });
    expect(step1Buttons.length).toBeGreaterThan(0);
    fireEvent.click(step1Buttons[0]);
    expect(handleSeek).toHaveBeenCalledWith(1);
  });
});
