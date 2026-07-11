import type { AuthUser } from '../types';

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  throw new Error('Authentication API integration will be implemented in Phase 2 backend integration.');
}

export function logout(): void {
  localStorage.removeItem('token');
}
