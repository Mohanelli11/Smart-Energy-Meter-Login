# Security Implementation Guide

## Overview
This document outlines the security measures implemented in the MoTech Electrical and Electronics Engineering Solutions SmartMeter application following OWASP best practices.

## Security Features Implemented

### 1. Input Validation & Sanitization

#### Implementation
- **Location**: `utils/validation.ts`
- **Coverage**: All user inputs (forms, chat messages, login credentials)
- **Methods**:
  - Schema-based validation with strict type checking
  - Length limits on all text inputs
  - Format validation (email, phone, account numbers)
  - Regex pattern matching for allowed characters
  - Rejection of unexpected fields

#### Validation Rules
```typescript
- Email: RFC 5322 compliant, 5-254 characters
- Password: 8-128 characters, must contain uppercase, lowercase, number, special char
- Phone: 10-15 digits, international format
- Account/Meter Numbers: 5-50 alphanumeric + hyphens
- Customer Name: 2-100 characters, safe characters only
- Location: 2-200 characters, safe characters only
- Chat Messages: 1-500 characters
- Comments: 0-1000 characters
```

#### XSS Prevention
- HTML entity encoding for all displayed user content
- Removal of dangerous patterns (script tags, event handlers, javascript: protocol)
- Content Security Policy headers (documented for server implementation)

### 2. Rate Limiting

#### Implementation
- **Location**: `utils/rateLimiter.ts`
- **Type**: Client-side rate limiting with configurable limits
- **Storage**: In-memory with automatic cleanup

#### Rate Limit Configurations

| Action | Max Attempts | Window | Block Duration |
|--------|-------------|--------|----------------|
| Login | 5 | 15 min | 30 min |
| AI Chat | 20 | 1 min | 2 min |
| Form Submit | 10 | 5 min | 10 min |
| Account Create | 3 | 1 hour | 1 hour |
| Export | 10 | 5 min | 5 min |

#### Features
- IP-based and user-based tracking
- Graceful 429 responses with countdown timers
- Automatic cleanup of expired entries
- Reset capability for successful operations

### 3. Authentication Security

#### Current Implementation (Client-Side)
⚠️ **Note**: Current implementation is client-side only. For production, implement server-side authentication.

**Implemented**:
- Rate-limited login attempts
- Input validation on credentials
- Session management with expiration (8 hours)
- Encrypted session storage
- Security event logging

**Recommended for Production**:
- Move authentication to backend API
- Implement JWT or session-based auth
- Use bcrypt/argon2 for password hashing
- Implement 2FA/MFA
- Add password reset functionality
- Implement account lockout after failed attempts

### 4. Session Management

#### Implementation
- **Location**: `utils/security.ts`
- **Features**:
  - Secure token generation using crypto.getRandomValues()
  - Session expiration (8 hours default)
  - Encrypted session storage in localStorage
  - Automatic session refresh
  - Session cleanup on logout

#### Session Structure
```typescript
{
  userId: string
  email: string
  role: string
  token: string (32-byte random)
  expiresAt: timestamp
  createdAt: timestamp
}
```

### 5. Data Encryption

#### Client-Side Encryption
- **Location**: `utils/security.ts`
- **Method**: XOR cipher with Base64 encoding
- **Usage**: Session data, sensitive localStorage items

⚠️ **Important**: Current encryption is basic and suitable for client-side only. For production:
- Use proper encryption libraries (e.g., crypto-js, tweetnacl)
- Implement backend encryption for sensitive data
- Use HTTPS for all communications
- Consider end-to-end encryption for sensitive operations

### 6. Security Logging

#### Implementation
- **Location**: `utils/security.ts`
- **Events Logged**:
  - Login attempts (success/failure)
  - Rate limit violations
  - Validation failures
  - Form submissions
  - Export operations
  - Security initialization

#### Log Structure
```typescript
{
  timestamp: ISO string
  event: string
  details: object
  userAgent: string
  url: string
}
```

#### Storage
- Stored in localStorage (last 100 events)
- In production, send to security monitoring service (e.g., Sentry, LogRocket)

### 7. Environment Variables

#### Implementation
- **File**: `.env.example`
- **Purpose**: Template for secure configuration
- **Usage**: Copy to `.env.local` and configure

#### Security Rules
1. Never commit `.env.local` to version control
2. Use different keys for development and production
3. Rotate keys regularly
4. No sensitive keys in client-side code
5. Use backend proxy for API calls requiring keys

### 8. Content Security Policy

#### Recommended Headers (Server-Side)
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'
```

#### Additional Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 9. API Access Management (NEW)

#### Implementation
- **Location**: `utils/apiAccessStorage.ts`, `components/ApiManagement.tsx`
- **Features**:
  - Admin-only API key generation
  - User request workflow (pending → approved/rejected)
  - API key storage with localStorage persistence
  - Request tracking and audit trail

#### Access Control
- Only admin users can access API management features directly
- Non-admin users must request API access
- Admin reviews and approves/rejects requests
- Approved users receive a unique API key

#### API Key Format
```
hb_live_[random_9_chars]_[timestamp]
```

#### Security Considerations
- API keys are stored in localStorage (client-side demo)
- In production, implement server-side key management
- Keys should be rotated periodically
- Implement rate limiting per API key

### 10. Meter Remote Control Security (NEW)

#### Implementation
- **Location**: `utils/commandQueue.ts`, `components/MeterCommandControl.tsx`
- **Features**:
  - Command queue with serial execution
  - Command state tracking (queued, processing, completed, expired, failed)
  - User attribution for audit trail
  - Automatic command expiration

#### Command Queue Rules
1. Only one command can be "processing" at a time per meter
2. Commands are executed via NB-IoT/LoRa communication
3. When a command completes successfully, the next queued command expires
4. If a command is not executed by the next meter report, the next command moves to processing

#### Security Measures
- All commands are attributed to the user who initiated them
- Command history is persisted for audit purposes
- Commands cannot be modified once queued
- Only authorized users can send commands

## Security Checklist

### ✅ Implemented
- [x] Input validation on all forms
- [x] Input sanitization (XSS prevention)
- [x] Rate limiting on critical operations
- [x] Client-side session management
- [x] Security event logging
- [x] Clickjacking prevention
- [x] Environment variable template
- [x] Password strength validation
- [x] Length limits on all inputs
- [x] Type checking and schema validation

### 🔄 Recommended for Production

#### High Priority
- [ ] Move authentication to backend
- [ ] Implement HTTPS/TLS
- [ ] Server-side rate limiting
- [ ] Backend input validation
- [ ] Proper password hashing (bcrypt/argon2)
- [ ] CSRF protection
- [ ] SQL injection prevention (if using database)
- [ ] API authentication (JWT/OAuth)

#### Medium Priority
- [ ] Two-factor authentication (2FA)
- [ ] Account lockout mechanism
- [ ] Password reset functionality
- [ ] Security monitoring/alerting
- [ ] Audit logging
- [ ] Regular security audits
- [ ] Penetration testing

#### Low Priority
- [ ] Biometric authentication
- [ ] Advanced threat detection
- [ ] DDoS protection
- [ ] Web Application Firewall (WAF)

## OWASP Top 10 Coverage

| Risk | Status | Implementation |
|------|--------|----------------|
| A01:2021 – Broken Access Control | ✅ Partial | Client-side role checks, needs backend |
| A02:2021 – Cryptographic Failures | ✅ Partial | Basic encryption, needs improvement |
| A03:2021 – Injection | ✅ Implemented | Input validation & sanitization |
| A04:2021 – Insecure Design | ✅ Implemented | Security-first architecture |
| A05:2021 – Security Misconfiguration | ✅ Documented | CSP and security headers documented |
| A06:2021 – Vulnerable Components | ⚠️ Ongoing | Regular dependency updates needed |
| A07:2021 – Auth Failures | ✅ Partial | Rate limiting, needs backend auth |
| A08:2021 – Software/Data Integrity | ✅ Partial | Input validation, needs signing |
| A09:2021 – Logging Failures | ✅ Implemented | Security event logging |
| A10:2021 – SSRF | N/A | No server-side requests in client app |

## Testing Security

### Manual Testing
1. **Input Validation**: Try submitting forms with invalid data
2. **Rate Limiting**: Attempt rapid submissions/logins
3. **XSS**: Try injecting `<script>alert('XSS')</script>` in inputs
4. **Session**: Check session expiration and refresh
5. **Logging**: Verify security events are logged

### Automated Testing
```bash
# Install security audit tools
npm install -g snyk
npm audit

# Run security scan
snyk test

# Check for vulnerabilities
npm audit fix
```

## Incident Response

### If Security Issue Detected
1. **Identify**: Determine the nature and scope
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Learn**: Update security measures

### Contact
- Security Team: security@motech.ke
- Emergency: +254-XXX-XXXXXX

## Compliance

### Data Protection
- GDPR compliance considerations
- Data minimization principles
- User consent management
- Right to deletion

### Industry Standards
- OWASP guidelines
- ISO 27001 principles
- PCI DSS (if handling payments)

## Regular Maintenance

### Weekly
- Review security logs
- Check for failed login attempts
- Monitor rate limit violations

### Monthly
- Update dependencies
- Review access controls
- Audit user accounts

### Quarterly
- Security assessment
- Penetration testing
- Update security documentation

### Annually
- Comprehensive security audit
- Rotate encryption keys
- Review and update policies

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US /docs/Web/Security)
- [CWE Top 25](https://cwe.mitre.org/top25/)

## Version History

- v1.0.0 (2025-01-11): Initial security implementation
  - Input validation
  - Rate limiting
  - Session management
  - Security logging