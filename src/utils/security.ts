/**
 * Security Utilities
 * Implements OWASP security best practices
 */

/**
 * Simple encryption for localStorage (client-side only)
 * Note: This is NOT secure for sensitive data - use backend encryption for production
 */
export function encryptData(data: string, key: string = 'hydrobox-secret'): string {
  try {
    // Simple XOR encryption (for demo purposes only)
    // In production, use proper encryption library or backend encryption
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted); // Base64 encode
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
}

/**
 * Simple decryption for localStorage
 */
export function decryptData(encryptedData: string, key: string = 'hydrobox-secret'): string {
  try {
    const decoded = atob(encryptedData); // Base64 decode
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password (client-side hashing before sending to server)
 * Note: In production, use bcrypt or argon2 on the backend
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Hashing error:', error);
    return password;
  }
}

/**
 * Secure session management
 */
export interface Session {
  userId: string;
  email: string;
  role: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}
const SESSION_KEY = 'hydrobox_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

/**
 * Create a new session
 */
export function createSession(userId: string, email: string, role: string): Session {
  const session: Session = {
    userId,
    email,
    role,
    token: generateSecureToken(),
    expiresAt: Date.now() + SESSION_DURATION,
    createdAt: Date.now()
  };

  // Store encrypted session
  const encrypted = encryptData(JSON.stringify(session));
  localStorage.setItem(SESSION_KEY, encrypted);
  return session;
}

/**
 * Get current session
 */
export function getSession(): Session | null {
  try {
    const encrypted = localStorage.getItem(SESSION_KEY);
    if (!encrypted) return null;
    const decrypted = decryptData(encrypted);
    const session: Session = JSON.parse(decrypted);

    // Check if session expired
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch (error) {
    console.error('Session retrieval error:', error);
    clearSession();
    return null;
  }
}

/**
 * Clear session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Refresh session expiration
 */
export function refreshSession(): void {
  const session = getSession();
  if (session) {
    session.expiresAt = Date.now() + SESSION_DURATION;
    const encrypted = encryptData(JSON.stringify(session));
    localStorage.setItem(SESSION_KEY, encrypted);
  }
}

/**
 * Content Security Policy headers (for documentation)
 * These should be set on the server side
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': ["default-src 'self'", "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Note: Remove unsafe-* in production
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data: https:", "font-src 'self' data:", "connect-src 'self'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"].join('; ')
};

/**
 * Security headers recommendations (for documentation)
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

/**
 * Prevent clickjacking
 */
export function preventClickjacking(): void {
  if (window.top !== window.self) {
    window.top!.location = window.self.location;
  }
}

/**
 * Detect and prevent common XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [/<script[^>]*>.*?<\/script>/gi, /javascript:/gi, /on\w+\s*=/gi, /<iframe/gi, /<object/gi, /<embed/gi, /eval\(/gi, /expression\(/gi];
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Log security events (for monitoring)
 */
export function logSecurityEvent(event: string, details: any): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // In production, send to security monitoring service
  console.warn('[SECURITY EVENT]', logEntry);

  // Store in localStorage for debugging (limit to last 100 events)
  try {
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    logs.unshift(logEntry);
    localStorage.setItem('security_logs', JSON.stringify(logs.slice(0, 100)));
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Initialize security measures
 */
export function initializeSecurity(): void {
  // Prevent clickjacking
  preventClickjacking();

  // Log initialization
  logSecurityEvent('SECURITY_INITIALIZED', {
    timestamp: Date.now()
  });
}