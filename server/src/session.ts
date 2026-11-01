import { randomUUID } from 'node:crypto';
import type { CookieOptions, Request, Response } from 'express';
import type { Config } from './config.js';
import type { Store } from './store.js';
import type { AccessClaims, TokenService } from './tokens.js';
import { toPublicMeter, toPublicUser, type PublicMeter, type PublicUser, type Role, type SessionKind } from './types.js';

export function cookieNames(kind: SessionKind) {
  const p = kind === 'user' ? 'motech_u' : 'motech_m';
  return { access: `${p}_at`, refresh: `${p}_rt` };
}

export interface Principal {
  sub: string;
  role: Role;
  user?: PublicUser;
  meter?: PublicMeter;
}

export class SessionService {
  constructor(
    private readonly config: Config,
    private readonly store: Store,
    private readonly tokens: TokenService
  ) {}

  private baseCookie(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.cookieSecure,
      sameSite: this.config.cookieSameSite,
      domain: this.config.cookieDomain
    };
  }

  private setCookies(res: Response, kind: SessionKind, access: string, refresh: string, remember: boolean, refreshTtlSeconds: number) {
    const names = cookieNames(kind);
    res.cookie(names.access, access, { ...this.baseCookie(), path: '/api', maxAge: this.config.accessTtlSeconds * 1000 });
    res.cookie(names.refresh, refresh, {
      ...this.baseCookie(),
      path: '/api/auth',
      // Persistent cookie only when "Remember me" is ticked; otherwise it ends with the browser session.
      ...(remember ? { maxAge: refreshTtlSeconds * 1000 } : {})
    });
  }

  clearCookies(res: Response, kind: SessionKind) {
    const names = cookieNames(kind);
    res.clearCookie(names.access, { ...this.baseCookie(), path: '/api' });
    res.clearCookie(names.refresh, { ...this.baseCookie(), path: '/api/auth' });
  }

  /** Start a brand-new session (new refresh-token family). */
  async issue(res: Response, args: { sub: string; kind: SessionKind; role: Role; remember: boolean }) {
    await this.mint(res, { ...args, familyId: randomUUID() });
  }

  private async mint(res: Response, args: { sub: string; kind: SessionKind; role: Role; remember: boolean; familyId: string }) {
    const ttl = args.remember ? this.config.rememberTtlSeconds : this.config.refreshTtlSeconds;
    const { token: refresh, jti } = this.tokens.signRefresh({ sub: args.sub, kind: args.kind, fam: args.familyId, rem: args.remember }, ttl);
    await this.store.saveRefresh({
      jti,
      familyId: args.familyId,
      subject: args.sub,
      kind: args.kind,
      remember: args.remember,
      expiresAt: Date.now() + ttl * 1000,
      revoked: false
    });
    const access = this.tokens.signAccess({ sub: args.sub, kind: args.kind, role: args.role });
    this.setCookies(res, args.kind, access, refresh, args.remember, ttl);
    return jti;
  }

  readAccess(req: Request, kind: SessionKind): AccessClaims | null {
    const raw = req.cookies?.[cookieNames(kind).access];
    if (typeof raw !== 'string') return null;
    const claims = this.tokens.verifyAccess(raw);
    return claims && claims.kind === kind ? claims : null;
  }

  /** Look up the live account behind a subject so disabled/deleted accounts lose access immediately. */
  async resolve(sub: string, kind: SessionKind): Promise<Principal | null> {
    if (kind === 'user' && sub.startsWith('user:')) {
      const user = await this.store.findUserById(sub.slice(5));
      if (!user || user.disabled) return null;
      return { sub, role: user.role, user: toPublicUser(user) };
    }
    if (kind === 'meter' && sub.startsWith('meter:')) {
      const meter = await this.store.findMeter(sub.slice(6));
      if (!meter) return null;
      return { sub, role: 'CUSTOMER', meter: toPublicMeter(meter) };
    }
    return null;
  }

  /**
   * Rotate the refresh token: the presented token is retired and a new pair is issued.
   * Presenting an already-rotated token outside the grace window is treated as theft and
   * revokes the whole family.
   */
  async rotate(req: Request, res: Response, kind: SessionKind): Promise<Principal | null> {
    const raw = req.cookies?.[cookieNames(kind).refresh];
    if (typeof raw !== 'string') return null;
    const claims = this.tokens.verifyRefresh(raw);
    if (!claims || claims.kind !== kind) return null;

    const rec = await this.store.getRefresh(claims.jti);
    if (!rec || rec.kind !== kind) return null;
    if (rec.revoked) {
      const withinGrace = rec.replacedBy && rec.rotatedAt !== undefined && Date.now() - rec.rotatedAt < this.config.refreshGraceSeconds * 1000;
      if (!withinGrace) await this.store.revokeFamily(rec.familyId);
      return null;
    }
    if (rec.expiresAt <= Date.now()) return null;

    const principal = await this.resolve(rec.subject, kind);
    if (!principal) {
      await this.store.revokeFamily(rec.familyId);
      return null;
    }
    const newJti = await this.mint(res, { sub: rec.subject, kind, role: principal.role, remember: rec.remember, familyId: rec.familyId });
    await this.store.markRefreshReplaced(rec.jti, newJti);
    return principal;
  }

  async revoke(req: Request, res: Response, kind: SessionKind) {
    const raw = req.cookies?.[cookieNames(kind).refresh];
    if (typeof raw === 'string') {
      const claims = this.tokens.verifyRefresh(raw);
      if (claims) await this.store.revokeFamily(claims.fam);
    }
    this.clearCookies(res, kind);
  }
}
