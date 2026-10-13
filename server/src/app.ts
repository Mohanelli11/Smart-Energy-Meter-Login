import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { Config } from './config.js';
import { errorBody, errorHandler, notFound, originCheck } from './middleware.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { meterRouter } from './routes/meters.js';
import { SessionService } from './session.js';
import type { SmsProvider } from './sms.js';
import type { Store } from './store.js';
import { TokenService } from './tokens.js';

export interface AppDeps {
  config: Config;
  store: Store;
  sms: SmsProvider | null;
}

export function createApp({ config, store, sms }: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      // This service only returns JSON; lock everything down.
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: config.cookieSecure ? { maxAge: 31536000, includeSubDomains: true } : false
    })
  );
  app.use(
    cors({
      origin: config.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type']
    })
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(originCheck(config));

  const tokens = new TokenService(config);
  const session = new SessionService(config, store, tokens);

  app.get('/api/health', (_req, res) => void res.json({ status: 'ok' }));

  const authLimiter = rateLimit({
    windowMs: config.ipRateLimitWindowSeconds * 1000,
    limit: config.ipRateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => void res.status(429).json(errorBody('rate_limited', 'Too many requests. Please slow down and try again shortly.'))
  });

  app.use('/api/auth', authLimiter, authRouter({ config, store, tokens, session, sms }));
  app.use('/api/admin', adminRouter({ config, store, session }));
  app.use('/api/meters', meterRouter({ store, session }));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
