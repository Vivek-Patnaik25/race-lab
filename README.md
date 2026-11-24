# RaceLab

> **Break concurrency. Understand the chaos. Master the system.**

RaceLab is an interactive, client-side developer workbench where software engineers and computer science students experiment with concurrent execution, observe thread interleavings, inspect vector clocks, reproduce race conditions, and resolve deadlocks deterministically.

---

## Key Features

- **Deterministic Concurrency Engine:** Pure TypeScript simulation core with bit-for-bit reproducible thread scheduling and zero browser dependencies.
- **Lamport Vector Clocks:** Formal happens-before data race detection tracking unsynchronized memory reads and writes.
- **Simulation Studio:** Three-column developer workspace featuring Thread Explorer, Execution Timeline with event seeking, and a Live Memory & Mutex Inspector.
- **Challenge Mode:** 5 guided debugging missions reproducing real-world concurrency pitfalls (The Lost Update, Bank Deadlock, Producer-Consumer, Reader-Writer Starvation, Peterson's Algorithm) with tiered hints, scoring, and star ratings.
- **Simulation Lab:** Open-ended sandbox to build custom thread programs with syntax & semantic validation, and Manual, Round-Robin, or Seeded Random scheduling.
- **Learning Centre:** 7 comprehensive masterclasses with embedded interactive mini-simulators (Amdahl's Law, Peterson's Algorithm, Mutex Contention, Deadlock Detection, Starvation).
- **High-Velocity Keyboard Controls:** Full keyboard navigation (`Space` play/pause, `→` step forward, `←` rewind, `R` reset, `H` hints, `?` shortcuts guide).
- **Onboarding Experience & Accessibility:** First-time product tour, accessible ARIA roles, skip-to-content links, and Error Boundary with session recovery.
- **Zero Remote Dependencies:** 100% client-side with full offline support, zero AI dependencies, zero paid APIs, and zero user auth.

---

## Tech Stack

- **Frontend:** React 19, TypeScript 5.7, React Router v7
- **Styling:** Tailwind CSS v4 with charcoal developer tooling design tokens
- **State:** Zustand
- **Icons:** Lucide React
- **Unit & Integration Testing:** Vitest 3, React Testing Library, jsdom (106 tests)
- **End-to-End Testing:** Playwright (Chromium test suite)
- **Linting & Formatting:** ESLint, Prettier
- **Build & Bundler:** Vite 6 with optimized Rollup code splitting & chunking

---

## Commands

```bash
# Install dependencies
npm install

# Start local development server (http://localhost:3000)
npm run dev

# Run Vitest unit & integration test suite (106 tests)
npm test

# Run Playwright E2E smoke tests
npm run test:e2e

# Typecheck with TypeScript
npm run typecheck

# Run ESLint
npm run lint

# Check code formatting with Prettier
npm run format:check

# Format code with Prettier
npm run format

# Build optimized production bundle
npm run build
```

---

## Deployment

### Vercel (Vercel CLI)

`Try2/vercel.json` provides SPA routing rewrites, immutable caching on hashed assets, and HTTP security headers.

```bash
cd Try2
# Preview deployment
npx -y vercel

# Production deployment
npx -y vercel --prod
```

### Render (Render CLI)

`Try2/render.yaml` defines an Infrastructure-as-Code Blueprint for a static web service publishing `./dist` with SPA rewrites.

```bash
cd Try2
# Login to Render
render login

# Validate Blueprint
render blueprints validate ./render.yaml

# Create and deploy
render deploys create <service-id>
```

---

## Documentation & Reports

- [docs/architecture.md](docs/architecture.md): Complete system architecture, store patterns, and layer boundaries.
- [docs/simulation-semantics.md](docs/simulation-semantics.md): Formal vector clock semantics, mutex protocols, and happens-before analysis.
- [AGENTS.md](AGENTS.md): Engineering rules, strict constraints, and deterministic design principles.
- [racelab-full-repo-report.html](racelab-full-repo-report.html): Full standalone repository health scorecard and QA report.
