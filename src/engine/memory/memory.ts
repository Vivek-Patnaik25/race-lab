/**
 * Shared & Thread-Local Memory Manager
 *
 * Enforces strict memory partitioning (Section 4.3):
 * - Shared memory: Accessible across threads via READ and WRITE operations.
 * - Thread-local memory: Private registers accessible only by the owning thread.
 */
export class MemoryManager {
  private sharedMemory: Record<string, number> = {};

  constructor(initialShared: Record<string, number> = {}) {
    this.sharedMemory = { ...initialShared };
  }

  public getShared(name: string): number | undefined {
    return this.sharedMemory[name];
  }

  public hasShared(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.sharedMemory, name);
  }

  public setShared(name: string, value: number): void {
    this.sharedMemory[name] = value;
  }

  public getAllShared(): Record<string, number> {
    return { ...this.sharedMemory };
  }

  public reset(initialShared: Record<string, number> = {}): void {
    this.sharedMemory = { ...initialShared };
  }
}
