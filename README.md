# MoTech Smart Energy Platform

Web dashboard and authentication API for the **MoTech smart-meter platform**: real-time energy monitoring, prepaid/postpaid meter management, and role-based access for staff and customers.

```
.
├── src/        React 18 + TypeScript + Vite + Tailwind web app
├── server/     Express + TypeScript authentication API (cookies, sessions, password reset)
└── docs/       Architecture notes and legacy docs
```

## Quick start

Requires Node.js 20+ (`.nvmrc`).

```bash
# 1. Install
npm install
npm --prefix server install

# 2. Configure the API (see server/.env.example for every option)
cd server
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
export ADMIN_EMAIL=you@example.com ADMIN_PHONE=+254700000000
npm run seed          # creates the first super admin + demo meters
                      # prints a generated admin password ONCE; meter passwords go to server/data/meter-credentials.csv
npm run dev           # API on http://localhost:4000
cd ..

# 3. Start the web app (proxies /api to the API)
npm run dev           # http://localhost:3000
```

There are **no default credentials**. The seed script generates strong random passwords and never overwrites existing accounts. Treat `server/data/` as secret (it is git-ignored).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Web dev server (port 3000) |
| `npm run build` | Type-check, then production build to `dist/` |
| `npm run lint` / `typecheck` / `test` | ESLint, `tsc`, Vitest (React Testing Library) |
| `npm run server:dev` / `server:test` | Run / test the auth API |

CI (`.github/workflows/ci.yml`) runs lint, types, tests and builds for both packages, plus `npm audit`.

## How authentication works

- Passwords are verified **only on the server** (scrypt hashes, constant-time compare, identical error for unknown user vs. wrong password).
- Sign-in sets **httpOnly, Secure, SameSite cookies**: a short-lived access token and a rotating refresh token. Nothing sensitive is readable from JavaScript or stored in `localStorage`.
- Refresh tokens rotate on every use; replaying an old one revokes the whole session family.
- **"Keep me signed in"** makes the refresh cookie persistent (30 days); otherwise it ends with the browser session.
- Brute-force protection: per-account+IP lockout (5 failures → 15 min) plus a per-IP request limit.
- **Password reset** uses an SMS one-time code (6 digits, 5 min, 5 attempts, resend cooldown, hashed at rest) that yields a single-use reset token; completing it signs the user out everywhere.
- Roles: `SUPER_ADMIN`, `UTILITY_ADMIN`, `ENGINEER`, `FINANCE` (staff) and `CUSTOMER` (meter sessions). Only admins can create accounts; only a super admin can create another super admin.
- Staff and customer (meter) sessions are independent and cannot access each other's routes.
- Password policy: 10+ characters, 3 of 4 character classes, no common words.

Full endpoint list: [`server/README.md`](server/README.md).

## Deployment

1. Deploy `server/` (Node 20+) with `NODE_ENV=production`, a strong `JWT_SECRET`, HTTPS, `CORS_ORIGIN`, and `SMS_MODE=webhook` (the API refuses to start in production with unsafe settings). Set `TRUST_PROXY` to your proxy hop count.
2. Deploy the web app (`npm run build` → `dist/`). `netlify.toml` includes security headers (CSP, HSTS, etc.). Proxy `/api/*` to the API so cookies are same-site.
3. **Storage:** the server persists users/meters to a JSON file behind a small `Store` interface (`server/src/store.ts`). For production, implement that interface on a real database and run a shared lockout/session store if you run more than one API instance.

## Known limitations

- The dashboard's meter lists, payments and telemetry are still simulated client-side demo data; only authentication and account creation use the API.
- Lockout counters and refresh-token records are in-memory (reset on restart, not shared between instances).
- No multi-factor authentication yet.

## License

Proprietary software of **MoTech Electrical and Electronics Engineering Solutions**. Support: motechembeddedengineering@gmail.com
