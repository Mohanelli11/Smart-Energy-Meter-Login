/**
 * In-memory failed-attempt tracker with temporary lockout.
 *
 * This is per-process. If you run more than one API instance, back this with a shared
 * store (e.g. Redis) so counters are shared.
 */
interface Entry {
  failures: number;
  firstFailureAt: number;
  lockedUntil?: number;
}

export interface LockStatus {
  locked: boolean;
  retryAfterSeconds: number;
}

export class LockoutTracker {
  private entries = new Map<string, Entry>();

  constructor(
    private readonly maxFailures: number,
    private readonly windowMs: number,
    private readonly lockMs: number,
    private readonly now: () => number = Date.now
  ) {}

  check(key: string): LockStatus {
    const entry = this.entries.get(key);
    const now = this.now();
    if (entry?.lockedUntil && entry.lockedUntil > now) {
      return { locked: true, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
    }
    return { locked: false, retryAfterSeconds: 0 };
  }

  recordFailure(key: string): LockStatus {
    const now = this.now();
    this.prune(now);
    let entry = this.entries.get(key);
    if (!entry || now - entry.firstFailureAt > this.windowMs || (entry.lockedUntil && entry.lockedUntil <= now)) {
      entry = { failures: 0, firstFailureAt: now };
    }
    entry.failures += 1;
    if (entry.failures >= this.maxFailures) {
      entry.lockedUntil = now + this.lockMs;
    }
    this.entries.set(key, entry);
    return this.check(key);
  }

  reset(key: string): void {
    this.entries.delete(key);
  }

  private prune(now: number): void {
    if (this.entries.size < 5000) return;
    for (const [key, entry] of this.entries) {
      const expired = entry.lockedUntil ? entry.lockedUntil <= now : now - entry.firstFailureAt > this.windowMs;
      if (expired) this.entries.delete(key);
    }
  }
}
