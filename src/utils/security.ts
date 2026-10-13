/**
 * Client-side security helpers.
 *
 * Authentication, sessions, password hashing and rate limiting all live on the server.
 * Nothing in this file stores credentials or tokens in the browser.
 */

/** Generate a cryptographically random hex string (for non-secret identifiers such as request IDs). */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Detect common XSS patterns in free-text input (defence in depth; always escape on output too). */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
  ];
  return xssPatterns.some((pattern) => pattern.test(input));
}

const SENSITIVE_KEYS = /pass(word)?|token|secret|otp|email|phone|authorization/i;

/** Remove anything that could identify a person or carry a credential before it is logged. */
function redact(details: unknown): unknown {
  if (details === null || typeof details !== 'object') return details;
  return Object.fromEntries(
    Object.entries(details as Record<string, unknown>).map(([k, v]) => [k, SENSITIVE_KEYS.test(k) ? '[redacted]' : redact(v)])
  );
}

/**
 * Record a security-relevant UI event. Development builds print a redacted line to the console;
 * production builds strip console output, and nothing is ever written to browser storage.
 * Wire this to a monitoring service (e.g. Sentry) if client-side telemetry is needed.
 */
export function logSecurityEvent(event: string, details: unknown = {}): void {
  if (import.meta.env.DEV) {
    console.warn('[security]', event, redact(details));
  }
}
