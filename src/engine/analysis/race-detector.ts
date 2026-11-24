import type { MemoryAccessRecord, RaceReport } from '../core/types';
import { isLessThanOrEqual } from './vector-clock';

/**
 * Happens-Before Data Race Detector
 *
 * Implements formal vector clock causality analysis:
 * A data race occurs when two accesses touch the same variable,
 * at least one is a WRITE, they originate from different threads,
 * and no happens-before relationship exists between them.
 */
export class RaceDetector {
  private detectedRaces: RaceReport[] = [];
  private raceFingerprints = new Set<string>();

  /**
   * Resets the detector's internal race history.
   */
  public reset(): void {
    this.detectedRaces = [];
    this.raceFingerprints.clear();
  }

  /**
   * Evaluates a new memory access against all prior accesses in the given history.
   * Returns newly discovered race reports triggered by this access.
   */
  public checkAccess(newAccess: MemoryAccessRecord, history: MemoryAccessRecord[]): RaceReport[] {
    const newRaces: RaceReport[] = [];

    // Filter prior accesses for the same variable from DIFFERENT threads
    const candidates = history.filter(
      (prior) =>
        prior.variable === newAccess.variable &&
        prior.threadId !== newAccess.threadId &&
        prior.step < newAccess.step
    );

    for (const prior of candidates) {
      // Rule 1: Read/Read never races
      if (prior.type === 'READ' && newAccess.type === 'READ') {
        continue;
      }

      // Rule 2: Must be at least one WRITE (guaranteed if not READ/READ)
      // Rule 3: Check happens-before relationship.
      // Since prior occurred at an earlier step, it happens-before newAccess iff prior.clock <= newAccess.clock.
      const isOrdered = isLessThanOrEqual(prior.clock, newAccess.clock);

      if (!isOrdered) {
        // Data race detected!
        const fingerprint = `${newAccess.variable}:${prior.threadId}@${prior.step}-${newAccess.threadId}@${newAccess.step}`;

        if (!this.raceFingerprints.has(fingerprint)) {
          this.raceFingerprints.add(fingerprint);

          const conflictType =
            prior.type === 'WRITE' && newAccess.type === 'WRITE'
              ? 'Write-Write Conflict'
              : 'Read-Write Conflict';

          const explanation =
            `Data race detected on shared variable "${newAccess.variable}". ` +
            `Thread ${prior.threadId} (${prior.type} at step ${prior.step}) and ` +
            `Thread ${newAccess.threadId} (${newAccess.type} at step ${newAccess.step}) ` +
            `accessed the variable concurrently with no happens-before synchronization ordering.`;

          const suggestedFix =
            `Guard both accesses to "${newAccess.variable}" using a common mutex lock (` +
            `LOCK mutex -> access -> UNLOCK mutex) to establish a happens-before order.`;

          const report: RaceReport = {
            id: `race-${this.detectedRaces.length + 1}-${Date.now()}`,
            variable: newAccess.variable,
            threadA: prior.threadId,
            threadB: newAccess.threadId,
            accessTypeA: prior.type,
            accessTypeB: newAccess.type,
            stepA: prior.step,
            stepB: newAccess.step,
            explanation: `[${conflictType}] ${explanation}`,
            suggestedFix,
          };

          this.detectedRaces.push(report);
          newRaces.push(report);
        }
      }
    }

    return newRaces;
  }

  /**
   * Returns all races detected so far.
   */
  public getAllRaces(): RaceReport[] {
    return [...this.detectedRaces];
  }
}
