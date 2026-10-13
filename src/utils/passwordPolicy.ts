/**
 * Client-side mirror of the server's password policy, used only to give instant feedback.
 * The server is the source of truth and re-checks every password.
 */
const COMMON_FRAGMENTS = ['password', 'passw0rd', 'qwerty', '12345', 'letmein', 'testing', 'admin', 'welcome'];

export const PASSWORD_HINT = 'At least 10 characters, using three of: lowercase, uppercase, numbers, symbols.';

export function checkPasswordPolicy(password: string): { ok: boolean; error?: string } {
  if (password.length < 10) return { ok: false, error: 'Password must be at least 10 characters long.' };
  if (password.length > 128) return { ok: false, error: 'Password must be at most 128 characters long.' };
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes < 3) return { ok: false, error: 'Use at least three of: lowercase, uppercase, numbers, symbols.' };
  const lower = password.toLowerCase();
  if (COMMON_FRAGMENTS.some((f) => lower.includes(f))) {
    return { ok: false, error: 'Password contains a common word or sequence. Choose something less guessable.' };
  }
  return { ok: true };
}

/** Normalise a typed phone number to the +E.164 form the API expects. */
export function normalizePhone(input: string): string {
  return input.replace(/[\s-]/g, '');
}

export const PHONE_HINT = 'International format, e.g. +254700000000';

export function isValidPhone(input: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhone(input));
}
