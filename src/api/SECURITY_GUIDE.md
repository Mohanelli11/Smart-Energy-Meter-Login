# API Security Implementation Guide

## Overview
Comprehensive security guide for the MoTech Electrical and Electronics Engineering Solutions SmartMeter API, covering IoT device authentication, data protection, and threat mitigation.

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [Device Security](#device-security)
3. [Data Protection](#data-protection)
4. [Network Security](#network-security)
5. [Threat Mitigation](#threat-mitigation)
6. [Monitoring & Incident Response](#monitoring--incident-response)

## Authentication & Authorization

### 1. Device Authentication (Meters)

#### Multi-Factor Device Authentication
Meters must authenticate using THREE factors:

1. **API Key** (What you have)
   - Unique per device
   - 256-bit random key
   - Hashed with bcrypt (cost factor 12)
   - Rotated every 90 days

2. **X.509 Certificate** (What you are)
   - Device-specific certificate
   - Signed by MoTech CA
   - 2048-bit RSA or 256-bit ECC
   - Certificate pinning on device

3. **Request Signature** (What you know)
   - HMAC-SHA256 signature
   - Includes timestamp + nonce
   - Prevents replay attacks

#### Implementation Example
```typescript
// Device authentication middleware
async function authenticateDevice(req, res, next) {
  const deviceId = req.headers['x-device-id']
  const apiKey = req.headers['x-api-key']
  const certFingerprint = req.headers['x-certificate-fingerprint']
  const signature = req.headers['x-signature']
  const timestamp = req.headers['x-timestamp']
  const nonce = req.headers['x-nonce']

  // 1. Validate API key
  const meter = await db.meters.findOne({ device_id: deviceId })
  if (!meter || !(await bcrypt.compare(apiKey, meter.api_key_hash))) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  // 2. Validate certificate
  if (certFingerprint !== meter.certificate_fingerprint) {
    return res.status(401).json({ error: 'Invalid certificate' })
  }

  // 3. Validate timestamp (±5 minutes)
  const requestTime = new Date(timestamp).getTime()
  if (Math.abs(Date.now() - requestTime) > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Request expired' })
  }

  // 4. Check nonce (prevent replay)
  if (await redis.exists(`nonce:${nonce}`)) {
    return res.status(401).json({ error: 'Duplicate request' })
  }
  await redis.setex(`nonce:${nonce}`, 86400, '1')

  // 5. Verify signature
  const message = `${timestamp}${req.method}${req.path}${JSON.stringify(req.body)}${nonce}`
  const expectedSig = crypto.createHmac('sha256', apiKey).update(message).digest('hex')
  
  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // Authentication successful
  req.meter = meter
  next()
}
```

### 2. User Authentication (Dashboard)

#### JWT-Based Authentication
```typescript
// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '8h',
  algorithm: 'HS256',
  issuer: 'motech-api',
  audience: 'motech-dashboard'
}

// Generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    }
  )
}

// Verify JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    })
  } catch (error) {
    throw new Error('Invalid token')
  }
}
```

## Device Security

### 1. Secure Boot & Firmware

#### Firmware Signing
```cpp
// ESP32 firmware verification
bool verifyFirmware(const uint8_t* firmware, size_t length) {
  // Extract signature from firmware
  uint8_t signature[64];
  memcpy(signature, firmware + length - 64, 64);
  
  // Verify with public key
  mbedtls_pk_context pk;
  mbedtls_pk_init(&pk);
  
  // Load public key from flash
  mbedtls_pk_parse_public_key(&pk, public_key, public_key_len);
  
  // Verify signature
  int ret = mbedtls_pk_verify(
    &pk,
    MBEDTLS_MD_SHA256,
    hash,
    32,
    signature,
    64
  );
  
  mbedtls_pk_free(&pk);
  return ret == 0;
}
```

### 2. Secure Storage on Device

#### Encrypted Storage
```cpp
// Store API key securely
void storeApiKey(const char* apiKey) {
  // Encrypt with device-specific key
  uint8_t encrypted[256];
  size_t encryptedLen;
  
  esp_aes_crypt_cbc(
    &aes,
    ESP_AES_ENCRYPT,
    strlen(apiKey),
    iv,
    (uint8_t*)apiKey,
    encrypted
  );
  
  // Store in NVS (Non-Volatile Storage)
  nvs_set_blob(nvs_handle, "api_key", encrypted, encryptedLen);
  nvs_commit(nvs_handle);
}
```

### 3. Over-The-Air (OTA) Updates

#### Secure OTA Process
```typescript
// OTA update endpoint
app.post('/meters/:deviceId/ota', authenticateDevice, async (req, res) => {
  const { deviceId } = req.params
  const { firmwareVersion } = req.body
  
  // Check if update available
  const latestFirmware = await db.firmware.findOne({
    version: { $gt: firmwareVersion },
    status: 'stable'
  })
  
  if (!latestFirmware) {
    return res.json({ update_available: false })
  }
  
  // Generate signed download URL (expires in 1 hour)
  const downloadUrl = await generateSignedUrl(
    latestFirmware.file_path,
    3600
  )
  
  res.json({
    update_available: true,
    version: latestFirmware.version,
    download_url: downloadUrl,
    checksum: latestFirmware.checksum,
    signature: latestFirmware.signature
  })
})
```

## Data Protection

### 1. Data Encryption

#### At Rest
```sql
-- PostgreSQL transparent data encryption
ALTER TABLE meter_readings
  SET (security_label = 'encrypted');

-- Column-level encryption for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO meters (device_id, api_key_hash)
VALUES (
  'ESP-1234-001',
  crypt('api_key_here', gen_salt('bf', 12))
);
```

#### In Transit
```nginx
# Nginx TLS configuration
server {
  listen 443 ssl http2;
  
  # TLS 1.3 only
  ssl_protocols TLSv1.3;
  
  # Strong ciphers
  ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
  ssl_prefer_server_ciphers on;
  
  # HSTS
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  
  # Certificate pinning
  add_header Public-Key-Pins 'pin-sha256="base64=="; max-age=5184000';
}
```

### 2. Data Anonymization

```typescript
// Anonymize personal data for analytics
function anonymizeReading(reading: MeterReading) {
  return {
    ...reading,
    meter_id: hashId(reading.meter_id),
    customer_name: undefined,
    location: {
      // Round coordinates to ~1km precision
      latitude: Math.round(reading.location.latitude * 100) / 100,
      longitude: Math.round(reading.location.longitude * 100) / 100
    }
  }
}
```

## Network Security

### 1. DDoS Protection

#### Rate Limiting with Redis
```typescript
class AdvancedRateLimiter {
  // Sliding window rate limiter
  async checkLimit(key: string, limit: number, window: number): Promise<boolean> {
    const now = Date.now()
    const windowStart = now - window * 1000
    
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart)
    
    // Count requests in window
    const count = await redis.zcard(key)
    
    if (count >= limit) {
      return false
    }
    
    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`)
    await redis.expire(key, window)
    
    return true
  }
  
  // Adaptive rate limiting (reduces limit under attack)
  async adaptiveLimit(key: string): Promise<number> {
    const errorRate = await this.getErrorRate(key)
    const baseLimit = 1000
    
    if (errorRate > 0.5) {
      return baseLimit * 0.1 // Reduce to 10% under attack
    } else if (errorRate > 0.2) {
      return baseLimit * 0.5 // Reduce to 50%
    }
    
    return baseLimit
  }
}
```

### 2. IP Filtering & Geofencing

```typescript
// Whitelist known meter IP ranges
const ALLOWED_IP_RANGES = [
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16'
]

function isAllowedIP(ip: string): boolean {
  return ALLOWED_IP_RANGES.some(range => {
    return ipInRange(ip, range)
  })
}

// Geofencing for meters
async function validateMeterLocation(meterId: string, location: Location) {
  const meter = await db.meters.findOne({ id: meterId })
  
  // Check if location is within expected range (e.g., 10km)
  const distance = calculateDistance(
    meter.location,
    location
  )
  
  if (distance > 10000) { // 10km in meters
    await alertService.send({
      type: 'location_anomaly',
      meter_id: meterId,
      distance,
      severity: 'critical'
    })
    
    return false
  }
  
  return true
}
```

## Threat Mitigation

### 1. SQL Injection Prevention

```typescript
// Use parameterized queries
async function getMeterReadings(meterId: string, from: Date, to: Date) {
  // GOOD: Parameterized query
  return db.query(
    'SELECT * FROM meter_readings WHERE meter_id = $1 AND timestamp BETWEEN $2 AND $3',
    [meterId, from, to]
  )
  
  // BAD: String concatenation (vulnerable to SQL injection)
  // return db.query(`SELECT * FROM meter_readings WHERE meter_id = '${meterId}'`)
}
```

### 2. XSS Prevention

```typescript
// Sanitize all user inputs
import DOMPurify from 'isomorphic-dompurify'

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}
```

### 3. CSRF Protection

```typescript
// Generate CSRF token
function generateCSRFToken(sessionId: string): string {
  return crypto
    .createHmac('sha256', process.env.CSRF_SECRET!)
    .update(sessionId)
    .digest('hex')
}

// Validate CSRF token
function validateCSRFToken(sessionId: string, token: string): boolean {
  const expected = generateCSRFToken(sessionId)
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expected)
  )
}
```

## Monitoring & Incident Response

### 1. Security Monitoring

```typescript
// Security event monitoring
class SecurityMonitor {
  async logEvent(event: SecurityEvent) {
    // Store in database
    await db.security_events.insert(event)
    
    // Send to SIEM
    await siem.send(event)
    
    // Check for patterns
    await this.detectAnomalies(event)
  }
  
  async detectAnomalies(event: SecurityEvent) {
    // Check for brute force
    if (event.type === 'login_failed') {
      const recentFailures = await db.security_events.count({
        type: 'login_failed',
        ip: event.ip,
        timestamp: { $gt: Date.now() - 3600000 } // Last hour
      })
      
      if (recentFailures > 10) {
        await this.triggerAlert('brute_force_detected', event)
      }
    }
    
    // Check for unusual API usage
    if (event.type === 'api_request') {
      const requestRate = await this.getRequestRate(event.device_id)
      
      if (requestRate > 100) { // 100 req/min
        await this.triggerAlert('unusual_api_usage', event)
      }
    }
  }
}
```

### 2. Incident Response

```typescript
// Automated incident response
class IncidentResponder {
  async handleIncident(incident: SecurityIncident) {
    switch (incident.severity) {
      case 'critical':
        // Immediate action
        await this.blockDevice(incident.device_id)
        await this.notifySecurityTeam(incident)
        await this.escalateToManagement(incident)
        break
        
      case 'high':
        // Rate limit device
        await this.rateLimitDevice(incident.device_id, 0.1)
        await this.notifySecurityTeam(incident)
        break
        
      case 'medium':
        // Monitor closely
        await this.increaseMonitoring(incident.device_id)
        await this.logIncident(incident)
        break
    }
  }
  
  async blockDevice(deviceId: string) {
    // Add to blocklist
    await redis.sadd('blocked_devices', deviceId)
    
    // Revoke API key
    await db.meters.update(
      { device_id: deviceId },
      { status: 'blocked', api_key_hash: null }
    )
    
    // Disconnect WebSocket
    await wsService.disconnectDevice(deviceId)
  }
}
```

## Security Checklist

### Pre-Production
- [ ] All API keys rotated and unique per environment
- [ ] TLS 1.3 configured with strong ciphers
- [ ] Rate limiting enabled on all endpoints
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Logging and monitoring enabled
- [ ] Incident response plan documented
- [ ] Backup and recovery tested
- [ ] Penetration testing completed
- [ ] Security audit completed

### Post-Production
- [ ] Monitor security logs daily
- [ ] Review access logs weekly
- [ ] Rotate API keys monthly
- [ ] Update dependencies monthly
- [ ] Security assessment quarterly
- [ ] Penetration testing annually
- [ ] Disaster recovery drill annually

## Compliance

### GDPR Compliance
- Data minimization
- Right to access
- Right to deletion
- Data portability
- Consent management
- Breach notification (72 hours)

### Industry Standards
- ISO 27001 (Information Security)
- IEC 62443 (Industrial Security)
- NIST Cybersecurity Framework
- OWASP Top 10

## Resources

- [OWASP IoT Security](https://owasp.org/www-project-internet-of-things/)
- [NIST IoT Security](https://www.nist.gov/itl/applied-cybersecurity/nist-cybersecurity-iot-program)
- [IEC 62443](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards)
- [CIS Controls](https://www.cisecurity.org/controls)