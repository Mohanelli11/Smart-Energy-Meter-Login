import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { MeterRecord, OtpRecord, RefreshRecord, ResetGrant, UserRecord } from './types.js';

/**
 * Persistence boundary. The default implementation keeps everything in memory and snapshots
 * users + meters to a JSON file. Swap it for a real database (PostgreSQL, etc.) by
 * implementing this interface; nothing else in the server touches storage directly.
 */
export interface Store {
  findUserByEmail(email: string): Promise<UserRecord | undefined>;
  findUserByPhone(phone: string): Promise<UserRecord | undefined>;
  findUserById(id: string): Promise<UserRecord | undefined>;
  listUsers(): Promise<UserRecord[]>;
  createUser(user: UserRecord): Promise<void>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;

  findMeter(accountNo: string): Promise<MeterRecord | undefined>;
  upsertMeter(meter: MeterRecord): Promise<void>;

  saveRefresh(rec: RefreshRecord): Promise<void>;
  getRefresh(jti: string): Promise<RefreshRecord | undefined>;
  markRefreshReplaced(jti: string, replacedBy: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
  revokeAllForSubject(subject: string): Promise<void>;

  saveOtp(rec: OtpRecord): Promise<void>;
  getOtp(phone: string): Promise<OtpRecord | undefined>;
  deleteOtp(phone: string): Promise<void>;

  saveResetGrant(grant: ResetGrant): Promise<void>;
  getResetGrant(jti: string): Promise<ResetGrant | undefined>;
  markResetGrantUsed(jti: string): Promise<void>;
}

interface Snapshot {
  users: UserRecord[];
  meters: MeterRecord[];
}

export class MemoryStore implements Store {
  private users = new Map<string, UserRecord>();
  private meters = new Map<string, MeterRecord>();
  private refresh = new Map<string, RefreshRecord>();
  private otps = new Map<string, OtpRecord>();
  private grants = new Map<string, ResetGrant>();

  constructor(private readonly filePath?: string) {
    if (filePath && existsSync(filePath)) {
      const snap = JSON.parse(readFileSync(filePath, 'utf8')) as Snapshot;
      snap.users.forEach((u) => this.users.set(u.id, u));
      snap.meters.forEach((m) => this.meters.set(m.accountNo, m));
    }
  }

  /** Write users + meters atomically (temp file + rename) with owner-only permissions. */
  private persist(): void {
    if (!this.filePath) return;
    mkdirSync(dirname(this.filePath), { recursive: true });
    const snap: Snapshot = { users: [...this.users.values()], meters: [...this.meters.values()] };
    const tmp = `${this.filePath}.tmp`;
    writeFileSync(tmp, JSON.stringify(snap), { mode: 0o600 });
    renameSync(tmp, this.filePath);
  }

  async findUserByEmail(email: string) {
    const needle = email.toLowerCase();
    return [...this.users.values()].find((u) => u.email.toLowerCase() === needle);
  }
  async findUserByPhone(phone: string) {
    return [...this.users.values()].find((u) => u.phone === phone);
  }
  async findUserById(id: string) {
    return this.users.get(id);
  }
  async listUsers() {
    return [...this.users.values()];
  }
  async createUser(user: UserRecord) {
    this.users.set(user.id, user);
    this.persist();
  }
  async updateUserPassword(id: string, passwordHash: string) {
    const u = this.users.get(id);
    if (u) {
      u.passwordHash = passwordHash;
      this.persist();
    }
  }

  async findMeter(accountNo: string) {
    return this.meters.get(accountNo);
  }
  async upsertMeter(meter: MeterRecord) {
    this.meters.set(meter.accountNo, meter);
    this.persist();
  }

  async saveRefresh(rec: RefreshRecord) {
    this.refresh.set(rec.jti, rec);
    if (this.refresh.size > 20000) {
      const now = Date.now();
      for (const [k, v] of this.refresh) if (v.expiresAt < now) this.refresh.delete(k);
    }
  }
  async getRefresh(jti: string) {
    return this.refresh.get(jti);
  }
  async markRefreshReplaced(jti: string, replacedBy: string) {
    const r = this.refresh.get(jti);
    if (r) {
      r.revoked = true;
      r.replacedBy = replacedBy;
      r.rotatedAt = Date.now();
    }
  }
  async revokeFamily(familyId: string) {
    for (const r of this.refresh.values()) if (r.familyId === familyId) r.revoked = true;
  }
  async revokeAllForSubject(subject: string) {
    for (const r of this.refresh.values()) if (r.subject === subject) r.revoked = true;
  }

  async saveOtp(rec: OtpRecord) {
    this.otps.set(rec.phone, rec);
  }
  async getOtp(phone: string) {
    return this.otps.get(phone);
  }
  async deleteOtp(phone: string) {
    this.otps.delete(phone);
  }

  async saveResetGrant(grant: ResetGrant) {
    this.grants.set(grant.jti, grant);
  }
  async getResetGrant(jti: string) {
    return this.grants.get(jti);
  }
  async markResetGrantUsed(jti: string) {
    const g = this.grants.get(jti);
    if (g) g.used = true;
  }
}
