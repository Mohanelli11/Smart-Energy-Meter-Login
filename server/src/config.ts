import { randomBytes } from 'node:crypto';

export type SameSite = 'strict' | 'lax' | 'none';
export type SmsMode = 'console' | 'webhook' | 'disabled';

export interface Config {
  env: 'development' | 'production' | 'test';
  port: number;
  jwtSecret: string;
  /** Origins allowed to call the API with credentials (also used for the Origin check). */
  allowedOrigins: string[];
  trustProxy: boolean | number;
  cookieSecure: boolean;
  cookieSameSite: SameSite;
  cookieDomain?: string;
  accessTtlSeconds: number;
  /** Refresh lifetime for a normal (session) login. */
  refreshTtlSeconds: number;
  /** Refresh lifetime when the user ticks "Remember me". */
  rememberTtlSeconds: number;
  /** Re-presenting a just-rotated refresh token within this window is a benign race (two tabs), not theft. */
  refreshGraceSeconds: number;
  /** scrypt cost parameter N (power of two). */
  scryptN: number;
  lockoutMaxFailures: number;
  lockoutWindowSeconds: number;
  lockoutDurationSeconds: number;
  /** Per-IP request cap on auth endpoints. */
  ipRateLimitMax: number;
  ipRateLimitWindowSeconds: number;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  otpResendCooldownSeconds: number;
  smsMode: SmsMode;
  smsWebhookUrl?: string;
  smsWebhookToken?: string;
  dataFile?: string;
}

type Env = Record<string, string | undefined>;

function int(env: Env, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer (got "${raw}")`);
  }
  return n;
}

function bool(env: Env, name: string, fallback: boolean): boolean {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

export function loadConfig(env: Env = process.env): Config {
  const nodeEnv = env.NODE_ENV === 'production' ? 'production' : env.NODE_ENV === 'test' ? 'test' : 'development';
  const isProd = nodeEnv === 'production';

  let jwtSecret = env.JWT_SECRET ?? '';
  if (jwtSecret.length < 32) {
    if (isProd) {
      throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
    }
    // Ephemeral secret for local development / tests: sessions end when the process restarts.
    jwtSecret = randomBytes(48).toString('hex');
    if (nodeEnv === 'development') {
      console.warn('[config] JWT_SECRET not set (or too short); using an ephemeral secret. Sessions reset on restart.');
    }
  }

  const sameSite = (env.COOKIE_SAMESITE ?? 'strict').toLowerCase() as SameSite;
  if (!['strict', 'lax', 'none'].includes(sameSite)) {
    throw new Error('COOKIE_SAMESITE must be one of strict, lax, none.');
  }
  const cookieSecure = bool(env, 'COOKIE_SECURE', isProd);
  if (sameSite === 'none' && !cookieSecure) {
    throw new Error('COOKIE_SAMESITE=none requires COOKIE_SECURE=true.');
  }
  if (isProd && !cookieSecure) {
    throw new Error('COOKIE_SECURE must be true in production (serve the API over HTTPS).');
  }

  const smsMode = (env.SMS_MODE ?? (isProd ? 'disabled' : 'console')) as SmsMode;
  if (!['console', 'webhook', 'disabled'].includes(smsMode)) {
    throw new Error('SMS_MODE must be one of console, webhook, disabled.');
  }
  if (isProd && smsMode === 'console') {
    throw new Error('SMS_MODE=console would print one-time codes to the logs; not allowed in production.');
  }
  if (smsMode === 'webhook' && !env.SMS_WEBHOOK_URL) {
    throw new Error('SMS_MODE=webhook requires SMS_WEBHOOK_URL.');
  }

  const trustProxyRaw = env.TRUST_PROXY;
  const trustProxy: boolean | number =
    trustProxyRaw === undefined || trustProxyRaw === '' ? false : /^\d+$/.test(trustProxyRaw) ? Number(trustProxyRaw) : trustProxyRaw === 'true';

  return {
    env: nodeEnv,
    port: int(env, 'PORT', 4000),
    jwtSecret,
    allowedOrigins: (env.CORS_ORIGIN ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    trustProxy,
    cookieSecure,
    cookieSameSite: sameSite,
    cookieDomain: env.COOKIE_DOMAIN || undefined,
    accessTtlSeconds: int(env, 'ACCESS_TTL_SECONDS', 15 * 60),
    refreshTtlSeconds: int(env, 'REFRESH_TTL_SECONDS', 8 * 60 * 60),
    rememberTtlSeconds: int(env, 'REMEMBER_TTL_SECONDS', 30 * 24 * 60 * 60),
    refreshGraceSeconds: env.REFRESH_GRACE_SECONDS === undefined || env.REFRESH_GRACE_SECONDS === '' ? 10 : Math.max(0, Number(env.REFRESH_GRACE_SECONDS) || 0),
    scryptN: int(env, 'SCRYPT_N', 2 ** 15),
    lockoutMaxFailures: int(env, 'LOCKOUT_MAX_FAILURES', 5),
    lockoutWindowSeconds: int(env, 'LOCKOUT_WINDOW_SECONDS', 15 * 60),
    lockoutDurationSeconds: int(env, 'LOCKOUT_DURATION_SECONDS', 15 * 60),
    ipRateLimitMax: int(env, 'IP_RATE_LIMIT_MAX', 60),
    ipRateLimitWindowSeconds: int(env, 'IP_RATE_LIMIT_WINDOW_SECONDS', 15 * 60),
    otpTtlSeconds: int(env, 'OTP_TTL_SECONDS', 5 * 60),
    otpMaxAttempts: int(env, 'OTP_MAX_ATTEMPTS', 5),
    otpResendCooldownSeconds: int(env, 'OTP_RESEND_COOLDOWN_SECONDS', 60),
    smsMode,
    smsWebhookUrl: env.SMS_WEBHOOK_URL || undefined,
    smsWebhookToken: env.SMS_WEBHOOK_TOKEN || undefined,
    dataFile: env.DATA_FILE ?? (nodeEnv === 'test' ? undefined : 'data/store.json')
  };
}
