export interface ConceptSection {
  title: string;
  content: string;
  formula?: string;
  takeaways?: string[];
}

export interface ConceptDefinition {
  slug: string;
  title: string;
  category: 'Fundamentals' | 'Synchronization' | 'Pitfalls' | 'Theory';
  summary: string;
  readTime: string;
  relatedMissionId?: string;
  interactiveType:
    | 'race-demo'
    | 'mutex-demo'
    | 'semaphore-demo'
    | 'deadlock-demo'
    | 'starvation-demo'
    | 'scheduler-demo'
    | 'vector-clock-demo';
  sections: ConceptSection[];
}

export const CONCEPTS: ConceptDefinition[] = [
  {
    slug: 'race-conditions',
    title: 'Data Races & Race Conditions',
    category: 'Pitfalls',
    summary:
      'When multiple threads concurrently access shared memory without synchronization and at least one access is a write.',
    readTime: '5 min read',
    relatedMissionId: 'mission-01',
    interactiveType: 'race-demo',
    sections: [
      {
        title: 'Formal Definition of a Data Race',
        content:
          'A data race occurs in a program when two or more concurrent memory accesses touch the same shared memory location, originate from distinct threads, at least one access is a write operation, and no happens-before relationship orders them. If both operations are reads, no data race exists.',
        formula:
          'e_1 \\not\\le_{HB} e_2 \\quad \\land \\quad e_2 \\not\\le_{HB} e_1 \\quad \\land \\quad (\\text{type}(e_1) = W \\lor \\text{type}(e_2) = W)',
        takeaways: [
          'Read/Read operations never conflict or race.',
          'Read/Write conflicts cause dirty reads and stale computations.',
          'Write/Write conflicts cause lost updates and corrupted state.',
        ],
      },
      {
        title: 'The Lost Update Anomaly',
        content:
          'Consider two threads concurrently incrementing a shared counter initialized to 0. If Thread A reads 0, and Thread B reads 0 before Thread A writes back, both threads calculate 0 + 1 = 1. The second write completely overwrites the first, losing an entire transaction.',
        takeaways: [
          'Hardware CPU cores execute instructions non-atomically unless explicit atomic or locking primitives are used.',
          'Compilers and processors may reorder independent memory operations, widening race windows.',
        ],
      },
    ],
  },
  {
    slug: 'mutexes',
    title: 'Mutual Exclusion & Locks',
    category: 'Synchronization',
    summary:
      'Guaranteeing that only a single thread can enter a critical section at any given moment.',
    readTime: '6 min read',
    relatedMissionId: 'mission-03',
    interactiveType: 'mutex-demo',
    sections: [
      {
        title: 'The Critical Section Problem',
        content:
          'A critical section is a sequence of instructions accessing shared resources that must not be executed concurrently by multiple threads. A mutex (mutual exclusion lock) provides two fundamental primitives: LOCK (acquire) and UNLOCK (release).',
        formula:
          'L_{\\text{owner}} \\in \\{ \\text{null}, T_i \\}, \\quad \\forall j \\ne i: T_j \\text{ is BLOCKED until UNLOCK}',
        takeaways: [
          'Only the current owning thread is permitted to release a mutex.',
          'Attempting to acquire an occupied mutex blocks the requesting thread.',
          'Fair FIFO waiting queues prevent thread barging and starvation.',
        ],
      },
      {
        title: 'Memory Synchronization & Vector Clocks',
        content:
          'Mutexes do more than block execution: they establish memory synchronization boundaries. When Thread A unlocks a mutex, it publishes its vector clock. When Thread B acquires that mutex, it merges the published release clock, establishing a causal happens-before order.',
        takeaways: [
          'Unlocking creates a release barrier; acquiring creates an acquire barrier.',
          'All writes performed before UNLOCK become visible to threads after LOCK.',
        ],
      },
    ],
  },
  {
    slug: 'happens-before',
    title: 'The Happens-Before Relationship & Vector Clocks',
    category: 'Theory',
    summary:
      'How vector clocks establish mathematical causal ordering across asynchronous concurrent threads.',
    readTime: '7 min read',
    relatedMissionId: 'mission-01',
    interactiveType: 'vector-clock-demo',
    sections: [
      {
        title: 'Lamport Causality & Vector Clocks',
        content:
          'In distributed and multithreaded systems, wall-clock timestamps are unreliable due to clock skew. Leslie Lamport introduced the happens-before partial order relation (<_HB). Vector clocks represent state as a vector V of logical timestamps for each thread.',
        formula: 'V_1 \\le V_2 \\iff \\forall k: V_1[k] \\le V_2[k]',
        takeaways: [
          'If V_1 <= V_2 and V_1 != V_2, then event 1 happened-before event 2.',
          'If neither V_1 <= V_2 nor V_2 <= V_1, events are truly concurrent (V_1 || V_2).',
          'Concurrency with conflicting memory access mathematically defines a data race.',
        ],
      },
      {
        title: 'Clock Merging on Synchronization',
        content:
          'Every local instruction advances a thread’s own clock index: V_t[t] += 1. When synchronization occurs (e.g. mutex handoff), the acquiring thread performs an element-wise maximum merge with the published release clock.',
        formula: 'V_t[k] \\leftarrow \\max(V_t[k], V_{\\text{release}}[k])',
        takeaways: [
          'Vector clocks grow monotonically and never decrease.',
          'Enables zero-false-positive data race detection.',
        ],
      },
    ],
  },
  {
    slug: 'deadlocks',
    title: 'Deadlocks & The Coffman Conditions',
    category: 'Pitfalls',
    summary:
      'When threads wait permanently in circular dependency graphs for resources owned by each other.',
    readTime: '6 min read',
    relatedMissionId: 'mission-04',
    interactiveType: 'deadlock-demo',
    sections: [
      {
        title: 'The Four Coffman Conditions',
        content:
          'A deadlock can occur if and only if all four Coffman conditions hold simultaneously in a system: 1. Mutual Exclusion (unsharable resources), 2. Hold and Wait (holding one lock while requesting another), 3. No Preemption (resources cannot be forcibly confiscated), 4. Circular Wait (a closed loop of threads waiting for locks held by the next).',
        formula:
          'G = (V, E) \\quad \\text{where } (T_A, T_B) \\in E \\iff T_A \\text{ waits for lock owned by } T_B',
        takeaways: [
          'Breaking any single Coffman condition renders deadlock impossible.',
          'A cycle in the directed wait-for graph indicates an unresolvable deadlock.',
        ],
      },
      {
        title: 'Prevention: Lock Ordering Protocols',
        content:
          'The most robust deadlock prevention technique in multithreaded programming is hierarchical lock ordering: always acquire locks in a globally defined, consistent sequence (e.g. always Mutex A before Mutex B).',
        takeaways: [
          'Strict lock ordering eliminates circular wait by construction.',
          'Deadlock detection algorithms use Depth-First Search (DFS) to detect graph cycles.',
        ],
      },
    ],
  },
  {
    slug: 'semaphores',
    title: 'Counting Semaphores & Capacity Guards',
    category: 'Synchronization',
    summary: 'Managing access to bounded capacity resources across multiple concurrent workers.',
    readTime: '5 min read',
    relatedMissionId: 'mission-05',
    interactiveType: 'semaphore-demo',
    sections: [
      {
        title: 'Dijkstra’s Semaphore Abstraction',
        content:
          'Introduced by Edsger Dijkstra, a counting semaphore maintains an integer permit counter S. P (wait / acquire) decrements S and blocks if S <= 0. V (signal / release) increments S and wakes up a waiting thread.',
        formula: 'S \\ge 0 \\quad (S_{\\text{initial}} = \\text{Capacity})',
        takeaways: [
          'A binary semaphore (S=1) acts like a mutex but has no ownership restriction.',
          'Counting semaphores model connection pools, bounded buffers, and rate limits.',
        ],
      },
      {
        title: 'Producer-Consumer Synchronization',
        content:
          'Semaphores are essential for coordinating bounded buffers: one semaphore tracks empty slots, while another tracks filled slots, preventing buffer overflow and underflow.',
        takeaways: [
          'Unlike mutexes, semaphores can be signaled by a thread that did not acquire them.',
          'Unsynchronized access to capacity counters causes lost updates.',
        ],
      },
    ],
  },
  {
    slug: 'starvation',
    title: 'Thread Starvation & Lock Fairness',
    category: 'Pitfalls',
    summary:
      'Why unfair locking policies cause perpetual thread starvation and how FIFO queues prevent it.',
    readTime: '5 min read',
    interactiveType: 'starvation-demo',
    sections: [
      {
        title: 'Starvation vs Deadlock',
        content:
          'Unlike deadlocked threads (which are permanently blocked and can never progress), a starved thread is theoretically capable of running but is continuously denied CPU or lock access by other competing threads.',
        takeaways: [
          'Deadlock is a permanent freeze; starvation is an unfair scheduling failure.',
          'Lock barging allows newly arriving threads to steal locks ahead of waiting threads.',
        ],
      },
      {
        title: 'FIFO Fair Queues',
        content:
          'RaceLab implements strict FIFO fairness: when an unlocked mutex becomes available, ownership passes directly to the thread at the head of the waiting queue, guaranteeing zero lock starvation.',
        takeaways: [
          'Fair locks slightly increase context switch overhead but eliminate starvation.',
          'Barging-enabled locks may offer higher throughput at the cost of unbounded tail latency.',
        ],
      },
    ],
  },
  {
    slug: 'schedulers',
    title: 'Operating System Schedulers & Interleavings',
    category: 'Fundamentals',
    summary:
      'How preemptive time-slicing and thread scheduling generate unpredictable instruction interleavings.',
    readTime: '6 min read',
    interactiveType: 'scheduler-demo',
    sections: [
      {
        title: 'Preemptive vs Cooperative Scheduling',
        content:
          'In cooperative scheduling, threads yield execution voluntarily. In modern preemptive multitasking OS kernels, a timer interrupt forces thread context switches at arbitrary instruction boundaries, exposing hidden race conditions.',
        takeaways: [
          'Concurreny bugs are non-deterministic because OS thread scheduling depends on external interrupts and load.',
          'RaceLab provides manual scheduling to reproduce bugs on demand.',
        ],
      },
      {
        title: 'Deterministic Reproducibility',
        content:
          'To debug concurrency, testing tools must be deterministic. RaceLab supports Round-Robin cyclic turns and Mulberry32 seeded pseudo-random scheduling, ensuring identical execution sequences across test runs.',
        takeaways: [
          'Deterministic schedulers enable 100% reproducible race conditions and time-travel debugging.',
          'Seeded random interleavings stress-test synchronization without non-deterministic flakiness.',
        ],
      },
    ],
  },
];
