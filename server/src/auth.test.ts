import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';
import { LockoutTracker } from './lockout.js';
import { checkPasswordStrength, hashPassword, verifyPassword } from './passwords.js';
import { ADMIN, buildTestApp, METER, ORIGIN, STAFF } from './testUtils.js';

const json = { Origin: ORIGIN };

async function loginAgent(app: Parameters<typeof request.agent>[0], creds = ADMIN) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').set(json).send({ email: creds.email, password: creds.password });
  expect(res.status).toBe(200);
  return agent;
}

describe('passwords', () => {
  it('hashes with a random salt and verifies', async () => {
    const a = await hashPassword('Correct-Horse-9!', 1024);
    const b = await hashPassword('Correct-Horse-9!', 1024);
    expect(a).not.toEqual(b);
    expect(await verifyPassword('Correct-Horse-9!', a)).toBe(true);
    expect(await verifyPassword('wrong', a)).toBe(false);
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
  });

  it('enforces the strength policy', () => {
    expect(checkPasswordStrength('short1A!').ok).toBe(false);
    expect(checkPasswordStrength('alllowercaseletters').ok).toBe(false);
    expect(checkPasswordStrength('@Testing123').ok).toBe(false); // common word
    expect(checkPasswordStrength('Tr1cky-Unusual-Phrase').ok).toBe(true);
  });
});

describe('lockout tracker', () => {
  it('locks after max failures and unlocks after the duration', () => {
    let now = 0;
    const lock = new LockoutTracker(3, 60_000, 30_000, () => now);
    expect(lock.recordFailure('k').locked).toBe(false);
    expect(lock.recordFailure('k').locked).toBe(false);
    expect(lock.recordFailure('k').locked).toBe(true);
    now = 31_000;
    expect(lock.check('k').locked).toBe(false);
  });
});

describe('config', () => {
  it('refuses to start in production without a strong secret or secure cookies', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'y'.repeat(40), COOKIE_SECURE: 'false' })).toThrow(/COOKIE_SECURE/);
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'y'.repeat(40), SMS_MODE: 'console' })).toThrow(/console/);
  });
});

describe('staff login', () => {
  it('issues httpOnly cookies and never returns tokens or password data in the body', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post('/api/auth/login').set(json).send({ email: ADMIN.email, password: ADMIN.password });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: ADMIN.email, role: 'SUPER_ADMIN' });
    expect(JSON.stringify(res.body)).not.toMatch(/password|token|hash/i);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.length).toBe(2);
    cookies.forEach((c) => expect(c).toMatch(/HttpOnly/i));
    expect(cookies.every((c) => /SameSite=Strict/i.test(c))).toBe(true);
    // Not "remembered": refresh cookie is a session cookie (no Max-Age / Expires)
    const refresh = cookies.find((c) => c.startsWith('motech_u_rt='))!;
    expect(refresh).not.toMatch(/Max-Age|Expires/i);
  });

  it('persists the refresh cookie when "remember me" is ticked', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).post('/api/auth/login').set(json).send({ email: ADMIN.email, password: ADMIN.password, remember: true });
    const refresh = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('motech_u_rt='))!;
    expect(refresh).toMatch(/Max-Age=\d+/i);
  });

  it('returns the same generic error for a wrong password and an unknown email', async () => {
    const { app } = await buildTestApp();
    const wrong = await request(app).post('/api/auth/login').set(json).send({ email: ADMIN.email, password: 'nope-nope-nope' });
    const unknown = await request(app).post('/api/auth/login').set(json).send({ email: 'ghost@example.com', password: 'nope-nope-nope' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('locks the account after repeated failures, even for the right password', async () => {
    const { app } = await buildTestApp();
    for (let i = 0; i < 5; i++) {
      const r = await request(app).post('/api/auth/login').set(json).send({ email: ADMIN.email, password: 'bad-bad-bad' });
      expect(r.status).toBe(401);
    }
    const locked = await request(app).post('/api/auth/login').set(json).send({ email: ADMIN.email, password: ADMIN.password });
    expect(locked.status).toBe(429);
    expect(locked.headers['retry-after']).toBeDefined();
  });

  it('rejects malformed input and bad origins', async () => {
    const { app } = await buildTestApp();
    const bad = await request(app).post('/api/auth/login').set(json).send({ email: 'not-an-email', password: 'x' });
    expect(bad.status).toBe(400);
    const origin = await request(app).post('/api/auth/login').set('Origin', 'https://evil.example').send({ email: ADMIN.email, password: ADMIN.password });
    expect(origin.status).toBe(403);
  });

  it('sets security headers and does not advertise Express', async () => {
    const { app } = await buildTestApp();
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('sessions', () => {
  it('restores a session and rotates refresh tokens', async () => {
    const { app } = await buildTestApp();
    const agent = await loginAgent(app);
    const restored = await agent.post('/api/auth/session').set(json).send({});
    expect(restored.body.user?.email).toBe(ADMIN.email);
    expect(restored.body.meter).toBeNull();

    const refreshed = await agent.post('/api/auth/refresh').set(json).send({ kind: 'user' });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.user.email).toBe(ADMIN.email);
  });

  it('detects refresh-token reuse and revokes the whole session family', async () => {
    const { app } = await buildTestApp();
    const first = await request(app).post('/api/auth/login').set(json).send({ email: ADMIN.email, password: ADMIN.password });
    const stolen = (first.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('motech_u_rt='))!.split(';')[0];

    // Legitimate client rotates once...
    const rotated = await request(app).post('/api/auth/refresh').set(json).set('Cookie', stolen).send({ kind: 'user' });
    expect(rotated.status).toBe(200);
    const fresh = (rotated.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('motech_u_rt='))!.split(';')[0];

    // ...then the old token is replayed: rejected and the family is burned.
    const replay = await request(app).post('/api/auth/refresh').set(json).set('Cookie', stolen).send({ kind: 'user' });
    expect(replay.status).toBe(401);
    const afterBurn = await request(app).post('/api/auth/refresh').set(json).set('Cookie', fresh).send({ kind: 'user' });
    expect(afterBurn.status).toBe(401);
  });

  it('logout revokes the session', async () => {
    const { app } = await buildTestApp();
    const agent = await loginAgent(app);
    expect((await agent.get('/api/admin/users')).status).toBe(200);
    expect((await agent.post('/api/auth/logout').set(json).send({ kind: 'user' })).status).toBe(204);
    expect((await agent.get('/api/admin/users')).status).toBe(401);
  });
});

describe('admin user management', () => {
  const newUser = { name: 'New Person', email: 'new@example.com', phoneNumber: '+254711000111', password: 'Fresh-Crimson-Otter-42', role: 'FINANCE' };

  it('requires authentication and an admin role', async () => {
    const { app } = await buildTestApp();
    expect((await request(app).post('/api/admin/users').set(json).send(newUser)).status).toBe(401);
    const engineer = await loginAgent(app, STAFF);
    expect((await engineer.post('/api/admin/users').set(json).send(newUser)).status).toBe(403);
  });

  it('creates a user with a hashed password and enforces policy and uniqueness', async () => {
    const { app, store } = await buildTestApp();
    const admin = await loginAgent(app);
    const ok = await admin.post('/api/admin/users').set(json).send(newUser);
    expect(ok.status).toBe(201);
    expect(ok.body.user).not.toHaveProperty('passwordHash');
    expect((await store.findUserByEmail(newUser.email))!.passwordHash.startsWith('scrypt$')).toBe(true);

    expect((await admin.post('/api/admin/users').set(json).send(newUser)).status).toBe(409);
    expect((await admin.post('/api/admin/users').set(json).send({ ...newUser, email: 'b@example.com', phoneNumber: '+254722000222', password: '@Testing' })).status).toBe(400);
    expect((await admin.post('/api/admin/users').set(json).send({ ...newUser, email: 'c@example.com', phoneNumber: '+254733000333', role: 'CUSTOMER' })).status).toBe(400);
  });

  it('prevents a non-super admin from creating a super admin', async () => {
    const { app } = await buildTestApp();
    const admin = await loginAgent(app);
    await admin.post('/api/admin/users').set(json).send({ ...newUser, role: 'UTILITY_ADMIN' });
    const utility = await loginAgent(app, { email: newUser.email, password: newUser.password, phone: newUser.phoneNumber });
    const res = await utility.post('/api/admin/users').set(json).send({ ...newUser, email: 'x@example.com', phoneNumber: '+254744000444', role: 'SUPER_ADMIN' });
    expect(res.status).toBe(403);
  });
});

describe('meter login', () => {
  it('uses per-meter credentials and an independent session from staff', async () => {
    const { app } = await buildTestApp();
    const bad = await request(app).post('/api/auth/meter-login').set(json).send({ accountNo: METER.accountNo, password: '@Testing' });
    expect(bad.status).toBe(401);

    const agent = request.agent(app);
    const ok = await agent.post('/api/auth/meter-login').set(json).send({ accountNo: METER.accountNo.toLowerCase(), password: METER.password });
    expect(ok.status).toBe(200);
    expect(ok.body.meter).not.toHaveProperty('passwordHash');

    expect((await agent.get('/api/meters/me')).body.meter.accountNo).toBe(METER.accountNo);
    // A meter session must not unlock staff APIs
    expect((await agent.get('/api/admin/users')).status).toBe(401);
  });

  it('does not let a staff session read /meters/me, but lets an admin look a meter up', async () => {
    const { app } = await buildTestApp();
    const admin = await loginAgent(app);
    expect((await admin.get('/api/meters/me')).status).toBe(401);
    expect((await admin.get(`/api/meters/${METER.accountNo}`)).body.meter.customerName).toBe('John Mwangi');
  });
});

describe('password reset by SMS', () => {
  const NEW_PASSWORD = 'Brand-New-Violet-Kite-77!';

  it('does not reveal whether a phone number is registered', async () => {
    const { app, sms } = await buildTestApp();
    const unknown = await request(app).post('/api/auth/password-reset/request').set(json).send({ phone: '+254799999999' });
    const known = await request(app).post('/api/auth/password-reset/request').set(json).send({ phone: ADMIN.phone });
    expect(unknown.status).toBe(202);
    expect(known.status).toBe(202);
    expect(unknown.body.message).toBe(known.body.message);
    expect(sms.sent).toHaveLength(1);
    expect(sms.sent[0].to).toBe(ADMIN.phone);
  });

  it('runs the full flow: code -> reset token -> new password, and signs out other sessions', async () => {
    const { app, sms } = await buildTestApp();
    const existing = await loginAgent(app);

    await request(app).post('/api/auth/password-reset/request').set(json).send({ phone: ADMIN.phone });
    const wrong = await request(app).post('/api/auth/password-reset/verify').set(json).send({ phone: ADMIN.phone, otp: '000000' });
    expect(wrong.status).toBe(400);

    const verified = await request(app).post('/api/auth/password-reset/verify').set(json).send({ phone: ADMIN.phone, otp: sms.lastCode() });
    expect(verified.status).toBe(200);
    const { resetToken } = verified.body;

    const weak = await request(app).post('/api/auth/password-reset/confirm').set(json).send({ resetToken, newPassword: '@Testing' });
    expect(weak.status).toBe(400);

    const done = await request(app).post('/api/auth/password-reset/confirm').set(json).send({ resetToken, newPassword: NEW_PASSWORD });
    expect(done.status).toBe(200);

    // single use
    expect((await request(app).post('/api/auth/password-reset/confirm').set(json).send({ resetToken, newPassword: NEW_PASSWORD })).status).toBe(400);

    expect((await request(app).post('/api/auth/login').set(json).send({ email: ADMIN.email, password: ADMIN.password })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').set(json).send({ email: ADMIN.email, password: NEW_PASSWORD })).status).toBe(200);
    // the pre-existing session's refresh token no longer works
    expect((await existing.post('/api/auth/refresh').set(json).send({ kind: 'user' })).status).toBe(401);
  });

  it('burns the code after too many wrong guesses', async () => {
    const { app, sms } = await buildTestApp();
    await request(app).post('/api/auth/password-reset/request').set(json).send({ phone: ADMIN.phone });
    const code = sms.lastCode();
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/password-reset/verify').set(json).send({ phone: ADMIN.phone, otp: code === '111111' ? '222222' : '111111' });
    }
    const late = await request(app).post('/api/auth/password-reset/verify').set(json).send({ phone: ADMIN.phone, otp: code });
    expect(late.status).toBeGreaterThanOrEqual(400);
    expect(late.status).not.toBe(200);
  });

  it('is unavailable (503) when no SMS provider is configured', async () => {
    const { app } = await buildTestApp({}, { sms: false });
    const res = await request(app).post('/api/auth/password-reset/request').set(json).send({ phone: ADMIN.phone });
    expect(res.status).toBe(503);
  });
});
