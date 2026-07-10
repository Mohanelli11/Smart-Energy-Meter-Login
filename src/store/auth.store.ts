import type { AuthState, AuthUser } from '../features/authentication/types';
import { removeToken, setToken } from '../features/authentication/services/token.service';

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

export function createAuthActions() {
  let state = initialAuthState;

  return {
    getState: () => state,
    login: (user: AuthUser, token: string) => {
      setToken(token);
      state = {
        user,
        token,
        isAuthenticated: true,
      };
    },
    logout: () => {
      removeToken();
      state = initialAuthState;
    },
  };
}
