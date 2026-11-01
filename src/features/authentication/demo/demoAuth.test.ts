import { beforeEach, describe, expect, it } from 'vitest';
import { Role } from '../types';
import { demoCreateStaffAccount, demoLogin, demoLogout, demoRestoreSession } from './demoAuth';

const ADMIN = 'motechembeddedengineering@gmail.com';

describe('demo auth', () => {
  beforeEach(async () => {
    await demoLogout();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('signs the built-in admin in and restores the session', async () => {
    const user = await demoLogin(` ${ADMIN.toUpperCase()} `, '@Testing');
    expect(user.role).toBe(Role.SUPER_ADMIN);
    expect((await demoRestoreSession()).user?.email).toBe(ADMIN);
  });

  it('rejects a wrong password and unknown email', async () => {
    await expect(demoLogin(ADMIN, 'nope')).rejects.toMatchObject({ status: 401 });
    await expect(demoLogin('x@y.co', '@Testing')).rejects.toMatchObject({ status: 401 });
    expect((await demoRestoreSession()).user).toBeNull();
  });

  it('lets the admin create accounts that can then sign in', async () => {
    await demoLogin(ADMIN, '@Testing');
    const created = await demoCreateStaffAccount({
      name: 'Jane Engineer', email: 'Jane@Example.com', phoneNumber: '+254700000000', password: 'Str0ng!Passw0rd', role: Role.ENGINEER,
    });
    expect(created.email).toBe('jane@example.com');
    await demoLogout();
    expect((await demoLogin('jane@example.com', 'Str0ng!Passw0rd')).role).toBe(Role.ENGINEER);
    expect(localStorage.getItem('motech.demo.users')).not.toContain('Str0ng!Passw0rd');
  });

  it('blocks account creation unless signed in as an admin and rejects duplicates', async () => {
    const input = { name: 'A', email: 'a@b.co', phoneNumber: '+254700000001', password: 'Str0ng!Passw0rd', role: Role.FINANCE };
    await expect(demoCreateStaffAccount(input)).rejects.toMatchObject({ status: 403 });
    await demoLogin(ADMIN, '@Testing');
    await demoCreateStaffAccount(input);
    await expect(demoCreateStaffAccount(input)).rejects.toMatchObject({ status: 409 });
    await demoLogout();
    await demoLogin('a@b.co', 'Str0ng!Passw0rd');
    await expect(demoCreateStaffAccount({ ...input, email: 'c@d.co' })).rejects.toMatchObject({ status: 403 });
  });
});
