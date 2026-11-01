/**
 * Seeds the data file with initial accounts and demo meters.
 *
 *   ADMIN_EMAIL, ADMIN_NAME, ADMIN_PHONE  - the first super administrator (required)
 *   ADMIN_PASSWORD                         - optional; if omitted a strong random one is generated and printed ONCE
 *   METER_COUNT                            - number of demo meters to create (default 50, 0 to skip)
 *
 * Meter passwords are random per meter and written to data/meter-credentials.csv (owner-only, git-ignored).
 * Existing users/meters are never overwritten.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadConfig } from './config.js';
import { checkPasswordStrength, hashPassword } from './passwords.js';
import { MemoryStore } from './store.js';
import type { MeterRecord } from './types.js';

const config = loadConfig();
const filePath = config.dataFile ?? 'data/store.json';
const store = new MemoryStore(filePath);

function randomPassword(): string {
  // 18 chars drawn from base64url plus a guaranteed mix of classes.
  return `${randomBytes(12).toString('base64url')}-Aa1`;
}

const LOCATIONS = ['Nairobi West', 'Kasarani', 'Ruiru', 'Thika', 'Juja', 'Kiambu', 'Kikuyu', 'Limuru'];
const NAMES = ['John Mwangi', 'Sarah Wambui', 'David Omondi', 'Grace Njeri', 'Peter Kamau', 'Mary Auma', 'James Otieno', 'Jane Wanjiku', 'Paul Kariuki', 'Lucy Nyambura'];

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const phone = process.env.ADMIN_PHONE?.replace(/[\s-]/g, '');
  if (!email || !phone) {
    console.error('Set ADMIN_EMAIL and ADMIN_PHONE (E.164, e.g. +254700000000) to seed the first administrator.');
    process.exit(1);
  }
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    console.error('ADMIN_PHONE must be in international format, e.g. +254700000000.');
    process.exit(1);
  }

  if (await store.findUserByEmail(email)) {
    console.info(`Administrator ${email} already exists; leaving it unchanged.`);
  } else {
    let password = process.env.ADMIN_PASSWORD;
    let generated = false;
    if (!password) {
      password = randomPassword();
      generated = true;
    } else {
      const check = checkPasswordStrength(password);
      if (!check.ok) {
        console.error(`ADMIN_PASSWORD rejected: ${check.error}`);
        process.exit(1);
      }
    }
    await store.createUser({
      id: randomUUID(),
      email,
      name: process.env.ADMIN_NAME?.trim() || 'Administrator',
      role: 'SUPER_ADMIN',
      phone,
      passwordHash: await hashPassword(password, config.scryptN),
      createdAt: new Date().toISOString()
    });
    console.info(`Created super administrator ${email}.`);
    if (generated) console.info(`Generated password (shown once, change it after first login): ${password}`);
  }

  const count = Number(process.env.METER_COUNT ?? 50);
  if (count > 0) {
    const rows = ['accountNo,password'];
    for (let i = 0; i < count; i++) {
      const prepaid = i % 3 !== 2;
      const num = (prepaid ? 1000 : 5000) + i;
      const accountNo = `MET-${num}-2023`;
      if (await store.findMeter(accountNo)) continue;
      const balance = prepaid ? Math.random() * 200 : Math.random() * 1500 + 500;
      const password = randomPassword();
      const meter: MeterRecord = {
        accountNo,
        meterNo: `ESP-${num}-001`,
        customerName: NAMES[i % NAMES.length],
        location: LOCATIONS[i % LOCATIONS.length],
        type: prepaid ? 'prepaid' : 'postpaid',
        consumption: (Math.random() * 15 + (prepaid ? 10 : 15)).toFixed(2),
        balance: balance.toFixed(2),
        status: prepaid ? (balance > 50 ? 'Active' : balance > 0 ? 'Low Balance' : 'Disconnected') : ['Active', 'Pending Bill', 'Overdue'][i % 3],
        passwordHash: await hashPassword(password, config.scryptN)
      };
      await store.upsertMeter(meter);
      rows.push(`${accountNo},${password}`);
    }
    if (rows.length > 1) {
      const csvPath = 'data/meter-credentials.csv';
      mkdirSync(dirname(csvPath), { recursive: true });
      writeFileSync(csvPath, rows.join('\n') + '\n', { mode: 0o600 });
      console.info(`Created ${rows.length - 1} demo meters. Credentials written to ${csvPath} (keep it private).`);
    } else {
      console.info('All demo meters already exist.');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
