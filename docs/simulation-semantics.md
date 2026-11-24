# RaceLab Simulation Semantics & Concurrency Engine Specification

## 1. Domain Types

### Thread Status

- `READY`: Thread is eligible for execution.
- `BLOCKED`: Thread is waiting for a synchronization lock (e.g. mutex owned by another thread). Program counter does not advance.
- `COMPLETED`: All instructions executed. Thread cannot be scheduled again.

### Instruction Set

The engine executes discrete, typed operations:

| Operation | Syntax Example         | Meaning                                                         |
| --------- | ---------------------- | --------------------------------------------------------------- |
| `READ`    | `READ counter INTO a`  | Copies shared variable `counter` into thread-local register `a` |
| `ADD`     | `ADD a BY 1`           | Mutates thread-local register `a` by numeric increment          |
| `WRITE`   | `WRITE a INTO counter` | Copies thread-local register `a` to shared variable `counter`   |
| `LOCK`    | `LOCK mutex_01`        | Attempts to acquire `mutex_01`; blocks if occupied              |
| `UNLOCK`  | `UNLOCK mutex_01`      | Releases `mutex_01` and transfers ownership to the next waiter  |

---

## 2. Vector Clock Happens-Before Model

Every thread $T_i$ maintains a vector clock $V_i \in \mathbb{N}^N$, where $N$ is the number of threads.

1. **Local Instruction Advance:**
   For every instruction executed by thread $T_i$:
   $$V_i[i] \leftarrow V_i[i] + 1$$

2. **Synchronization Release (`UNLOCK`):**
   When $T_i$ unlocks mutex $M$:
   - $T_i$ advances $V_i[i] \leftarrow V_i[i] + 1$.
   - Mutex $M$ stores $V_{\text{release}} \leftarrow V_i$.
   - Ownership of $M$ is cleared or passed to the oldest waiter.

3. **Synchronization Acquire (`LOCK`):**
   When thread $T_j$ acquires mutex $M$:
   - For all threads $k$: $V_j[k] \leftarrow \max(V_j[k], V_{\text{release}}[k])$.
   - $T_j$ advances $V_j[j] \leftarrow V_j[j] + 1$.

---

## 3. Data Race Condition Detection

A data race occurs when two distinct memory access events $e_1$ and $e_2$ satisfy:

1. $e_1$ and $e_2$ access the same shared memory location $X$.
2. $e_1$ and $e_2$ originate from different threads: $\text{Thread}(e_1) \neq \text{Thread}(e_2)$.
3. At least one access is a `WRITE` operation.
4. Neither access happens-before the other:
   $$e_1 \not\le_{\text{HB}} e_2 \quad \text{and} \quad e_2 \not\le_{\text{HB}} e_1$$
   _(i.e. neither vector clock dominates the other)._

**Read/Read Operations:** Two concurrent reads to the same variable never trigger a data race report.

---

## 4. Mutex Fair Queuing & Deadlock Detection

### FIFO Waiting Queues

When a thread requests a locked mutex, it is placed in `mutex.waitingQueue`. When released, the head of the queue is woken, avoiding lock barging and starvation.

### Deadlock Detection via Wait-For Graphs

A directed wait-for graph $G = (V, E)$ is evaluated after any blocking transition:

- Vertices $V$ are active threads.
- Directed edge $(T_A, T_B) \in E$ exists if $T_A$ is blocked on a mutex owned by $T_B$.
- A cycle in $G$ indicates an unresolvable deadlock. The detector identifies the participating cycle and reports the circular dependency.

---

## 5. Execution History & Deterministic Time Travel

- Every transition appends an immutable event log entry with step index, instruction, previous state, and next state.
- Stepping backward reconstructs the state snapshot at step $k-1$ without non-deterministic side-effects.

---

## 6. Verified Simulation Test Scenarios

1. **The Lost Update:** Two threads concurrently incrementing `counter = 0` via `READ counter`, `ADD by 1`, `WRITE counter`. When interleaved `A:READ, B:READ, A:ADD, B:ADD, A:WRITE, B:WRITE`, the final state results in `counter = 1` and triggers a structured `DATA RACE DETECTED` report across the concurrent unordered writes.
2. **Mutex Rescue:** When the same threads guard their critical sections with `LOCK` and `UNLOCK`, vector clocks are published and merged across lock boundaries, ensuring `counter = 2` with zero data races.
3. **Deadlock Cycle Detection:** When two threads request mutexes in cross order (`T1: LOCK m1, LOCK m2` vs `T2: LOCK m2, LOCK m1`), the wait-for graph captures the $T1 \to T2 \to T1$ cycle and transitions the engine to `DEADLOCKED` with an explanation.

---

## 7. Visual Interleaving & Time-Travel Debugging Semantics

1. **State Preservation Across Time Travel:**
   - When seeking to step $k \in [0, N]$:
     - The engine re-establishes the exact shared memory mapping at step $k$.
     - Thread program counters, vector clocks, and local registers match step $k$.
     - Mutex ownership and waiting queues reflect the exact synchronization state at step $k$.
     - Active data races and deadlock states are computed relative to the history up to step $k$.
2. **Deterministic Step Interleaving:**
   - In `MANUAL` mode, the operator directly selects the next thread to step, allowing exploration of arbitrary valid thread interleavings.
   - In `ROUND_ROBIN` mode, ready threads execute in strict cyclic turn-taking order.
   - In `RANDOM` mode, the deterministic Mulberry32 PRNG chooses the next ready thread, producing reproducible interleavings for a given seed.

---

## 8. Custom Scenario Grammar & Validation Invariants

1. **Assembly Syntax Specification:**
   - `READ <source_shared_var> INTO <target_local_reg>`
   - `ADD <target_local_reg> BY <integer_value>`
   - `WRITE <source_local_reg> INTO <target_shared_var>`
   - `LOCK <declared_mutex_id>`
   - `UNLOCK <declared_mutex_id>`
2. **Pre-Execution Invariants:**
   - Every thread ID must be unique across the scenario.
   - Every thread must contain at least one valid instruction.
   - All shared variable reads must reference pre-declared shared memory keys.
   - All `LOCK` and `UNLOCK` operations must reference pre-declared mutex identifiers.
   - Scenarios failing any invariant are rejected before the simulation engine allocates resources or advances time.
