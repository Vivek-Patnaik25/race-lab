# RaceLab Technical Architecture

## 1. System Overview

RaceLab is a local-first, interactive concurrency debugging environment and educational platform. It combines a deterministic simulation engine with a developer-tooling user interface.

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Presentation                │
│    (Landing, Dashboard, Challenges, Studio, Lab)       │
└───────────────────────────┬────────────────────────────┘
                            │ React Router v7 & UI Events
┌───────────────────────────▼────────────────────────────┐
│                    Zustand Stores                      │
│     (simulation-store, game-store, settings-store)     │
└───────────────────────────┬────────────────────────────┘
                            │ Dispatches stepping / schedules
┌───────────────────────────▼────────────────────────────┐
│              Deterministic Simulation Core             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Scheduler   │  │   Executor   │  │ Memory Model │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Mutex / Sync │  │ RaceDetector │  │DeadlockDetect│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ Immutable Event Log & Snapshots
┌───────────────────────────▼────────────────────────────┐
│          IndexedDB / LocalStorage Persistence          │
└────────────────────────────────────────────────────────┘
```

---

## 2. Layer Responsibilities & Strict Boundaries

### Layer 1: Presentation (React + TypeScript)

- Located in `src/features/` and `src/components/`.
- Renders responsive, dark developer-tooling panels, interleaving timelines, and thread inspectors.
- Subscribes to Zustand stores for reactive updates.
- **Rule:** Never implements instruction execution or race detection logic inside React components.

### Layer 2: State Management (Zustand)

- Located in `src/store/`.
- Manages application-level states: playback rate, active tab, user XP, unlocked achievements, and the current simulation snapshot.
- Coordinates stepping forward/backward by calling into the simulation engine.

### Layer 3: Simulation Core (`src/engine/`)

- A zero-dependency, pure TypeScript library.
- Completely decoupled from DOM APIs and UI frameworks.
- Manages thread program counters, vector clocks, mutex ownership queues, and memory access records.
- Generates immutable snapshots for history replay and time-travel debugging.

### Layer 4: Persistence (`src/services/`)

- Manages local persistence for progress, custom scenario definitions, and settings via browser `localStorage` and `IndexedDB`.
- No remote backend or tracking is required.

---

## 3. Technology Stack

- **Framework:** React 19 + TypeScript 5.7+
- **Bundler & Tooling:** Vite 6
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 with custom dark-palette design tokens
- **Icons:** Lucide React
- **Unit & Component Testing:** Vitest 3 + Testing Library + jsdom
- **End-to-End Testing:** Playwright
- **Code Quality:** ESLint (flat config) + Prettier

---

## 4. Simulation Engine Architecture (Phase 1 Implemented)

- **Vector Clock Causality (`src/engine/analysis/vector-clock.ts`):** Element-wise maximum merging, happens-before evaluation, and partial-order concurrency tests.
- **Fair FIFO Mutex (`src/engine/synchronization/mutex.ts`):** Prevents thread barging by prioritizing the head of the FIFO waiting queue and atomically passing published release clocks.
- **Happens-Before Race Detector (`src/engine/analysis/race-detector.ts`):** Mathematical validation ensuring read/read accesses never race while unordered concurrent writes generate structured diagnostic reports.
- **Wait-For Cycle Detection (`src/engine/analysis/deadlock-detector.ts`):** Directed graph DFS cycle detection identifying circular lock dependencies.
- **Execution History Manager (`src/engine/history/history.ts`):** Immutable step snapshots allowing forward/backward time-travel and deterministic replay.
- **Deterministic Schedulers (`src/engine/core/scheduler.ts`):** Manual selection, round-robin rotation, and Mulberry32 seeded pseudo-random interleaving.

---

## 5. Visual Simulator Architecture (Phase 2 Implemented)

Phase 2 connects the deterministic simulation engine to the presentation layer via a modular, high-density developer tooling interface:

### 1. Thread Explorer (`src/features/simulation/components/ThreadExplorer.tsx`)

- **Visual Thread Cards:** Per-thread status badge (`READY`, `BLOCKED`, `COMPLETED`), program counter tracking (`PC: x/n`), and vector clock vector inspection.
- **Instruction Stream:** Program view highlighting the currently scheduled instruction (`NEXT` badge or `WAIT` badge for blocked threads) with strike-through styling for past instructions.
- **Local Register Inspection:** Inspects thread-local registers (e.g. `a`, `b`, `t1`) and their current values in real time.
- **Blocked State Diagnostics:** Emits an amber/crimson diagnostic callout indicating which mutex is blocking the thread and which thread currently holds ownership.
- **Manual Stepping Action:** Enables direct, single-thread stepping when in `MANUAL` scheduler mode.

### 2. Interleaved Execution Timeline (`src/features/simulation/components/ExecutionTimeline.tsx`)

- **Multi-Lane Alignment:** Visual horizontal lanes for Thread A, Thread B, and Thread C, preserving spatial and chronological alignment across execution interleavings.
- **Operation Badges:** Discrete visual glyphs representing each instruction category:
  - `R` (Sky blue): `READ` operation
  - `W` (Emerald): `WRITE` operation
  - `L` (Amber): `LOCK` acquisition
  - `U` (Violet): `UNLOCK` release
  - `+` (Slate): Arithmetic (`ADD`)
- **Conflict Highlighting:** Execution steps participating in an active data race display a crimson halo and warning glyph (`!`).
- **Time-Travel Seeking:** Clicking any past or future step node instantly rewinds or advances the simulation state to that exact point in history.

### 3. Memory & Synchronization Inspector (`src/features/simulation/components/MemoryInspector.tsx`)

- **Shared Variables Table:** Displays variable names, current values, and memory access metadata with live value change indicators.
- **Mutex Table:** Displays lock status, current owning thread, FIFO waiting queue members, and published vector clocks.
- **Deadlock Cycle Warning:** Visually surfaces circular wait-for dependency chains (e.g. `thread-a → thread-b → thread-a`).
- **Data Race Diagnostics:** Integrates structured causality analysis for every detected data race condition.

### 4. Race Report Panel (`src/features/simulation/components/RaceReportPanel.tsx`)

- **Causal Conflict Analysis:** Shows conflicting threads, steps, and access types (e.g. `READ vs WRITE`).
- **Explanation & Remediation:** Actionable engineering recommendations to introduce mutex boundaries or synchronize critical sections.

### 5. Execution Controls (`src/features/simulation/components/ExecutionControls.tsx`)

- **Interactive Stepping:** Step forward, step backward (history rewind), toggle auto-play/pause, and reset.
- **Execution Speed:** Configurable playback speed (`0.5x`, `1x`, `2x`).
- **Scheduler Switcher:** Switch between `MANUAL` thread dispatch, `ROUND_ROBIN`, and `RANDOM` interleaving.

### 6. Simulation Studio Coordinator (`src/features/simulation/SimulationStudioPage.tsx`)

- Assembles all sub-panels into a responsive three-column workstation layout.
- Synchronizes with route parameters to load curated challenges (Mission 01 to Mission 05) or custom lab scenarios.

---

## 6. Challenge & Game Architecture (Phase 3 Implemented)

Phase 3 introduces the structured gamification and progression system:

### 1. Challenge Engine (`src/data/challenges/`)

- Five production-grade concurrency missions (The Lost Update, Banking Disaster, Mutex Rescue, Deadlock City, Semaphore Bridge).
- Strict, deterministic `evaluateSuccess(state, events)` verification checking memory invariants, thread completion, race reports, and deadlock cycles.
- Progressive 3-tier hint intel with score deductions.

### 2. Scoring Engine (`src/engine/scenarios/scoring.ts`)

- Pure TypeScript, framework-independent scoring computation.
- Mathematical determinism rewarding step efficiency and penalizing excessive hints.
- Output includes total score (clamped between 200 and 1500) and 1-3 star ratings.

### 3. Achievements Engine (`src/engine/scenarios/achievements.ts`)

- Eight engineering milestones (First Race, Time Traveler, Lock It Down, Chaos Controller, Deadlock Hunter, Bug Hunter, Perfectionist, Speed Demon).
- Real-time event evaluations coupled with non-intrusive UI unlock notifications (`AchievementToast.tsx`).

### 4. Local-First Persistence (`src/services/persistence/`)

- Versioned schema storing completed challenges, high scores, hint unlocks, achievements, and XP in `localStorage`.
- Includes schema migration safety and JSON export/import facilities.

---

## 7. Lab Mode & Scenario Engineering Architecture (Phase 4 Implemented)

Phase 4 enables open-ended simulation building, instruction parsing, and safe scenario sharing:

### 1. Scenario Parser & Formatter (`src/engine/scenarios/scenario-parser.ts`)

- Pure TypeScript lexer and parser translating human-readable assembly lines into typed `Instruction` records.
- Supports `READ <var> INTO <reg>`, `ADD <reg> BY <num>`, `WRITE <reg> INTO <var>`, `LOCK <mutex>`, `UNLOCK <mutex>`.
- Formatter reconstructs canonical assembly syntax for UI inspection and editing.

### 2. Strict Security & Scenario Validator (`src/engine/scenarios/scenario-validator.ts`)

- Pure-data validation ensuring zero arbitrary JavaScript execution (`eval`, `new Function`).
- Rejects undeclared mutexes, undefined shared memory reads, duplicate thread IDs, and malformed opcode structures before simulation initialization.

### 3. Scenario Serialization & Persistence (`src/services/export/index.ts`)

- Exports custom scenarios as clean JSON files (`racelab-<title>.json`).
- Validates imported JSON files against domain schemas with descriptive error reporting.

### 4. Lab Builder UI & State Coordinator (`src/features/lab/` & `src/store/lab-store.ts`)

- Full workstation UI supporting thread creation, color coding, inline instruction forms, and multi-line assembly text editing (`ThreadTextEditorModal`).
- Manages shared variables and mutex pools with live validation feedback.
- Seamless "Run in Studio" bridge translating custom scenarios directly into the Visual Simulator Studio (`/app/simulate/custom-lab`).

---

## 8. Learning Centre Architecture (Phase 5 Implemented)

Phase 5 delivers comprehensive educational guides and interactive mathematical sandboxes for all core concurrency topics:

### 1. Curated Concepts Data Model (`src/data/concepts/index.ts`)

- **Seven Core Topics:**
  1. `race-conditions`: Formal definition of data races, read/read non-conflict invariance, and lost update mechanics.
  2. `mutexes`: Mutual exclusion, critical section guarantees, FIFO waiting queues, and release clock publishing.
  3. `happens-before`: Lamport causality, partial orders, element-wise vector clock comparisons ($V_1 \le V_2$), and clock merging rules.
  4. `deadlocks`: The 4 Coffman conditions, directed wait-for graph cycle detection, and strict hierarchical lock ordering prevention.
  5. `semaphores`: Edsger Dijkstra's counting semaphore abstraction, bounded capacity guards, and $P()$ (wait) / $V()$ (signal) coordination.
  6. `starvation`: Thread starvation mechanics, unfair lock barging vulnerabilities, and strict FIFO queue fairness guarantees.
  7. `schedulers`: Preemptive operating system time-slicing vs cooperative yielding, and deterministic Mulberry32 PRNG scheduling.
- **Structured Sections:** Mathematical KaTeX formulas, detailed explanations, and bulleted engineering takeaways.
- **Deep Practice Links:** Direct routing to relevant missions (e.g. Mission 01, Mission 03, Mission 04, Mission 05).

### 2. Interactive Concept Sandboxes (`src/features/learning/components/`)

- **Vector Clock Comparator (`VectorClockWidget.tsx`):** Users configure $V_1$ and $V_2$ timestamps for Thread A and Thread B. Evaluates causal order ($V_1 < V_2$), identity ($V_1 = V_2$), or concurrency ($V_1 \parallel V_2$) in real time using engine vector clock utilities, with on-demand `mergeClocks` execution.
- **Race Condition Stepper (`RaceConditionWidget.tsx`):** Step-by-step 2-thread execution touching a shared counter. Demonstrates how concurrent interleaving of non-atomic read-modify-write sequences produces lost updates.
- **Mutex & FIFO Queue Explorer (`MutexWidget.tsx`):** Interactive lock/unlock primitives demonstrating single-thread ownership, blocked state transitions, FIFO waiting queue handoffs, and release clock synchronization.
- **Deadlock Cycle Detector (`DeadlockWidget.tsx`):** Interactive wait-for dependency graph. Highlights circular wait cycles ($T_A \to T_B \to T_A$) in crimson when deadlocked and demonstrates how hierarchical lock ordering prevents circular dependencies.
- **Counting Semaphore Sandbox (`SemaphoreWidget.tsx`):** Configurable capacity guards with $P()$ (wait) and $V()$ (signal) operations. Demonstrates multi-permit allocations and FIFO queue unblocking.
- **Lock Fairness vs Starvation (`StarvationWidget.tsx`):** Direct comparison between unfair barging locks (where aggressive threads starve waiting threads) and FIFO fair locks (where wait time is strictly bounded).
- **Deterministic Scheduler Simulator (`SchedulerWidget.tsx`):** Generates 8-slice schedules using Round-Robin or the engine's exact Mulberry32 PRNG algorithm. Demonstrates how seed determinism enables reproducible concurrency debugging.

### 3. Simulation Event Linking to Concepts

- **Race Reports (`RaceReportPanel.tsx`):** Every detected data race displays direct links to the relevant theory guides: `/app/learn/race-conditions` and `/app/learn/happens-before`.
- **Deadlock Alerts (`MemoryInspector.tsx`):** Active circular wait warnings include direct links to `/app/learn/deadlocks`.
- **Mutex & Lock Inspector (`MemoryInspector.tsx`):** Provides direct access to `/app/learn/mutexes`.
- **Execution Controls (`ExecutionControls.tsx`):** Scheduler mode selector includes direct reference to `/app/learn/schedulers`.

---

## 9. Production Release & QA Architecture (Phase 6 Implemented)

Phase 6 hardens RaceLab for production distribution, zero-downtime static hosting, and accessible operation:

### 1. Accessibility & Keyboard Navigation

- **Simulator Hotkeys:** Global and studio-scoped key listeners for rapid execution control (`Space` play/pause, `→` step forward, `←` rewind, `R` reset simulation, `H` toggle mission intel, `?` keyboard reference dialog). Input field guards prevent keystroke collisions during text entry.
- **Accessible Modals & Dialogs:** All modal layers (`KeyboardShortcutsModal`, `OnboardingModal`, `MissionCompletionModal`, `HintDrawer`) implement standard WAI-ARIA dialog attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus ring indicators, and `Escape` dismiss listeners).
- **Skip Links & Reduced Motion:** AppShell features a skip-to-main-content accessible anchor for screen readers and keyboard tab navigation. User motion preferences are managed in `settings-store` and toggleable in the Settings console.

### 2. Guided Onboarding Tour (`src/components/ui/OnboardingModal.tsx`)

- 5-slide orientation covering the Deterministic Engine, Simulation Studio, Challenge Missions, Simulation Lab, and Learning Centre.
- Automatically launches on first visit via `localStorage` flag detection (`racelab_onboarding_completed`), with on-demand reopening via the Header Tour pill.

### 3. Reliability & Fault Tolerance

- **Error Boundary (`src/components/ui/ErrorBoundary.tsx`):** Wraps top-level routing and UI trees. Traps component rendering errors, logs details to console, and presents an accessible recovery panel offering session recovery, window reload, or safe navigation back to Dashboard.
- **404 Route (`src/features/not-found/NotFoundPage.tsx`):** Catches unmapped paths and invalid memory routes with styled developer-tooling diagnostics and one-click return paths.

### 4. Performance & Bundle Optimization

- **Dynamic Route Code Splitting:** All top-level feature pages lazy-loaded via `React.lazy` with Suspense loading fallbacks.
- **Rollup Chunking:** Configured in `vite.config.ts` via `manualChunks` splitting runtime packages into `vendor-react` (React, React Router), `vendor-icons` (Lucide React), and `vendor-state` (Zustand), reducing main bundle payload to under 280 kB gzip.

### 5. Deployment Infrastructures

- **Vercel (`vercel.json`):** Static SPA rewrites to `/index.html`, 1-year immutable caching on `/assets/*`, and security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`).
- **Render (`render.yaml`):** Infrastructure-as-Code Blueprint defining a static web service publishing `./dist` with SPA route rewrites and security headers. Tested via Render CLI v2.29.0 and Vercel CLI v66.6.0.
