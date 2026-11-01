# MoTech Auth API

Express + TypeScript service handling sign-in, sessions, password reset and account creation.

```bash
npm install
cp .env.example .env   # export the variables (JWT_SECRET etc.)
npm run seed           # first super admin + demo meters
npm run dev            # http://localhost:4000
npm test               # 22 tests (supertest + vitest)
```

All routes are under `/api`. Errors always look like `{ "error": { "code", "message" } }`. State-changing requests must be JSON and (when sent by a browser) come from an allowed origin.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `POST /auth/login` `{email,password,remember?}` | - | Staff sign-in; sets cookies |
| `POST /auth/meter-login` `{accountNo,password,remember?}` | - | Customer meter sign-in |
| `POST /auth/session` | cookies | Restore live sessions on page load |
| `POST /auth/refresh` `{kind}` | refresh cookie | Rotate tokens |
| `POST /auth/logout` `{kind}` | - | Revoke session, clear cookies |
| `POST /auth/password-reset/request` `{phone}` | - | Send SMS code (generic response) |
| `POST /auth/password-reset/verify` `{phone,otp}` | - | Exchange code for single-use reset token |
| `POST /auth/password-reset/confirm` `{resetToken,newPassword}` | - | Set new password, sign out everywhere |
| `GET /admin/users` | admin | List staff |
| `POST /admin/users` | admin | Create staff account |
| `GET /meters/me` | meter session | The signed-in customer's meter |
| `GET /meters/:accountNo` | admin | Look up a meter |
| `GET /health` | - | Liveness |

See `.env.example` for configuration. In production the process refuses to start without a 32+ char `JWT_SECRET`, `COOKIE_SECURE=true`, and a non-console SMS mode.
