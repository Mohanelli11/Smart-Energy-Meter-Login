export const ROLES = ['SUPER_ADMIN', 'UTILITY_ADMIN', 'ENGINEER', 'FINANCE', 'CUSTOMER'] as const;
export type Role = (typeof ROLES)[number];

/** Which kind of session a token/cookie pair belongs to. Staff and meter sessions are independent. */
export type SessionKind = 'user' | 'meter';

export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'UTILITY_ADMIN'];

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** E.164 phone number, e.g. +254700000000 */
  phone: string;
  passwordHash: string;
  disabled?: boolean;
  createdAt: string;
}

export interface MeterRecord {
  accountNo: string;
  meterNo: string;
  customerName: string;
  location: string;
  type: 'prepaid' | 'postpaid';
  consumption: string;
  balance: string;
  status: string;
  passwordHash: string;
}

export interface RefreshRecord {
  jti: string;
  familyId: string;
  subject: string;
  kind: SessionKind;
  remember: boolean;
  expiresAt: number;
  revoked: boolean;
  replacedBy?: string;
  rotatedAt?: number;
}

export interface OtpRecord {
  phone: string;
  userId: string | null;
  codeDigest: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

export interface ResetGrant {
  jti: string;
  userId: string;
  expiresAt: number;
  used: boolean;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type PublicMeter = Omit<MeterRecord, 'passwordHash'>;

export function toPublicUser(u: UserRecord): PublicUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

export function toPublicMeter(m: MeterRecord): PublicMeter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = m;
  return rest;
}
