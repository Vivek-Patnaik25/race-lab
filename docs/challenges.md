# RaceLab Challenge & Game System

## 1. Challenge Architecture & Missions

RaceLab's game mode provides five curated missions spanning fundamental concurrency bugs, synchronization primitives, and coordination patterns. Each mission defines explicit, deterministic completion conditions evaluated against simulation states and execution history.

```text
┌────────────────────────────────────────────────────────┐
│                   Challenge Definition                 │
├────────────────────────────────────────────────────────┤
│ • Initial Shared Memory & Threads                      │
│ • Mutexes & Synchronization Primitives                 │
│ • Progressive 3-Tier Hint Intel                        │
│ • Optimal Steps Target & Concept Categorization        │
│ • Deterministic Success Evaluation Function            │
│ • Post-Mission Engineering Takeaway                    │
└───────────────────────────┬────────────────────────────┘
                            │ Evaluates State & Events
┌───────────────────────────▼────────────────────────────┐
│                    Scoring Engine                      │
│   (Base: 1000 + Efficiency Bonus - Hint Penalties)     │
└───────────────────────────┬────────────────────────────┘
                            │ Updates Progress & Unlocks
┌───────────────────────────▼────────────────────────────┐
│               Game Store & Persistence                 │
│      (Challenges, Achievements, High Scores, XP)       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Mission Catalogue

### Mission 01 — The Lost Update

- **Tier:** Beginner
- **Concept:** Race Conditions & Lost Updates
- **Objective:** Interleave Thread A and Thread B such that counter final value becomes 1 and a data race is detected.
- **Initial State:** `counter = 0`
- **Threads:**
  - Thread A: `READ counter INTO a`, `ADD a BY 1`, `WRITE a INTO counter`
  - Thread B: `READ counter INTO b`, `ADD b BY 1`, `WRITE b INTO counter`
- **Optimal Steps:** 6
- **Success Criteria:** Both threads reach `COMPLETED`, final `counter === 1`, and `activeRaces.length > 0`.
- **Engineering Takeaway:** Unsynchronized read-modify-write sequences overwrite concurrent changes when two threads read identical initial states before committing their writes.

### Mission 02 — Banking Disaster

- **Tier:** Intermediate
- **Concept:** Check-Then-Act Conflicts / Dirty Balances
- **Objective:** Cause an inconsistent bank account balance (different from $120) through unsynchronized reads and writes.
- **Initial State:** `balance = 100`
- **Threads:**
  - Depositor: `READ balance INTO dep`, `ADD dep BY 50`, `WRITE dep INTO balance`
  - Withdrawer: `READ balance INTO wdl`, `ADD wdl BY -30`, `WRITE wdl INTO balance`
- **Optimal Steps:** 6
- **Success Criteria:** Both transactions complete (`COMPLETED`), `balance !== 120` ($150 or $70), and `activeRaces.length > 0`.
- **Engineering Takeaway:** In financial transactions without ACID isolation or mutual exclusion, stale reads lead to dirty writes that erase valid transactions.

### Mission 03 — Mutex Rescue

- **Tier:** Intermediate
- **Concept:** Mutual Exclusion & Vector Clock Synchronization
- **Objective:** Safely guard the critical section using mutex locks so all updates complete with zero data races.
- **Initial State:** `balance = 100`, `vault_mutex` (unlocked)
- **Threads:**
  - Depositor: `LOCK vault_mutex`, `READ balance`, `ADD by 50`, `WRITE balance`, `UNLOCK vault_mutex`
  - Withdrawer: `LOCK vault_mutex`, `READ balance`, `ADD by -30`, `WRITE balance`, `UNLOCK vault_mutex`
- **Optimal Steps:** 10
- **Success Criteria:** All transactions complete (`COMPLETED`), `balance === 120`, and `activeRaces.length === 0`.
- **Engineering Takeaway:** Mutex acquisition enforces mutual exclusion and synchronizes vector clocks across thread boundaries, establishing a happens-before order that eliminates data races.

### Mission 04 — Deadlock City

- **Tier:** Advanced
- **Concept:** Circular Wait & Deadlocks
- **Objective:** Reproduce a circular lock dependency cycle (`thread-alpha → thread-beta → thread-alpha`).
- **Initial State:** `mutex_x`, `mutex_y`
- **Threads:**
  - Thread Alpha: `LOCK mutex_x`, `LOCK mutex_y`, `UNLOCK mutex_y`, `UNLOCK mutex_x`
  - Thread Beta: `LOCK mutex_y`, `LOCK mutex_x`, `UNLOCK mutex_x`, `UNLOCK mutex_y`
- **Optimal Steps:** 4
- **Success Criteria:** Engine transitions to `DEADLOCKED`, `activeDeadlock !== null`, with a cycle length $\ge 2$.
- **Engineering Takeaway:** Deadlocks arise when threads acquire locks in opposing orders, violating the resource-ordering hierarchy and forming circular wait-for dependency graphs.

### Mission 05 — Semaphore Bridge

- **Tier:** Advanced
- **Concept:** Capacity Contention & Multi-threading
- **Objective:** Coordinate 3 worker threads operating on bridge capacity, triggering concurrent data races and capacity conflict.
- **Initial State:** `bridgeSlots = 2`
- **Threads:** 3 Vehicle threads each executing `READ bridgeSlots`, `ADD slots BY -1`, `WRITE slots INTO bridgeSlots`.
- **Optimal Steps:** 9
- **Success Criteria:** All vehicles complete (`COMPLETED`), triggering active data race conflicts (`activeRaces.length > 0`).
- **Engineering Takeaway:** Without counting locks or semaphores, concurrent access to bounded capacity variables leads to slot miscalculations and race conditions.

---

## 3. Deterministic Scoring Rubric

Scores are computed with pure mathematical determinism:

$$\text{Score} = \text{clamp}\Big(1000 + \max\big(0, 500 - (\text{actualSteps} - \text{optimalSteps}) \times 50\big) - (\text{hintsUsed} \times 150), 200, 1500\Big)$$

### Star Thresholds:

- **3 Stars (Flawless):** Score $\ge 1350$
- **2 Stars (Proficient):** Score $\ge 950$
- **1 Star (Complete):** Score $< 950$

---

## 4. Engineering Achievements Registry

| ID                  | Title            | Requirement                                              | XP Reward |
| ------------------- | ---------------- | -------------------------------------------------------- | --------- |
| `first-race`        | First Race       | Detect your first data race condition                    | 50 XP     |
| `time-traveler`     | Time Traveler    | Rewind an execution step in the timeline                 | 50 XP     |
| `lock-it-down`      | Lock It Down     | Complete Mission 03 (Mutex Rescue) with zero data races  | 100 XP    |
| `chaos-controller`  | Chaos Controller | Use manual scheduling to trigger a specific interleaving | 75 XP     |
| `no-more-deadlocks` | Deadlock Hunter  | Trigger and detect a circular wait-for deadlock cycle    | 100 XP    |
| `bug-hunter`        | Bug Hunter       | Complete all five concurrency missions                   | 250 XP    |
| `perfectionist`     | Perfectionist    | Earn a 3-star rating on any mission                      | 150 XP    |
| `speed-demon`       | Speed Demon      | Complete a mission in optimal steps with zero hints used | 125 XP    |

---

## 5. Persistence Specification

- **Storage Location:** Browser `localStorage` with versioned key `racelab:v1:gamedata`.
- **Schema:**
  - `version`: Database schema version (`1`).
  - `xp`: Cumulative user experience points.
  - `unlockedHintIds`: Array of unlocked hint identifiers.
  - `challenges`: Map of challenge IDs to `StoredChallengeProgress` records (bestScore, stars, actualSteps, optimalSteps, completedAt).
  - `unlockedAchievements`: Array of `{ id, unlockedAt }` achievement records.
  - `lastUpdated`: ISO 8601 timestamp.
- **Export / Import:** Supports single-click JSON export and validated import for backup and session sharing.
