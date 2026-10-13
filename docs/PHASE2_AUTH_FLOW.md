# Authentication flow

```
Browser ──POST /api/auth/login──▶ API  verify scrypt hash, lockout check
        ◀─ Set-Cookie (httpOnly access + refresh) ─┘
Browser ──any request (cookies sent automatically)──▶ API  verifies access JWT
        ◀─ 401 ─ client calls /auth/refresh once ─ retries, else routes to /login
Logout  ──POST /api/auth/logout──▶ API  revokes refresh family, clears cookies
```

Password reset: `request` (SMS code) → `verify` (code → single-use reset token) → `confirm` (new password; all sessions revoked).
