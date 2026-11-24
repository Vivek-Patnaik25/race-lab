import { create } from 'zustand';
import type { Instruction, MutexState, SchedulerMode, ThreadState } from '../engine';
import {
  type CustomScenarioDefinition,
  validateCustomScenario,
} from '../engine/scenarios/scenario-validator';
import { parseInstructionLines } from '../engine/scenarios/scenario-parser';

export interface LabThreadConfig {
  id: string;
  name: string;
  color: 'thread-a' | 'thread-b' | 'thread-c';
  instructions: Instruction[];
}

export interface LabState {
  title: string;
  schedulerMode: SchedulerMode;
  sharedMemory: Record<string, number>;
  mutexes: string[];
  threads: LabThreadConfig[];
  selectedThreadId: string;
  validationErrors: string[];

  // Actions
  setTitle: (title: string) => void;
  setSchedulerMode: (mode: SchedulerMode) => void;
  setSelectedThreadId: (id: string) => void;
  addSharedVariable: (name: string, value: number) => void;
  removeSharedVariable: (name: string) => void;
  updateSharedVariable: (name: string, value: number) => void;
  addMutex: (id: string) => void;
  removeMutex: (id: string) => void;
  addThread: (name?: string) => void;
  removeThread: (id: string) => void;
  updateThreadName: (id: string, name: string) => void;
  updateThreadColor: (id: string, color: 'thread-a' | 'thread-b' | 'thread-c') => void;
  addInstruction: (threadId: string, instruction: Instruction) => void;
  removeInstruction: (threadId: string, index: number) => void;
  updateInstruction: (threadId: string, index: number, instruction: Instruction) => void;
  setThreadInstructionsFromText: (threadId: string, text: string) => boolean;
  validate: () => boolean;
  loadPreset: (presetKey: 'lost-update' | 'deadlock' | 'mutex-rescue' | 'empty') => void;
  loadScenario: (scenario: CustomScenarioDefinition) => void;
  getCustomScenarioDefinition: () => CustomScenarioDefinition;
  getExecutableState: () => {
    threads: ThreadState[];
    sharedMemory: Record<string, number>;
    mutexes: MutexState[];
  };
}

const DEFAULT_THREADS: LabThreadConfig[] = [
  {
    id: 'thread-1',
    name: 'Thread 1',
    color: 'thread-a',
    instructions: [
      { op: 'READ', source: 'counter', target: 'a' },
      { op: 'ADD', target: 'a', value: 1 },
      { op: 'WRITE', source: 'a', target: 'counter' },
    ],
  },
  {
    id: 'thread-2',
    name: 'Thread 2',
    color: 'thread-b',
    instructions: [
      { op: 'READ', source: 'counter', target: 'b' },
      { op: 'ADD', target: 'b', value: 1 },
      { op: 'WRITE', source: 'b', target: 'counter' },
    ],
  },
];

export const useLabStore = create<LabState>((set, get) => ({
  title: 'Lost Update Experiment',
  schedulerMode: 'MANUAL',
  sharedMemory: { counter: 0 },
  mutexes: ['mutex_1'],
  threads: DEFAULT_THREADS,
  selectedThreadId: 'thread-1',
  validationErrors: [],

  setTitle: (title) => set({ title }),
  setSchedulerMode: (schedulerMode) => set({ schedulerMode }),
  setSelectedThreadId: (selectedThreadId) => set({ selectedThreadId }),

  addSharedVariable: (name, value) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => ({
      sharedMemory: { ...state.sharedMemory, [trimmed]: value },
    }));
    get().validate();
  },

  removeSharedVariable: (name) => {
    set((state) => {
      const copy = { ...state.sharedMemory };
      delete copy[name];
      return { sharedMemory: copy };
    });
    get().validate();
  },

  updateSharedVariable: (name, value) => {
    set((state) => ({
      sharedMemory: { ...state.sharedMemory, [name]: value },
    }));
  },

  addMutex: (id) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.mutexes.includes(trimmed)) return state;
      return { mutexes: [...state.mutexes, trimmed] };
    });
    get().validate();
  },

  removeMutex: (id) => {
    set((state) => ({
      mutexes: state.mutexes.filter((m) => m !== id),
    }));
    get().validate();
  },

  addThread: (name) => {
    set((state) => {
      const idx = state.threads.length + 1;
      const newId = `thread-${Date.now().toString(36)}-${idx}`;
      const colorOptions: Array<'thread-a' | 'thread-b' | 'thread-c'> = [
        'thread-a',
        'thread-b',
        'thread-c',
      ];
      const assignedColor = colorOptions[state.threads.length % colorOptions.length];

      const newThread: LabThreadConfig = {
        id: newId,
        name: name || `Thread ${idx}`,
        color: assignedColor,
        instructions: [
          { op: 'READ', source: Object.keys(state.sharedMemory)[0] || 'counter', target: 'reg' },
          { op: 'ADD', target: 'reg', value: 1 },
          { op: 'WRITE', source: 'reg', target: Object.keys(state.sharedMemory)[0] || 'counter' },
        ],
      };

      return {
        threads: [...state.threads, newThread],
        selectedThreadId: newId,
      };
    });
    get().validate();
  },

  removeThread: (id) => {
    set((state) => {
      if (state.threads.length <= 1) return state; // Must keep at least 1 thread
      const remaining = state.threads.filter((t) => t.id !== id);
      return {
        threads: remaining,
        selectedThreadId: remaining[0].id,
      };
    });
    get().validate();
  },

  updateThreadName: (id, name) => {
    set((state) => ({
      threads: state.threads.map((t) => (t.id === id ? { ...t, name } : t)),
    }));
    get().validate();
  },

  updateThreadColor: (id, color) => {
    set((state) => ({
      threads: state.threads.map((t) => (t.id === id ? { ...t, color } : t)),
    }));
  },

  addInstruction: (threadId, instruction) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, instructions: [...t.instructions, instruction] } : t
      ),
    }));
    get().validate();
  },

  removeInstruction: (threadId, index) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, instructions: t.instructions.filter((_, i) => i !== index) } : t
      ),
    }));
    get().validate();
  },

  updateInstruction: (threadId, index, instruction) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              instructions: t.instructions.map((inst, i) => (i === index ? instruction : inst)),
            }
          : t
      ),
    }));
    get().validate();
  },

  setThreadInstructionsFromText: (threadId, text) => {
    const parseRes = parseInstructionLines(text);
    if (parseRes.errors.length > 0) {
      set({
        validationErrors: parseRes.errors.map(
          (e) => `Thread syntax line ${e.line}: ${e.error} ("${e.raw}")`
        ),
      });
      return false;
    }

    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, instructions: parseRes.instructions } : t
      ),
      validationErrors: [],
    }));

    return get().validate();
  },

  validate: () => {
    const definition = get().getCustomScenarioDefinition();
    const result = validateCustomScenario(definition);
    set({ validationErrors: result.errors });
    return result.valid;
  },

  loadPreset: (presetKey) => {
    switch (presetKey) {
      case 'lost-update':
        set({
          title: 'Lost Update Anomaly',
          schedulerMode: 'MANUAL',
          sharedMemory: { counter: 0 },
          mutexes: [],
          threads: [
            {
              id: 'thread-a',
              name: 'Thread A',
              color: 'thread-a',
              instructions: [
                { op: 'READ', source: 'counter', target: 'a' },
                { op: 'ADD', target: 'a', value: 1 },
                { op: 'WRITE', source: 'a', target: 'counter' },
              ],
            },
            {
              id: 'thread-b',
              name: 'Thread B',
              color: 'thread-b',
              instructions: [
                { op: 'READ', source: 'counter', target: 'b' },
                { op: 'ADD', target: 'b', value: 1 },
                { op: 'WRITE', source: 'b', target: 'counter' },
              ],
            },
          ],
          selectedThreadId: 'thread-a',
          validationErrors: [],
        });
        break;

      case 'mutex-rescue':
        set({
          title: 'Mutex Synchronization Guard',
          schedulerMode: 'MANUAL',
          sharedMemory: { counter: 0 },
          mutexes: ['guard_lock'],
          threads: [
            {
              id: 'thread-a',
              name: 'Thread A',
              color: 'thread-a',
              instructions: [
                { op: 'LOCK', mutexId: 'guard_lock' },
                { op: 'READ', source: 'counter', target: 'a' },
                { op: 'ADD', target: 'a', value: 1 },
                { op: 'WRITE', source: 'a', target: 'counter' },
                { op: 'UNLOCK', mutexId: 'guard_lock' },
              ],
            },
            {
              id: 'thread-b',
              name: 'Thread B',
              color: 'thread-b',
              instructions: [
                { op: 'LOCK', mutexId: 'guard_lock' },
                { op: 'READ', source: 'counter', target: 'b' },
                { op: 'ADD', target: 'b', value: 1 },
                { op: 'WRITE', source: 'b', target: 'counter' },
                { op: 'UNLOCK', mutexId: 'guard_lock' },
              ],
            },
          ],
          selectedThreadId: 'thread-a',
          validationErrors: [],
        });
        break;

      case 'deadlock':
        set({
          title: 'Circular Wait Deadlock Cycle',
          schedulerMode: 'MANUAL',
          sharedMemory: { res1: 1, res2: 1 },
          mutexes: ['lock_x', 'lock_y'],
          threads: [
            {
              id: 'worker-1',
              name: 'Worker Alpha',
              color: 'thread-a',
              instructions: [
                { op: 'LOCK', mutexId: 'lock_x' },
                { op: 'LOCK', mutexId: 'lock_y' },
                { op: 'UNLOCK', mutexId: 'lock_y' },
                { op: 'UNLOCK', mutexId: 'lock_x' },
              ],
            },
            {
              id: 'worker-2',
              name: 'Worker Beta',
              color: 'thread-b',
              instructions: [
                { op: 'LOCK', mutexId: 'lock_y' },
                { op: 'LOCK', mutexId: 'lock_x' },
                { op: 'UNLOCK', mutexId: 'lock_x' },
                { op: 'UNLOCK', mutexId: 'lock_y' },
              ],
            },
          ],
          selectedThreadId: 'worker-1',
          validationErrors: [],
        });
        break;

      case 'empty':
        set({
          title: 'Blank Canvas',
          schedulerMode: 'MANUAL',
          sharedMemory: { data: 0 },
          mutexes: [],
          threads: [
            {
              id: 'main-thread',
              name: 'Main Thread',
              color: 'thread-a',
              instructions: [
                { op: 'READ', source: 'data', target: 'x' },
                { op: 'ADD', target: 'x', value: 10 },
                { op: 'WRITE', source: 'x', target: 'data' },
              ],
            },
          ],
          selectedThreadId: 'main-thread',
          validationErrors: [],
        });
        break;
    }
  },

  loadScenario: (scenario) => {
    const threadConfigs: LabThreadConfig[] = (scenario.threads || []).map((t, i) => ({
      id: t.id || `thread-${i + 1}`,
      name: t.name || `Thread ${i + 1}`,
      color: t.color || (i === 0 ? 'thread-a' : i === 1 ? 'thread-b' : 'thread-c'),
      instructions: t.instructions || [],
    }));

    set({
      title: scenario.title || 'Imported Scenario',
      schedulerMode: scenario.schedulerMode || 'MANUAL',
      sharedMemory: scenario.sharedMemory || {},
      mutexes: (scenario.mutexes || []).map((m) => m.id),
      threads: threadConfigs,
      selectedThreadId: threadConfigs[0]?.id || '',
      validationErrors: [],
    });

    get().validate();
  },

  getCustomScenarioDefinition: () => {
    const state = get();
    return {
      title: state.title,
      schedulerMode: state.schedulerMode,
      sharedMemory: state.sharedMemory,
      mutexes: state.mutexes.map((id) => ({ id })),
      threads: state.threads.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        instructions: t.instructions,
      })),
    };
  },

  getExecutableState: () => {
    const state = get();
    const threads: ThreadState[] = state.threads.map((t) => ({
      id: t.id,
      name: t.name,
      instructions: t.instructions,
      programCounter: 0,
      localMemory: {},
      status: 'READY',
      clock: { values: {} },
      color: t.color,
    }));

    const mutexes: MutexState[] = state.mutexes.map((mId) => ({
      id: mId,
      owner: null,
      waitingQueue: [],
      releaseClock: { values: {} },
    }));

    return {
      threads,
      sharedMemory: state.sharedMemory,
      mutexes,
    };
  },
}));
