export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  UTILITY_ADMIN = 'UTILITY_ADMIN',
  ENGINEER = 'ENGINEER',
  CUSTOMER = 'CUSTOMER',
  FINANCE = 'FINANCE',
}
export interface AuthUser {
  id?: string;
  email: string;
  name: string;
  role: Role;
}
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}