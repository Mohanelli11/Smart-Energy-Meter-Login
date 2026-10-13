import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { Router, type Request, type RequestHandler } from 'express';
import { z } from 'zod';
import type { Config } from '../config.js';
import { LockoutTracker } from '../lockout.js';
import { audit, errorBody, HttpError, maskEmail, maskPhone } from '../middleware.js';
import { checkPasswordStrength, hashPassword, verifyPassword } from '../passwords.js';
import type { SessionService } from '../session.js';
import type { SmsProvider } from '../sms.js';
import type { Store } from '../store.js';
import type { TokenService } from '../tokens.js';
import { toPublicMeter, toPublicUser, type SessionKind } from '../types.js';

export interface AuthDeps {
  config: Config;
  store: Store;
  tokens: TokenService;
  session: SessionService;
  sms: SmsProvider | null;
}

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Enter the phone number in international format, e.g. +254700000000.'));

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  remember: z.boolean().optional().default(false)
});

const meterLoginSchema = z.object({
  accountNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{5,50}$/),
  password: z.string().min(1).max(128),
  remember: z.boolean().optional().default(false)
});

const kindSchema = z.object({ kind: z.enum(['user', 'meter']).default('user') });

const GENERIC_LOGIN_ERROR = 'Invalid credentials. Please check your details and try again.';

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    throw new HttpError(400, 'invalid_request', result.error.issues[0]?.message ?? 'Invalid request.');
  }
  return result.data;
}

const wrap =
  (fn: (req: Request, res: Parameters<RequestHandler>[1]) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

export function authRouter(deps: AuthDeps): Router {
  const { config, store, tokens, session, sms } = deps;
  const router = Router();

  const loginLock = new LockoutTracker(config.lockoutMaxFailures, config.lockoutWindowSeconds * 1000, config.lockoutDurationSeconds * 1000);
  const otpLock = new LockoutTracker(config.otpMaxAttempts * 2, config.lockoutWindowSeconds * 1000, config.lockoutDurationSeconds * 1000);

  // Verified against when the account does not exist, so response time doesn't reveal that.
  let dummyHash: Promise<string> | undefined;
  const getDummyHash = () => (dummyHash ??= hashPassword(randomUUID(), config.scryptN));

  function assertNotLocked(lock: LockoutTracker, key: string) {
    const status = lock.check(key);
    if (status.locked) {
      const mins = Math.max(1, Math.ceil(status.retryAfterSeconds / 60));
      throw new HttpError(429, 'locked', `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`, status.retryAfterSeconds);
    }
  }

  // ---- Staff / admin login -------------------------------------------------
  router.post(
    '/login',
    wrap(async (req, res) => {
      const { email, password, remember } = parse(loginSchema, req.body);
      const key = `user:${email}|${req.ip}`;
      assertNotLocked(loginLock, key);

      const user = await store.findUserByEmail(email);
      const ok = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
      if (!user || !ok || user.disabled) {
        const status = loginLock.recordFailure(key);
        audit('login_failed', { email: maskEmail(email), ip: req.ip, locked: status.locked });
        throw new HttpError(401, 'invalid_credentials', GENERIC_LOGIN_ERROR);
      }

      loginLock.reset(key);
      await session.issue(res, { sub: `user:${user.id}`, kind: 'user', role: user.role, remember });
      audit('login_success', { userId: user.id, role: user.role, ip: req.ip });
      res.json({ user: toPublicUser(user) });
    })
  );

  // ---- Customer meter login ------------------------------------------------
  router.post(
    '/meter-login',
    wrap(async (req, res) => {
      const { accountNo, password, remember } = parse(meterLoginSchema, req.body);
      const key = `meter:${accountNo}|${req.ip}`;
      assertNotLocked(loginLock, key);

      const meter = await store.findMeter(accountNo);
      const ok = await verifyPassword(password, meter?.passwordHash ?? (await getDummyHash()));
      if (!meter || !ok) {
        const status = loginLock.recordFailure(key);
        audit('meter_login_failed', { accountNo, ip: req.ip, locked: status.locked });
        throw new HttpError(401, 'invalid_credentials', GENERIC_LOGIN_ERROR);
      }

      loginLock.reset(key);
      await session.issue(res, { sub: `meter:${meter.accountNo}`, kind: 'meter', role: 'CUSTOMER', remember });
      audit('meter_login_success', { accountNo, ip: req.ip });
      res.json({ meter: toPublicMeter(meter) });
    })
  );

  // ---- Session restore / refresh / logout ----------------------------------
  /** Used on page load: returns whichever sessions are alive, silently refreshing expired access tokens. */
  router.post(
    '/session',
    wrap(async (req, res) => {
      const out: { user: ReturnType<typeof toPublicUser> | null; meter: ReturnType<typeof toPublicMeter> | null } = { user: null, meter: null };
      for (const kind of ['user', 'meter'] as SessionKind[]) {
        const claims = session.readAccess(req, kind);
        const principal = claims ? await session.resolve(claims.sub, kind) : await session.rotate(req, res, kind);
        if (kind === 'user') out.user = principal?.user ?? null;
        else out.meter = principal?.meter ?? null;
      }
      res.json(out);
    })
  );

  router.post(
    '/refresh',
    wrap(async (req, res) => {
      const { kind } = parse(kindSchema, req.body);
      const principal = await session.rotate(req, res, kind);
      if (!principal) {
        session.clearCookies(res, kind);
        throw new HttpError(401, 'unauthenticated', 'Session expired. Please sign in again.');
      }
      res.json({ user: principal.user ?? null, meter: principal.meter ?? null });
    })
  );

  router.post(
    '/logout',
    wrap(async (req, res) => {
      const { kind } = parse(kindSchema, req.body);
      await session.revoke(req, res, kind);
      res.status(204).end();
    })
  );

  // ---- Password reset by SMS one-time code ---------------------------------
  const digest = (phone: string, code: string) => createHmac('sha256', config.jwtSecret).update(`${phone}:${code}`).digest();

  function requireSms(): SmsProvider {
    if (!sms) {
      throw new HttpError(503, 'reset_unavailable', 'Password reset by SMS is not available. Please contact your administrator.');
    }
    return sms;
  }

  router.post(
    '/password-reset/request',
    wrap(async (req, res) => {
      const provider = requireSms();
      const { phone } = parse(z.object({ phone: phoneSchema }), req.body);
      const key = `otp-req:${phone}|${req.ip}`;
      assertNotLocked(otpLock, key);
      otpLock.recordFailure(key); // counts requests too, so SMS can't be spammed

      const generic = { message: 'If an account exists for that number, a verification code has been sent.' };
      const existing = await store.getOtp(phone);
      const cooling = existing && Date.now() - existing.sentAt < config.otpResendCooldownSeconds * 1000;
      const user = await store.findUserByPhone(phone);

      if (user && !user.disabled && !cooling) {
        const code = String(randomInt(100000, 1000000));
        await store.saveOtp({
          phone,
          userId: user.id,
          codeDigest: digest(phone, code).toString('hex'),
          expiresAt: Date.now() + config.otpTtlSeconds * 1000,
          attempts: 0,
          sentAt: Date.now()
        });
        // Not awaited: response time must not depend on whether the number exists.
        provider
          .send(phone, `Your MoTech verification code is ${code}. It expires in ${Math.round(config.otpTtlSeconds / 60)} minutes. Never share it.`)
          .catch((err) => console.error('[sms] send failed:', err instanceof Error ? err.message : err));
        audit('otp_sent', { userId: user.id, phone: maskPhone(phone) });
      } else {
        audit('otp_request_ignored', { phone: maskPhone(phone), cooling: Boolean(cooling) });
      }
      res.status(202).json({ ...generic, resendAfterSeconds: config.otpResendCooldownSeconds, expiresInSeconds: config.otpTtlSeconds });
    })
  );

  router.post(
    '/password-reset/verify',
    wrap(async (req, res) => {
      requireSms();
      const { phone, otp } = parse(z.object({ phone: phoneSchema, otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.') }), req.body);
      const key = `otp-verify:${phone}|${req.ip}`;
      assertNotLocked(otpLock, key);

      const invalid = () => new HttpError(400, 'invalid_code', 'That code is invalid or has expired. Request a new one.');
      const rec = await store.getOtp(phone);
      if (!rec || !rec.userId || rec.expiresAt <= Date.now()) {
        otpLock.recordFailure(key);
        throw invalid();
      }

      const expected = Buffer.from(rec.codeDigest, 'hex');
      const actual = digest(phone, otp);
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        rec.attempts += 1;
        if (rec.attempts >= config.otpMaxAttempts) await store.deleteOtp(phone);
        else await store.saveOtp(rec);
        otpLock.recordFailure(key);
        audit('otp_failed', { phone: maskPhone(phone) });
        throw invalid();
      }

      await store.deleteOtp(phone);
      otpLock.reset(key);
      const jti = randomUUID();
      const ttlSeconds = 10 * 60;
      await store.saveResetGrant({ jti, userId: rec.userId, expiresAt: Date.now() + ttlSeconds * 1000, used: false });
      res.json({ resetToken: tokens.signReset(rec.userId, jti, ttlSeconds) });
    })
  );

  router.post(
    '/password-reset/confirm',
    wrap(async (req, res) => {
      const { resetToken, newPassword } = parse(z.object({ resetToken: z.string().min(10).max(2000), newPassword: z.string().max(128) }), req.body);
      const claims = tokens.verifyReset(resetToken);
      const grant = claims ? await store.getResetGrant(claims.jti) : undefined;
      if (!claims || !grant || grant.used || grant.expiresAt <= Date.now() || grant.userId !== claims.sub) {
        throw new HttpError(400, 'invalid_reset', 'This reset link has expired. Please start again.');
      }
      const strength = checkPasswordStrength(newPassword);
      if (!strength.ok) throw new HttpError(400, 'weak_password', strength.error!);

      const user = await store.findUserById(claims.sub);
      if (!user || user.disabled) throw new HttpError(400, 'invalid_reset', 'This reset link has expired. Please start again.');

      await store.updateUserPassword(user.id, await hashPassword(newPassword, config.scryptN));
      await store.markResetGrantUsed(grant.jti);
      await store.revokeAllForSubject(`user:${user.id}`); // sign out everywhere
      audit('password_reset', { userId: user.id });
      res.json({ ok: true });
    })
  );

  router.use((_req, res) => void res.status(404).json(errorBody('not_found', 'Not found.')));
  return router;
}
