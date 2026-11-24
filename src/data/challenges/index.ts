import type { Instruction } from '../../engine';
import type { ChallengeDefinition } from './types';

export * from './types';

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'mission-01',
    missionNumber: '01',
    title: 'The Lost Update',
    tier: 'Beginner',
    estimatedDuration: '5 mins',
    concept: 'Race Conditions',
    shortDescription:
      'Reproduce a race condition causing two concurrent increments to result in 1 instead of 2.',
    objective:
      'Interleave Thread A and Thread B such that counter final value becomes 1 and a data race is detected.',
    threadCount: 2,
    optimalSteps: 6,
    initialSharedMemory: { counter: 0 },
    initialThreads: [
      {
        id: 'thread-a',
        name: 'Thread A',
        instructions: [
          { op: 'READ', source: 'counter', target: 'a' },
          { op: 'ADD', target: 'a', value: 1 },
          { op: 'WRITE', target: 'counter', source: 'a' },
        ],
        programCounter: 0,
        localMemory: { a: 0 },
        status: 'READY',
        clock: { values: {} },
        color: 'thread-a',
      },
      {
        id: 'thread-b',
        name: 'Thread B',
        instructions: [
          { op: 'READ', source: 'counter', target: 'b' },
          { op: 'ADD', target: 'b', value: 1 },
          { op: 'WRITE', target: 'counter', source: 'b' },
        ],
        programCounter: 0,
        localMemory: { b: 0 },
        status: 'READY',
        clock: { values: {} },
        color: 'thread-b',
      },
    ],
    initialMutexes: [],
    hints: [
      {
        id: 'm1-h1',
        tier: 1,
        title: 'Concurrent Reads',
        content:
          'What happens if both threads read the initial value of counter before either writes back its update?',
        costPenalty: 150,
      },
      {
        id: 'm1-h2',
        tier: 2,
        title: 'Switching Execution',
        content:
          'In MANUAL scheduler mode, step Thread A once (READ). Then switch to Thread B and step it once (READ). Both threads now hold local value 0!',
        costPenalty: 150,
      },
      {
        id: 'm1-h3',
        tier: 3,
        title: 'Exact Sequence',
        content:
          'Execute: A:READ, B:READ, A:ADD, B:ADD, A:WRITE, B:WRITE. Thread B’s write overwrites Thread A’s update, resulting in counter = 1 and a data race!',
        costPenalty: 150,
      },
    ],
    explanation:
      'A Lost Update occurs when two threads read the same shared state concurrently, perform local computations, and write back without synchronization. The second write completely obliterates the modifications made by the first write.',
    evaluateSuccess: (state) => {
      const isCompleted = state.status === 'COMPLETED';
      const counterVal = state.sharedMemory.counter;
      const racesFound = state.activeRaces.length;

      if (!isCompleted) {
        return {
          isSuccess: false,
          reason: 'Both threads must complete execution to evaluate the final counter value.',
        };
      }
      if (counterVal === 1 && racesFound > 0) {
        return {
          isSuccess: true,
          reason:
            'Success! You reproduced the Lost Update anomaly: two concurrent increments yielded counter = 1 and triggered a data race.',
          metrics: {
            targetAchieved: true,
            racesFound,
            deadlockFound: false,
            finalSharedMemory: state.sharedMemory,
          },
        };
      }
      if (counterVal === 2) {
        return {
          isSuccess: false,
          reason:
            'Counter evaluated to 2. The updates were applied sequentially without a lost update. Try interleaving their read/write instructions.',
        };
      }
      return {
        isSuccess: false,
        reason: `Expected final counter = 1 with active data races, but counter is ${counterVal} with ${racesFound} races.`,
      };
    },
  },
  {
    id: 'mission-02',
    missionNumber: '02',
    title: 'Banking Disaster',
    tier: 'Intermediate',
    estimatedDuration: '10 mins',
    concept: 'Check-Then-Act Conflicts',
    shortDescription:
      'Investigate concurrent deposit and withdrawal operations corrupting account balances.',
    objective:
      'Cause an inconsistent bank account balance (different from $120) through unsynchronized reads and writes.',
    threadCount: 2,
    optimalSteps: 6,
    initialSharedMemory: { balance: 100 },
    initialThreads: [
      {
        id: 'thread-deposit',
        name: 'Depositor',
        instructions: [
          { op: 'READ', source: 'balance', target: 'dep' },
          { op: 'ADD', target: 'dep', value: 50 },
          { op: 'WRITE', target: 'balance', source: 'dep' },
        ],
        programCounter: 0,
        localMemory: { dep: 0 },
        status: 'READY',
        clock: { values: {} },
        color: 'thread-a',
      },
      {
        id: 'thread-withdraw',
        name: 'Withdrawer',
        instructions: [
          { op: 'READ', source: 'balance', target: 'wdl' },
          { op: 'ADD', target: 'wdl', value: -30 },
          { op: 'WRITE', target: 'balance', source: 'wdl' },
        ],
        programCounter: 0,
        localMemory: { wdl: 0 },
        status: 'READY',
        clock: { values: {} },
        color: 'thread-b',
      },
    ],
    initialMutexes: [],
    hints: [
      {
        id: 'm2-h1',
        tier: 1,
        title: 'Initial Balance Overwrite',
        content:
          'Starting balance is $100. Depositor wants to add $50 ($150). Withdrawer wants to subtract $30 ($70). Expected final balance is $120.',
        costPenalty: 150,
      },
      {
        id: 'm2-h2',
        tier: 2,
        title: 'Stale Read Interleaving',
        content:
          'Let Depositor READ balance (100). Before Depositor writes, let Withdrawer READ balance (100). Whichever writes last wins!',
        costPenalty: 150,
      },
      {
        id: 'm2-h3',
        tier: 3,
        title: 'Exact Sequence',
        content:
          'Execute: Depositor READ, Withdrawer READ, Withdrawer ADD, Withdrawer WRITE (balance=70), Depositor ADD, Depositor WRITE (balance=150). Withdrawal lost!',
        costPenalty: 150,
      },
    ],
    explanation:
      'In financial transactions without locks or ACID isolation, read-modify-write sequences are vulnerable to dirty reads and lost updates. The Withdrawer’s debit was completely wiped out by Depositor’s blind write.',
    evaluateSuccess: (state) => {
      const isCompleted = state.status === 'COMPLETED';
      const balance = state.sharedMemory.balance;
      const racesFound = state.activeRaces.length;

      if (!isCompleted) {
        return {
          isSuccess: false,
          reason: 'Both transaction threads must complete to evaluate account balance consistency.',
        };
      }
      if (balance !== 120 && racesFound > 0) {
        return {
          isSuccess: true,
          reason: `Success! You exposed the Banking Disaster: unsynchronized balance read/write produced an inconsistent balance of $${balance} instead of $120.`,
          metrics: {
            targetAchieved: true,
            racesFound,
            deadlockFound: false,
            finalSharedMemory: state.sharedMemory,
          },
        };
      }
      return {
        isSuccess: false,
        reason:
          'The account balance resolved to the expected $120. Interleave the reads and writes so one transaction overwrites the other.',
      };
    },
  },
  {
    id: 'mission-03',
    missionNumber: '03',
    title: 'Mutex Rescue',
    tier: 'Intermediate',
    estimatedDuration: '10 mins',
    concept: 'Mutual Exclusion',
    shortDescription: 'Fix the banking race condition using mutex synchronization locks.',
    objective: 'Safely guard the critical section so all updates complete with zero data races.',
    threadCount: 2,
    optimalSteps: 10,
    initialSharedMemory: { balance: 100 },
    initialThreads: [
      {
        id: 'thread-deposit',
        name: 'Depositor',
        instructions: [
          { op: 'LOCK', mutexId: 'vault_mutex' },
          { op: 'READ', source: 'balance', target: 'dep' },
          { op: 'ADD', target: 'dep', value: 50 },
          { op: 'WRITE', target: 'balance', source: 'dep' },
          { op: 'UNLOCK', mutexId: 'vault_mutex' },
        ],
        programCounter: 0,
        localMemory: { dep: 0 },
        status: 'READY',
        clock: { values: {} },
        color: 'thread-a',
      },
      {
        id: 'thread-withdraw',
        name: 'Withdrawer',
        instructions: [
          { op: 'LOCK', mutexId: 'vault_mutex' },
          { op: 'READ', source: 'balance', target: 'wdl' },
          { op: 'ADD', target: 'wdl', value: -30 },
          { op: 'WRITE', target: 'balance', source: 'wdl' },
          { op: 'UNLOCK', mutexId: 'vault_mutex' },
        ],
        programCounter: 0,
        localMemory: { wdl: 0 },
        status: 'READY',
        clock: { values: {} },
        color: 'thread-b',
      },
    ],
    initialMutexes: [
      {
        id: 'vault_mutex',
        owner: null,
        waitingQueue: [],
        releaseClock: { values: {} },
      },
    ],
    hints: [
      {
        id: 'm3-h1',
        tier: 1,
        title: 'Critical Section Protection',
        content:
          'Both threads now possess LOCK and UNLOCK instructions wrapping their balance modifications.',
        costPenalty: 150,
      },
      {
        id: 'm3-h2',
        tier: 2,
        title: 'Lock Contention and Blocking',
        content:
          'If Depositor holds vault_mutex, Withdrawer will become BLOCKED if it executes LOCK. Once Depositor UNLOCKs, Withdrawer wakes up.',
        costPenalty: 150,
      },
      {
        id: 'm3-h3',
        tier: 3,
        title: 'Run to Completion',
        content:
          'Step all instructions through either in Round Robin or Manual mode. The mutex ensures vector clocks propagate happens-before ordering, leaving balance = 120 and 0 races.',
        costPenalty: 150,
      },
    ],
    explanation:
      'Mutual exclusion creates a synchronized happens-before relationship between the unlocking thread and the acquiring thread. The vector clocks merge, preventing conflicting accesses from being concurrent.',
    evaluateSuccess: (state) => {
      const isCompleted = state.status === 'COMPLETED';
      const balance = state.sharedMemory.balance;
      const racesFound = state.activeRaces.length;

      if (!isCompleted) {
        return {
          isSuccess: false,
          reason: 'All transactions must complete under mutex protection.',
        };
      }
      if (balance === 120 && racesFound === 0) {
        return {
          isSuccess: true,
          reason:
            'Success! The critical sections were serialized with vault_mutex. Final balance is correctly $120 with zero data races.',
          metrics: {
            targetAchieved: true,
            racesFound: 0,
            deadlockFound: false,
            finalSharedMemory: state.sharedMemory,
          },
        };
      }
      return {
        isSuccess: false,
        reason: `Balance is $${balance} with ${racesFound} races. Ensure each transaction acquires and releases vault_mutex properly.`,
      };
    },
  },
  {
    id: 'mission-04',
    missionNumber: '04',
    title: 'Deadlock City',
    tier: 'Advanced',
    estimatedDuration: '15 mins',
    concept: 'Circular Wait & Deadlocks',
    shortDescription: 'Investigate two threads waiting indefinitely for locks held by one another.',
    objective: 'Reproduce a circular lock dependency cycle (Alpha → Beta → Alpha).',
    threadCount: 2,
    optimalSteps: 4,
    initialSharedMemory: { resourceA: 1, resourceB: 1 },
    initialThreads: [
      {
        id: 'thread-alpha',
        name: 'Thread Alpha',
        instructions: [
          { op: 'LOCK', mutexId: 'mutex_x' },
          { op: 'LOCK', mutexId: 'mutex_y' },
          { op: 'UNLOCK', mutexId: 'mutex_y' },
          { op: 'UNLOCK', mutexId: 'mutex_x' },
        ],
        programCounter: 0,
        localMemory: {},
        status: 'READY',
        clock: { values: {} },
        color: 'thread-a',
      },
      {
        id: 'thread-beta',
        name: 'Thread Beta',
        instructions: [
          { op: 'LOCK', mutexId: 'mutex_y' },
          { op: 'LOCK', mutexId: 'mutex_x' },
          { op: 'UNLOCK', mutexId: 'mutex_x' },
          { op: 'UNLOCK', mutexId: 'mutex_y' },
        ],
        programCounter: 0,
        localMemory: {},
        status: 'READY',
        clock: { values: {} },
        color: 'thread-b',
      },
    ],
    initialMutexes: [
      {
        id: 'mutex_x',
        owner: null,
        waitingQueue: [],
        releaseClock: { values: {} },
      },
      {
        id: 'mutex_y',
        owner: null,
        waitingQueue: [],
        releaseClock: { values: {} },
      },
    ],
    hints: [
      {
        id: 'm4-h1',
        tier: 1,
        title: 'Coffman Conditions',
        content:
          'A deadlock requires hold-and-wait and circular wait: each thread must acquire one lock, then request the lock held by the other.',
        costPenalty: 150,
      },
      {
        id: 'm4-h2',
        tier: 2,
        title: 'Step Alternation',
        content:
          'Step Alpha once to acquire mutex_x. Do not let Alpha step again! Switch to Beta and step it to acquire mutex_y.',
        costPenalty: 150,
      },
      {
        id: 'm4-h3',
        tier: 3,
        title: 'Triggering the Cycle',
        content:
          'With Alpha holding mutex_x and Beta holding mutex_y, step Alpha (it blocks on mutex_y). Then step Beta (it blocks on mutex_x). Deadlock cycle formed!',
        costPenalty: 150,
      },
    ],
    explanation:
      'Deadlock occurs when two or more threads form a cycle in the wait-for graph. Here, Alpha holds mutex_x and waits for mutex_y, while Beta holds mutex_y and waits for mutex_x. Neither can ever proceed.',
    evaluateSuccess: (state) => {
      const isDeadlocked = state.status === 'DEADLOCKED';
      const deadlock = state.activeDeadlock;

      if (isDeadlocked && deadlock && deadlock.cycle.length >= 2) {
        return {
          isSuccess: true,
          reason: `Success! Deadlock cycle detected (${deadlock.cycle.join(' → ')}). Both threads are permanently blocked waiting for locks held by each other.`,
          metrics: {
            targetAchieved: true,
            racesFound: state.activeRaces.length,
            deadlockFound: true,
            finalSharedMemory: state.sharedMemory,
          },
        };
      }
      return {
        isSuccess: false,
        reason:
          'The system is not deadlocked. Step Thread Alpha to acquire mutex_x, then step Thread Beta to acquire mutex_y before either acquires their second lock.',
      };
    },
  },
  {
    id: 'mission-05',
    missionNumber: '05',
    title: 'Semaphore Bridge',
    tier: 'Advanced',
    estimatedDuration: '15 mins',
    concept: 'Capacity & Counting Locks',
    shortDescription: 'Restrict concurrent access to a resource with limited capacity.',
    objective:
      'Coordinate 3 worker threads operating on bridge capacity, triggering concurrent data races and capacity conflict.',
    threadCount: 3,
    optimalSteps: 9,
    initialSharedMemory: { bridgeSlots: 2 },
    initialThreads: [
      {
        id: 'car-1',
        name: 'Vehicle 1',
        instructions: [
          { op: 'READ', source: 'bridgeSlots', target: 'slots' },
          { op: 'ADD', target: 'slots', value: -1 },
          { op: 'WRITE', target: 'bridgeSlots', source: 'slots' },
        ],
        programCounter: 0,
        localMemory: { slots: 0 },
        status: 'READY',
        clock: { values: {} },
        color: 'thread-a',
      },
      {
        id: 'car-2',
        name: 'Vehicle 2',
        instructions: [
          { op: 'READ', source: 'bridgeSlots', target: 'slots' },
          { op: 'ADD', target: 'slots', value: -1 },
          { op: 'WRITE', target: 'bridgeSlots', source: 'slots' },
        ],
        programCounter: 0,
        localMemory: { slots: 0 },
        status: 'READY',
        clock: { values: {} },
        color: 'thread-b',
      },
      {
        id: 'car-3',
        name: 'Vehicle 3',
        instructions: [
          { op: 'READ', source: 'bridgeSlots', target: 'slots' },
          { op: 'ADD', target: 'slots', value: -1 },
          { op: 'WRITE', target: 'bridgeSlots', source: 'slots' },
        ],
        programCounter: 0,
        localMemory: { slots: 0 },
        status: 'READY',
        clock: { values: {} },
        color: 'thread-c',
      },
    ],
    initialMutexes: [],
    hints: [
      {
        id: 'm5-h1',
        tier: 1,
        title: '3-Way Contention',
        content:
          'Three vehicles each attempt to claim a bridge slot from bridgeSlots = 2 without synchronization.',
        costPenalty: 150,
      },
      {
        id: 'm5-h2',
        tier: 2,
        title: 'Concurrent Entry',
        content:
          'If Vehicle 1, Vehicle 2, and Vehicle 3 all execute READ bridgeSlots before any vehicle writes, each reads 2!',
        costPenalty: 150,
      },
      {
        id: 'm5-h3',
        tier: 3,
        title: 'All Reads First',
        content:
          'Execute: Car 1 READ, Car 2 READ, Car 3 READ. Then step their ADD and WRITE instructions. Multiple data races will be flagged.',
        costPenalty: 150,
      },
    ],
    explanation:
      'Without semaphore or mutex capacity synchronization, resource counters can underflow or suffer multiple lost updates when multiple threads read stale capacity values before committing decrements.',
    evaluateSuccess: (state) => {
      const isCompleted = state.status === 'COMPLETED';
      const racesFound = state.activeRaces.length;
      const bridgeSlots = state.sharedMemory.bridgeSlots;

      if (!isCompleted) {
        return {
          isSuccess: false,
          reason: 'All three vehicles must execute their crossing instructions.',
        };
      }
      if (racesFound > 0) {
        return {
          isSuccess: true,
          reason: `Success! Capacity race condition exposed: 3 vehicles crossed simultaneously with no synchronization, triggering ${racesFound} data races and leaving bridgeSlots = ${bridgeSlots}.`,
          metrics: {
            targetAchieved: true,
            racesFound,
            deadlockFound: false,
            finalSharedMemory: state.sharedMemory,
          },
        };
      }
      return {
        isSuccess: false,
        reason:
          'No concurrent access conflicts detected. Interleave vehicle read operations before their write operations.',
      };
    },
  },
];

export function formatInstructionText(inst: Instruction): string {
  switch (inst.op) {
    case 'READ':
      return `READ ${inst.source} INTO ${inst.target}`;
    case 'ADD':
      return `ADD ${inst.target} BY ${inst.value}`;
    case 'WRITE':
      return `WRITE ${inst.source} INTO ${inst.target}`;
    case 'LOCK':
      return `LOCK ${inst.mutexId}`;
    case 'UNLOCK':
      return `UNLOCK ${inst.mutexId}`;
  }
}
