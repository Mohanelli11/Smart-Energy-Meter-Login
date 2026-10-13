# Authentication architecture

Status: **implemented** (see `server/` and `src/features/authentication/`).

- Server-side credential verification (scrypt), cookie sessions with rotating refresh tokens and reuse detection.
- SMS one-time-code password reset, lockout and per-IP rate limiting, role model with admin-only account creation.
- Frontend: `AuthProvider` / `useAuth`, `react-router` routes, `ProtectedRoute` with role checks.

Still to do: multi-factor authentication, a persistent database `Store`, shared (Redis) lockout/session state, and moving the remaining demo data behind the API.
