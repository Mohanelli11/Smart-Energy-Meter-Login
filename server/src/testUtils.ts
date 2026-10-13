import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import { createApp } from './app.js';
import { loadConfig, type Config } from './config.js';
import { hashPassword } from './passwords.js';
import type { SmsProvider } from './sms.js';
import { MemoryStore } from './store.js';
import type { Role } from './types.js';

export const ORIGIN = 'http://localhost:3000';
export const ADMIN = { email: 'admin@example.com', password: 'Str0ng-Admin-Pass!', phone: '+254700000001' };
export const STAFF = { email: 'engineer@example.com', password: 'Str0ng-Engineer-Pass!', phone: '+254700000002' };
export const METER = { accountNo: 'MET-1000-2023', password: 'Meter-Pass-9x!Zq' };

export class FakeSms implements SmsProvider {
  sent: Array<{ to: string; message: string }> = [];
  async send(to: string, message: string) {
    this.sent.push({ to, message });
  }
  lastCode(): string {
    const m = this.sent.at(-1)?.message.match(/\b(\d{6})\b/);
    if (!m) throw new Error('No code sent');
    return m[1];
  }
}

export async function buildTestApp(overrides: Record<string, string> = {}, opts: { sms?: boolean } = {}) {
  const config: Config = loadConfig({
    NODE_ENV: 'test',
    SCRYPT_N: '1024',
    JWT_SECRET: 'x'.repeat(48),
    CORS_ORIGIN: ORIGIN,
    REFRESH_GRACE_SECONDS: '0',
    ...overrides
  });
  const store = new MemoryStore();
  const sms = new FakeSms();

  const addUser = async (u: { email: string; password: string; phone: string }, role: Role, name = 'Test User') =>
    store.createUser({
      id: randomUUID(),
      email: u.email,
      name,
      role,
      phone: u.phone,
      passwordHash: await hashPassword(u.password, config.scryptN),
      createdAt: new Date().toISOString()
    });

  await addUser(ADMIN, 'SUPER_ADMIN', 'Admin');
  await addUser(STAFF, 'ENGINEER', 'Engineer');
  await store.upsertMeter({
    accountNo: METER.accountNo,
    meterNo: 'ESP-1000-001',
    customerName: 'John Mwangi',
    location: 'Ruiru',
    type: 'prepaid',
    consumption: '12.50',
    balance: '80.00',
    status: 'Active',
    passwordHash: await hashPassword(METER.password, config.scryptN)
  });

  const app: Express = createApp({ config, store, sms: opts.sms === false ? null : sms });
  return { app, config, store, sms };
}
