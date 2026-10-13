import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Config } from './config.js';
import type { Role, SessionKind } from './types.js';

const ISSUER = 'motech-auth';
const AUDIENCE = 'motech-app';

export interface AccessClaims {
  sub: string;
  kind: SessionKind;
  role: Role;
}

export interface RefreshClaims {
  sub: string;
  kind: SessionKind;
  jti: string;
  fam: string;
  rem: boolean;
}

export interface ResetClaims {
  sub: string;
  jti: string;
}

const verifyOptions = { algorithms: ['HS256' as const], issuer: ISSUER, audience: AUDIENCE };

export class TokenService {
  constructor(private readonly config: Config) {}

  signAccess(claims: AccessClaims): string {
    return jwt.sign({ kind: claims.kind, role: claims.role, typ: 'access' }, this.config.jwtSecret, {
      algorithm: 'HS256',
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: claims.sub,
      expiresIn: this.config.accessTtlSeconds
    });
  }

  verifyAccess(token: string): AccessClaims | null {
    try {
      const p = jwt.verify(token, this.config.jwtSecret, verifyOptions) as jwt.JwtPayload;
      if (p.typ !== 'access' || typeof p.sub !== 'string') return null;
      return { sub: p.sub, kind: p.kind, role: p.role };
    } catch {
      return null;
    }
  }

  signRefresh(claims: Omit<RefreshClaims, 'jti'> & { jti?: string }, ttlSeconds: number): { token: string; jti: string } {
    const jti = claims.jti ?? randomUUID();
    const token = jwt.sign({ kind: claims.kind, fam: claims.fam, rem: claims.rem, typ: 'refresh' }, this.config.jwtSecret, {
      algorithm: 'HS256',
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: claims.sub,
      jwtid: jti,
      expiresIn: ttlSeconds
    });
    return { token, jti };
  }

  verifyRefresh(token: string): RefreshClaims | null {
    try {
      const p = jwt.verify(token, this.config.jwtSecret, verifyOptions) as jwt.JwtPayload;
      if (p.typ !== 'refresh' || typeof p.sub !== 'string' || typeof p.jti !== 'string') return null;
      return { sub: p.sub, kind: p.kind, jti: p.jti, fam: p.fam, rem: Boolean(p.rem) };
    } catch {
      return null;
    }
  }

  signReset(userId: string, jti: string, ttlSeconds: number): string {
    return jwt.sign({ typ: 'pwd-reset' }, this.config.jwtSecret, {
      algorithm: 'HS256',
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: userId,
      jwtid: jti,
      expiresIn: ttlSeconds
    });
  }

  verifyReset(token: string): ResetClaims | null {
    try {
      const p = jwt.verify(token, this.config.jwtSecret, verifyOptions) as jwt.JwtPayload;
      if (p.typ !== 'pwd-reset' || typeof p.sub !== 'string' || typeof p.jti !== 'string') return null;
      return { sub: p.sub, jti: p.jti };
    } catch {
      return null;
    }
  }
}
