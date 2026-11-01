import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const KEY_LENGTH = 64;
const R = 8;
const P = 1;
const MAX_MEM = 128 * 1024 * 1024;

function derive(password: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> {
  const options: ScryptOptions = { N, r, p, maxmem: MAX_MEM };
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** Hash a password with scrypt. Format: scrypt$N$r$p$salt(b64)$hash(b64). */
export async function hashPassword(password: string, N: number): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

/** Constant-time verification. Returns false for malformed hashes instead of throwing. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  try {
    const expected = Buffer.from(hashB64, 'base64');
    const actual = await derive(password, Buffer.from(saltB64, 'base64'), N, r, p);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

const COMMON_FRAGMENTS = ['password', 'passw0rd', 'qwerty', '12345', 'letmein', 'testing', 'admin', 'welcome'];

export interface PasswordCheck {
  ok: boolean;
  error?: string;
}

/** Policy: 10-128 chars, at least 3 of 4 character classes, no obvious common words. */
export function checkPasswordStrength(password: string): PasswordCheck {
  if (typeof password !== 'string' || password.length < 10) {
    return { ok: false, error: 'Password must be at least 10 characters long.' };
  }
  if (password.length > 128) {
    return { ok: false, error: 'Password must be at most 128 characters long.' };
  }
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes < 3) {
    return { ok: false, error: 'Use at least three of: lowercase, uppercase, numbers, symbols.' };
  }
  const lower = password.toLowerCase();
  if (COMMON_FRAGMENTS.some((f) => lower.includes(f))) {
    return { ok: false, error: 'Password contains a common word or sequence. Choose something less guessable.' };
  }
  return { ok: true };
}
