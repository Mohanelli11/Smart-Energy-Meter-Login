import { randomUUID } from 'node:crypto';
import { Router, type Request, type RequestHandler, type Response } from 'express';
import { z } from 'zod';
import type { Config } from '../config.js';
import { audit, HttpError, maskEmail, requireAuth } from '../middleware.js';
import { checkPasswordStrength, hashPassword } from '../passwords.js';
import type { SessionService } from '../session.js';
import type { Store } from '../store.js';
import type { AccessClaims } from '../tokens.js';
import { ADMIN_ROLES, toPublicUser, type Role } from '../types.js';

const STAFF_ROLES = ['SUPER_ADMIN', 'UTILITY_ADMIN', 'ENGINEER', 'FINANCE'] as const;

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phoneNumber: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, 'Enter the phone number in international format, e.g. +254700000000.')),
  password: z.string().max(128),
  role: z.enum(STAFF_ROLES)
});

export function adminRouter(deps: { config: Config; store: Store; session: SessionService }): Router {
  const { config, store, session } = deps;
  const router = Router();
  router.use(requireAuth(session, 'user', ADMIN_ROLES));

  const handler =
    (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
    (req, res, next) => {
      fn(req, res).catch(next);
    };

  router.get(
    '/users',
    handler(async (_req, res) => {
      const users = await store.listUsers();
      res.json({ users: users.map(toPublicUser) });
    })
  );

  router.post(
    '/users',
    handler(async (req, res) => {
      const auth = res.locals.auth as AccessClaims;
      const parsed = createUserSchema.safeParse(req.body ?? {});
      if (!parsed.success) throw new HttpError(400, 'invalid_request', parsed.error.issues[0]?.message ?? 'Invalid request.');
      const input = parsed.data;

      // Only a super admin can mint another super admin.
      if (input.role === 'SUPER_ADMIN' && auth.role !== 'SUPER_ADMIN') {
        throw new HttpError(403, 'forbidden', 'Only a super administrator can create a super administrator.');
      }
      const strength = checkPasswordStrength(input.password);
      if (!strength.ok) throw new HttpError(400, 'weak_password', strength.error!);

      if (await store.findUserByEmail(input.email)) throw new HttpError(409, 'email_taken', 'An account with this email already exists.');
      if (await store.findUserByPhone(input.phoneNumber)) throw new HttpError(409, 'phone_taken', 'An account with this phone number already exists.');

      const user = {
        id: randomUUID(),
        email: input.email,
        name: input.name,
        role: input.role as Role,
        phone: input.phoneNumber,
        passwordHash: await hashPassword(input.password, config.scryptN),
        createdAt: new Date().toISOString()
      };
      await store.createUser(user);
      audit('user_created', { by: auth.sub, userId: user.id, role: user.role, email: maskEmail(user.email) });
      res.status(201).json({ user: toPublicUser(user) });
    })
  );

  return router;
}
