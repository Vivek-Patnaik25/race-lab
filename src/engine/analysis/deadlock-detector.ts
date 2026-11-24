import type { DeadlockReport, MutexState, ThreadState } from '../core/types';

/**
 * Wait-For Graph and Deadlock Cycle Detector
 *
 * Constructs a directed wait-for graph:
 * Node: Thread
 * Edge (T_wait -> T_hold): T_wait is BLOCKED waiting on a mutex owned by T_hold.
 *
 * Uses DFS cycle detection to detect circular wait dependencies (Coffman Condition 4).
 */
export class DeadlockDetector {
  /**
   * Analyzes thread states and mutex ownership to detect circular deadlocks.
   */
  public detectDeadlock(threads: ThreadState[], mutexes: MutexState[]): DeadlockReport | null {
    // Map mutexes by ID for fast lookup
    const mutexMap = new Map<string, MutexState>();
    for (const m of mutexes) {
      mutexMap.set(m.id, m);
    }

    // Map threads by ID
    const threadMap = new Map<string, ThreadState>();
    for (const t of threads) {
      threadMap.set(t.id, t);
    }

    // Build directed adjacency list: waitingThread -> Set of holdingThreads
    const adj = new Map<string, string[]>();
    const waitingRelationships: Array<{
      waitingThread: string;
      holdingThread: string;
      mutexId: string;
    }> = [];

    for (const thread of threads) {
      if (thread.status !== 'BLOCKED') {
        continue;
      }

      // Check current instruction to determine which mutex the thread is waiting for
      const currentInst = thread.instructions[thread.programCounter];
      if (currentInst && currentInst.op === 'LOCK') {
        const mutex = mutexMap.get(currentInst.mutexId);
        if (mutex && mutex.owner && mutex.owner !== thread.id) {
          const holdingThreadId = mutex.owner;
          if (!adj.has(thread.id)) {
            adj.set(thread.id, []);
          }
          adj.get(thread.id)!.push(holdingThreadId);

          waitingRelationships.push({
            waitingThread: thread.id,
            holdingThread: holdingThreadId,
            mutexId: mutex.id,
          });
        }
      }
    }

    // If no edges, no deadlock is possible
    if (waitingRelationships.length === 0) {
      return null;
    }

    // Find cycle using DFS
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const path: string[] = [];

    let detectedCycle: string[] | null = null;

    const dfs = (node: string): boolean => {
      visited.add(node);
      inStack.add(node);
      path.push(node);

      const neighbors = adj.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (inStack.has(neighbor)) {
          // Cycle found! Extract the cycle slice from path
          const cycleStartIndex = path.indexOf(neighbor);
          if (cycleStartIndex !== -1) {
            detectedCycle = [...path.slice(cycleStartIndex), neighbor];
          } else {
            detectedCycle = [neighbor, node, neighbor];
          }
          return true;
        }
      }

      path.pop();
      inStack.delete(node);
      return false;
    };

    for (const [node] of adj) {
      if (!visited.has(node)) {
        if (dfs(node)) {
          break;
        }
      }
    }

    if (!detectedCycle) {
      return null;
    }

    // Format human-readable cycle string, e.g. "Thread A -> Thread B -> Thread A"
    const cycleStr = (detectedCycle as string[]).join(' -> ');
    const explanation =
      `Deadlock detected! Circular wait condition identified along execution graph: ${cycleStr}. ` +
      `Each thread in the cycle is blocked waiting for a lock held by the next thread.`;

    return {
      id: `deadlock-${Date.now()}`,
      cycle: detectedCycle,
      waitingRelationships,
      explanation,
    };
  }
}
