import type { AuthState } from '../features/authentication/types';

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};
