# RaceLab — Agent & Engineering Guidelines

This document sets architectural rules, coding standards, and engineering constraints for any human or AI agent working on RaceLab.

---

## 1. Core Engineering Directives

1. **Deterministic Execution:** Every simulation must be 100% reproducible. Given identical thread instructions and scheduling sequences (or seeds), the resulting state transitions, memory values, and race reports must be bit-for-bit identical.
2. **Framework-Independent Engine:** The simulation engine under `src/engine/` must be pure TypeScript. It must never import from `react`, `react-router-dom`, `zustand`, or use browser-specific globals (`window`, `document`, `localStorage`).
3. **No Execution of Arbitrary User Code:** Never execute instructions via JavaScript `eval()`, `new Function()`, or dynamic code generators. All instructions are discrete typed data structures evaluated by a dedicated, sandboxed instruction executor.
4. **No External Backends / AI Dependencies:** RaceLab operates 100% client-side. Do not introduce remote server dependencies, paid APIs, AI inference models, or mandatory user authentication.
5. **State Ownership Boundary:**
   - React components render UI views from store snapshots.
   - Zustand stores manage application/UI state (speed, selected tabs, modal open/close) and hold the current engine snapshot.
   - The Engine (`src/engine/`) alone computes state transitions, vector clocks, race reports, and deadlock graphs.

---

## 2. Architecture & Directory Boundaries

```text
src/
├── app/          # App bootstrapping, routing, and providers
├── components/   # Shared UI primitives (Buttons, Cards, Panels, Badges)
│   ├── layout/   # AppShell, Header, Sidebar
│   └── ui/       # Atoms and styled tokens
├── features/     # Feature-sliced pages & domain views
│   ├── landing/
│   ├── dashboard/
│   ├── challenges/
│   ├── simulation/
│   ├── lab/
│   ├── learning/
│   ├── achievements/
│   └── settings/
├── engine/       # PURE TYPESCRIPT SIMULATION CORE
│   ├── core/           # Types, executor, schedulers
│   ├── memory/         # Shared and thread-local memory
│   ├── synchronization/# Mutexes, semaphores, queues
│   ├── analysis/       # Vector clocks, race detector, deadlock detector
│   ├── history/        # Snapshots, step forward/backward, time travel
│   └── scenarios/      # Validations and scenario loaders
├── store/        # Zustand stores (UI, game progress, settings)
├── data/         # Curated mission definitions & learning concepts
├── services/     # Persistence (IndexedDB/localStorage) and export/import
├── styles/       # Design tokens & Tailwind CSS v4 stylesheets
└── lib/          # Pure helper utilities
```

---

## 3. Concurrency & Simulation Semantics

- **Vector Clocks:** Every thread maintains a vector clock `V_t`.
  - An instruction step increments `V_t[t]`.
  - Mutex unlock publishes `V_t` into the mutex's release clock.
  - Mutex lock merges the published release clock: `V_t = max(V_t, V_mutex)`.
- **Happens-Before Data Races:** A conflict is identified as a data race if and only if two accesses touch the same variable, at least one is a `WRITE`, and no happens-before relationship exists between their access vector clocks. Read/Read accesses must never trigger a race report.
- **Deadlock Detection:** Maintain a directed wait-for graph where an edge `T1 → T2` exists if `T1` is blocked waiting for a mutex held by `T2`. Detect deadlocks by finding cycles in this graph (e.g. DFS).
- **FIFO Lock Fairness:** Mutexes must enqueue blocked threads into a FIFO waiting queue. When unlocked, ownership passes predictably to prevent thread barging.

---

## 4. Visual Language & Styling Rules

- **Theme:** Dark developer tooling palette (`#090D14` charcoal background, `#111827` elevated surfaces, `#253149` crisp borders).
- **Typography:**
  - UI text: `Plus Jakarta Sans` or modern sans-serif.
  - Code & instructions: `JetBrains Mono` or system monospace.
- **Color Discipline:** Restrained accents. Primary accent is violet (`#8B5CF6`). Warnings in amber (`#F59E0B`), errors/races in crimson/rose (`#EF4444` / `#F43F5E`), successes in emerald (`#22C55E`).
- **Consistent Thread Identity:** Thread A is Blue (`#3B82F6`), Thread B is Purple (`#A78BFA`), Thread C is Amber (`#F59E0B`).

---

## 5. Testing & Verification Requirements

- **Engine Tests:** All engine features (memory reads, vector clock merges, race detection, deadlock cycle detection, step-back replay) must be unit tested in `tests/engine/` without mounting React.
- **Integration Tests:** Test end-to-end mission scenarios (e.g. Lost Update reproduction, mutex-fixed execution) in `tests/integration/`.
- **E2E Tests:** Smoke and workflow tests using Playwright in `tests/e2e/`.
- **Commands:**
  - `npm run build` must compile cleanly (`tsc -b && vite build`).
  - `npm test` must run Vitest without failures.
  - `npm run lint` must pass ESLint checks.
