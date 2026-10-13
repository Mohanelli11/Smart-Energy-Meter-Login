export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  UTILITY_ADMIN = 'UTILITY_ADMIN',
  ENGINEER = 'ENGINEER',
  CUSTOMER = 'CUSTOMER',
  FINANCE = 'FINANCE',
}

export const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.UTILITY_ADMIN];

/** Staff roles an administrator can assign when creating an account. */
export const ASSIGNABLE_ROLES: Array<{ value: Role; label: string }> = [
  { value: Role.UTILITY_ADMIN, label: 'Administrator' },
  { value: Role.ENGINEER, label: 'Engineer' },
  { value: Role.FINANCE, label: 'Finance' },
];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/** The signed-in customer's meter (public fields only; credentials never leave the server). */
export interface MeterAccount {
  accountNo: string;
  meterNo: string;
  customerName: string;
  location: string;
  type: 'prepaid' | 'postpaid';
  consumption: string;
  balance: string;
  status: string;
}

export interface NewAccountInput {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: Role;
}

export type SessionKind = 'user' | 'meter';

export function hasRole(role: Role | undefined, allowed: Role[]): boolean {
  return role !== undefined && allowed.includes(role);
}

export function isAdmin(user: Pick<AuthUser, 'role'> | null | undefined): boolean {
  return hasRole(user?.role, ADMIN_ROLES);
}
