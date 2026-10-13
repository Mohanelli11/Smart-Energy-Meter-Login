import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Config } from './config.js';
import type { SessionService } from './session.js';
import type { Role, SessionKind } from './types.js';
import type { AccessClaims } from './tokens.js';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
  }
}

export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth (on top of SameSite cookies): state-changing requests must be JSON
 * and, when the browser sends an Origin header, it must be an allowed origin or this host.
 */
export function originCheck(config: Config): RequestHandler {
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = req.headers.origin;
    if (origin) {
      let host = '';
      try {
        host = new URL(origin).host;
      } catch {
        /* invalid origin falls through to rejection */
      }
      const allowed = config.allowedOrigins.includes(origin) || (host !== '' && host === req.headers.host);
      if (!allowed) return void res.status(403).json(errorBody('bad_origin', 'Request origin not allowed.'));
    }
    if (req.headers['content-length'] !== '0' && req.body !== undefined && !req.is('application/json')) {
      return void res.status(415).json(errorBody('unsupported_media_type', 'Content-Type must be application/json.'));
    }
    next();
  };
}

export function requireAuth(session: SessionService, kind: SessionKind, roles?: Role[]): RequestHandler {
  return (req, res, next) => {
    const claims = session.readAccess(req, kind);
    if (!claims) return void res.status(401).json(errorBody('unauthenticated', 'Authentication required.'));
    if (roles && !roles.includes(claims.role)) {
      return void res.status(403).json(errorBody('forbidden', 'You do not have permission to do that.'));
    }
    res.locals.auth = claims satisfies AccessClaims;
    next();
  };
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json(errorBody('not_found', 'Not found.'));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    if (err.retryAfterSeconds) res.setHeader('Retry-After', String(err.retryAfterSeconds));
    return void res.status(err.status).json(errorBody(err.code, err.message));
  }
  if (err?.type === 'entity.too.large') return void res.status(413).json(errorBody('too_large', 'Request body too large.'));
  if (err?.type === 'entity.parse.failed') return void res.status(400).json(errorBody('bad_json', 'Malformed JSON body.'));
  console.error('[error]', err);
  res.status(500).json(errorBody('internal', 'Something went wrong.'));
};

/** Structured audit log line. Never pass passwords, tokens or full contact details. */
export function audit(event: string, fields: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === 'test') return;
  console.info(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  return phone.length > 6 ? `${phone.slice(0, 4)}***${phone.slice(-2)}` : '***';
}
