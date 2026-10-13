import apiClient, { toApiError } from '../../../services/api/client';
import type { AuthUser, MeterAccount, NewAccountInput, SessionKind } from '../types';

async function call<T>(fn: () => Promise<{ data: T }>): Promise<T> {
  try {
    return (await fn()).data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function login(email: string, password: string, remember = false): Promise<AuthUser> {
  const data = await call<{ user: AuthUser }>(() => apiClient.post('/auth/login', { email, password, remember }));
  return data.user;
}

export async function meterLogin(accountNo: string, password: string, remember = false): Promise<MeterAccount> {
  const data = await call<{ meter: MeterAccount }>(() => apiClient.post('/auth/meter-login', { accountNo, password, remember }));
  return data.meter;
}

/** Called on page load: asks the server which sessions are still alive (refreshing silently if needed). */
export async function restoreSession(): Promise<{ user: AuthUser | null; meter: MeterAccount | null }> {
  return call(() => apiClient.post('/auth/session', {}));
}

export async function logout(kind: SessionKind): Promise<void> {
  try {
    await apiClient.post('/auth/logout', { kind });
  } catch {
    // Even if the request fails the client forgets the session; the server-side token expires on its own.
  }
}

export async function requestPasswordReset(phone: string): Promise<{ resendAfterSeconds: number; expiresInSeconds: number }> {
  return call(() => apiClient.post('/auth/password-reset/request', { phone }));
}

export async function verifyResetCode(phone: string, otp: string): Promise<string> {
  const data = await call<{ resetToken: string }>(() => apiClient.post('/auth/password-reset/verify', { phone, otp }));
  return data.resetToken;
}

export async function confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
  await call(() => apiClient.post('/auth/password-reset/confirm', { resetToken, newPassword }));
}

export async function createStaffAccount(input: NewAccountInput): Promise<AuthUser> {
  const data = await call<{ user: AuthUser }>(() => apiClient.post('/admin/users', input));
  return data.user;
}
