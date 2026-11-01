/**
 * Demo sign-in that runs entirely in the browser (no API server).
 *
 * Enabled only when the web app is built with VITE_DEMO_MODE=true. This is NOT real security:
 * everything here ships to the browser, so anyone can read the built-in login out of the site's
 * code. Use it to show the product with sample data only. Accounts created by the demo admin are
 * stored in this browser's localStorage and are not shared with other devices.
 */
import { ApiError } from '../../../services/api/client';
import { Role, type AuthUser, type MeterAccount, type NewAccountInput } from '../types';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const USERS_KEY = 'motech.demo.users';
const SESSION_KEY = 'motech.demo.session';

interface DemoUser extends AuthUser {
  hash: string;
}

/** SHA-256 of "motech-demo:<email>:<password>" so the password is not stored as plain text. */
async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`motech-demo:${email.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const BUILT_IN_ADMIN: DemoUser = {
  id: 'demo-admin',
  email: 'motechembeddedengineering@gmail.com',
  name: 'MOTECH Administrator',
  role: Role.SUPER_ADMIN,
  hash: '5a07bdd802e057638c1a68bbe28c61ee5301d5a47719569c74725343ae14e86e',
};

function readUsers(): DemoUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as DemoUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: DemoUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    throw new ApiError(500, 'storage', 'Could not save the account in this browser.');
  }
}

function allUsers(): DemoUser[] {
  return [BUILT_IN_ADMIN, ...readUsers()];
}

function publicUser(u: DemoUser): AuthUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

function readSessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function demoLogin(email: string, password: string, remember = false): Promise<AuthUser> {
  const clean = email.trim().toLowerCase();
  const hash = await hashPassword(clean, password);
  const user = allUsers().find((u) => u.email === clean && u.hash === hash);
  if (!user) throw new ApiError(401, 'invalid_credentials', 'Incorrect email or password.');
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, user.id);
  } catch {
    /* storage blocked: the session just won't survive a reload */
  }
  return publicUser(user);
}

export async function demoRestoreSession(): Promise<{ user: AuthUser | null; meter: MeterAccount | null }> {
  const id = readSessionId();
  const user = id ? allUsers().find((u) => u.id === id) : undefined;
  return { user: user ? publicUser(user) : null, meter: null };
}

export async function demoLogout(): Promise<void> {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clear */
  }
}

export async function demoCreateStaffAccount(input: NewAccountInput): Promise<AuthUser> {
  const id = readSessionId();
  const actor = id ? allUsers().find((u) => u.id === id) : undefined;
  if (!actor || (actor.role !== Role.SUPER_ADMIN && actor.role !== Role.UTILITY_ADMIN)) {
    throw new ApiError(403, 'forbidden', 'Only an administrator can create accounts.');
  }
  if (input.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
    throw new ApiError(403, 'forbidden', 'Only a super admin can create another super admin.');
  }
  const email = input.email.trim().toLowerCase();
  if (allUsers().some((u) => u.email === email)) {
    throw new ApiError(409, 'email_taken', 'An account with this email already exists.');
  }
  const created: DemoUser = {
    id: `demo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    email,
    name: input.name.trim(),
    role: input.role,
    hash: await hashPassword(email, input.password),
  };
  writeUsers([...readUsers(), created]);
  return publicUser(created);
}

export function demoUnavailable(feature: string): ApiError {
  return new ApiError(503, 'demo_mode', `${feature} is not available yet. Please contact MOTECH support.`);
}
