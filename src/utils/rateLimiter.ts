/**
 * Client-Side Rate Limiting Implementation
 * Prevents abuse and DoS attacks on the client side
 * Following OWASP best practices for rate limiting
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}
class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if an action is rate limited
   * @param key - Unique identifier (e.g., 'login:user@email.com', 'chat:userId')
   * @param config - Rate limit configuration
   * @returns Object with allowed status and remaining attempts
   */
  checkLimit(key: string, config: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetIn: number;
    error?: string;
  } {
    const now = Date.now();
    const entry = this.limits.get(key);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const resetIn = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetIn,
        error: `Too many attempts. Please try again in ${resetIn} seconds.`
      };
    }

    // No previous attempts or window expired
    if (!entry || now - entry.firstAttempt > config.windowMs) {
      this.limits.set(key, {
        attempts: 1,
        firstAttempt: now
      });
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetIn: Math.ceil(config.windowMs / 1000)
      };
    }

    // Increment attempts
    entry.attempts++;

    // Check if limit exceeded
    if (entry.attempts > config.maxAttempts) {
      entry.blockedUntil = now + config.blockDurationMs;
      this.limits.set(key, entry);
      const resetIn = Math.ceil(config.blockDurationMs / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetIn,
        error: `Rate limit exceeded. Blocked for ${resetIn} seconds.`
      };
    }
    this.limits.set(key, entry);
    return {
      allowed: true,
      remaining: config.maxAttempts - entry.attempts,
      resetIn: Math.ceil((config.windowMs - (now - entry.firstAttempt)) / 1000)
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.limits.forEach((entry, key) => {
      // Remove if window expired and not blocked
      if (!entry.blockedUntil && now - entry.firstAttempt > 3600000) {
        // 1 hour
        keysToDelete.push(key);
      }
      // Remove if block expired
      if (entry.blockedUntil && entry.blockedUntil < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.limits.delete(key));
  }

  /**
   * Destroy rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Login attempts: 5 attempts per 15 minutes, block for 30 minutes
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000
  },
  // AI Chat: 20 messages per minute, block for 2 minutes
  CHAT: {
    maxAttempts: 20,
    windowMs: 60 * 1000,
    blockDurationMs: 2 * 60 * 1000
  },
  // Form submissions: 10 per 5 minutes, block for 10 minutes
  FORM_SUBMIT: {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 10 * 60 * 1000
  },
  // Account creation: 3 per hour, block for 1 hour
  ACCOUNT_CREATE: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000
  },
  // Export operations: 10 per 5 minutes, block for 5 minutes
  EXPORT: {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 5 * 60 * 1000
  }
};

/**
 * Check login rate limit
 */
export function checkLoginRateLimit(email: string) {
  return rateLimiter.checkLimit(`login:${email.toLowerCase()}`, RATE_LIMITS.LOGIN);
}

/**
 * Check chat rate limit
 */
export function checkChatRateLimit(userId: string) {
  return rateLimiter.checkLimit(`chat:${userId}`, RATE_LIMITS.CHAT);
}

/**
 * Check form submission rate limit
 */
export function checkFormRateLimit(formType: string, userId: string) {
  return rateLimiter.checkLimit(`form:${formType}:${userId}`, RATE_LIMITS.FORM_SUBMIT);
}

/**
 * Check account creation rate limit
 */
export function checkAccountCreateRateLimit(ip: string = 'default') {
  return rateLimiter.checkLimit(`account:${ip}`, RATE_LIMITS.ACCOUNT_CREATE);
}

/**
 * Check export rate limit
 */
export function checkExportRateLimit(userId: string) {
  return rateLimiter.checkLimit(`export:${userId}`, RATE_LIMITS.EXPORT);
}

/**
 * Reset rate limit for a user
 */
export function resetRateLimit(key: string) {
  rateLimiter.reset(key);
}
export default rateLimiter;