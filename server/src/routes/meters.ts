import { Router } from 'express';
import { errorBody, requireAuth } from '../middleware.js';
import type { SessionService } from '../session.js';
import type { Store } from '../store.js';
import type { AccessClaims } from '../tokens.js';
import { ADMIN_ROLES, toPublicMeter } from '../types.js';

export function meterRouter(deps: { store: Store; session: SessionService }): Router {
  const { store, session } = deps;
  const router = Router();

  /** The signed-in customer's own meter. */
  router.get('/me', requireAuth(session, 'meter'), async (_req, res, next) => {
    try {
      const auth = res.locals.auth as AccessClaims;
      const meter = await store.findMeter(auth.sub.replace(/^meter:/, ''));
      if (!meter) return void res.status(404).json(errorBody('not_found', 'Meter not found.'));
      res.json({ meter: toPublicMeter(meter) });
    } catch (err) {
      next(err);
    }
  });

  /** Staff lookup of any meter by account number. */
  router.get('/:accountNo', requireAuth(session, 'user', ADMIN_ROLES), async (req, res, next) => {
    try {
      const meter = await store.findMeter(String(req.params.accountNo).toUpperCase());
      if (!meter) return void res.status(404).json(errorBody('not_found', 'Meter not found.'));
      res.json({ meter: toPublicMeter(meter) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
