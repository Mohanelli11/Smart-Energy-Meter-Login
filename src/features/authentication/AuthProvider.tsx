import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from '../../services/api/client';
import * as authService from './services/auth.service';
import type { AuthUser, MeterAccount, SessionKind } from './types';

export interface AuthContextValue {
  /** 'loading' until the first session check completes. */
  status: 'loading' | 'ready';
  user: AuthUser | null;
  meter: MeterAccount | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  meterLogin: (accountNo: string, password: string, remember?: boolean) => Promise<MeterAccount>;
  logout: (kind?: SessionKind) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [meter, setMeter] = useState<MeterAccount | null>(null);

  // Restore sessions from the httpOnly cookies on first load.
  useEffect(() => {
    let cancelled = false;
    authService
      .restoreSession()
      .then((s) => {
        if (cancelled) return;
        setUser(s.user);
        setMeter(s.meter);
      })
      .catch(() => {
        /* server unreachable: treat as signed out */
      })
      .finally(() => {
        if (!cancelled) setStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The API client fires this when a refresh fails mid-session.
  useEffect(() => {
    const onExpired = (e: Event) => {
      const kind = (e as CustomEvent<{ kind: SessionKind }>).detail?.kind;
      if (kind === 'meter') setMeter(null);
      else setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const u = await authService.login(email, password, remember);
    setUser(u);
    return u;
  }, []);

  const meterLogin = useCallback(async (accountNo: string, password: string, remember = false) => {
    const m = await authService.meterLogin(accountNo, password, remember);
    setMeter(m);
    return m;
  }, []);

  const logout = useCallback(async (kind: SessionKind = 'user') => {
    await authService.logout(kind);
    if (kind === 'meter') setMeter(null);
    else setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, meter, isAuthenticated: user !== null, login, meterLogin, logout }),
    [status, user, meter, login, meterLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
