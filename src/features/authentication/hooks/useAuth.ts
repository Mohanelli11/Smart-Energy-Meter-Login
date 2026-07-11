import { initialAuthState } from '../../../store/auth.store';

export function useAuth() {
  return {
    ...initialAuthState,
    login: async () => undefined,
    logout: () => undefined,
  };
}
