
# Hydrobox Backend API - Implementation Guide

## Overview
This directory contains example backend implementations for the Hydrobox SmartMeter API. The backend handles meter communication, data processing, and serves the dashboard frontend.

## Technology Stack

### Recommended Stack
- **Runtime**: Node.js 18+ or Bun
- **Framework**: NestJS (TypeScript) or Express.js
- **Database**: PostgreSQL 14+ with TimescaleDB extension
- **Cache**: Redis 7+
- **Message Queue**: RabbitMQ or Apache Kafka
- **WebSocket**: Socket.IO or native WebSocket
- **Authentication**: JWT + X.509 certificates
- **API Documentation**: OpenAPI/Swagger

### Alternative Stacks
- **Go**: Gin/Echo + GORM
- **Python**: FastAPI + SQLAlchemy
- **Rust**: Actix-web + Diesel
- **Java**: Spring Boot

## Architecture

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── meters/         # Meter management
│   │   ├── readings/       # Meter readings processing
│   │   ├── commands/       # Meter commands
│   │   ├── alerts/         # Alert system
│   │   ├── dashboard/      # Dashboard API
│   │   └── websocket/      # Real-time communication
│   ├── common/
│   │   ├── guards/         # Auth guards
│   │   ├── interceptors/   # Request/response interceptors
│   │   ├── filters/        # Exception filters
│   │   └── decorators/     # Custom decorators
│   ├── config/             # Configuration
│   ├── database/           # Database models & migrations
│   └── utils/              # Utilities
├── test/                   # Tests
├── docker/                 # Docker configurations
└── scripts/                # Utility scripts
```

## Database Schema

### meters table
```sql
CREATE TABLE meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(50) UNIQUE NOT NULL,
  meter_number VARCHAR(50) UNIQUE NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  type VARCHAR(20) NOT NULL, -- 'prepaid' or 'postpaid'
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  firmware_version VARCHAR(20),
  hardware_version VARCHAR(20),
  api_key_hash VARCHAR(255) NOT NULL,
  certificate_fingerprint VARCHAR(255),
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meters_device_id ON meters(device_id);
CREATE INDEX idx_meters_status ON meters(status);
CREATE INDEX idx_meters_last_seen ON meters(last_seen);
```

### meter_readings table (TimescaleDB hypertable)
```sql
CREATE TABLE meter_readings (
  id UUID DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES meters(id),
  timestamp TIMESTAMP NOT NULL,
  voltage DECIMAL(6, 2),
  current DECIMAL(8, 3),
  power_factor DECIMAL(4, 3),
  frequency DECIMAL(5, 2),
  active_power DECIMAL(10, 3),
  reactive_power DECIMAL(10, 3),
  energy_consumed DECIMAL(12, 2),
  temperature DECIMAL(5, 2),
  signal_strength INTEGER,
  battery_level INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (meter_id, timestamp)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('meter_readings', 'timestamp');

-- Create indexes
CREATE INDEX idx_readings_meter_timestamp ON meter_readings(meter_id, timestamp DESC);
CREATE INDEX idx_readings_timestamp ON meter_readings(timestamp DESC);
```

### meter_events table
```sql
CREATE TABLE meter_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES meters(id),
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_meter_timestamp ON meter_events(meter_id, timestamp DESC);
CREATE INDEX idx_events_severity ON meter_events(severity);
CREATE INDEX idx_events_acknowledged ON meter_events(acknowledged);
```

### meter_commands table
```sql
CREATE TABLE meter_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES meters(id),
  command VARCHAR(50) NOT NULL,
  params JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP,
  executed_at TIMESTAMP,
  result JSONB,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commands_meter_status ON meter_commands(meter_id, status);
CREATE INDEX idx_commands_scheduled ON meter_commands(scheduled_at);
```

## Security Implementation

### 1. Device Authentication
```typescript
// Device API Key validation
async function validateDeviceApiKey(deviceId: string, apiKey: string): Promise<boolean> {
  const meter = await db.meters.findOne({ device_id: deviceId })
  
  if (!meter) return false
  
  // Compare hashed API key
  const isValid = await bcrypt.compare(apiKey, meter.api_key_hash)
  
  if (isValid) {
    // Update last seen
    await db.meters.update({ device_id: deviceId }, { last_seen: new Date() })
  }
  
  return isValid
}

// Request signature validation
async function validateRequestSignature(
  request: Request,
  apiKey: string
): Promise<boolean> {
  const timestamp = request.headers['x-timestamp']
  const nonce = request.headers['x-nonce']
  const signature = request.headers['x-signature']
  
  // Check timestamp (±5 minutes)
  const requestTime = new Date(timestamp).getTime()
  const now = Date.now()
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return false
  }
  
  // Check nonce (prevent replay attacks)
  const nonceExists = await redis.exists(`nonce:${nonce}`)
  if (nonceExists) return false
  
  // Store nonce (24-hour expiry)
  await redis.setex(`nonce:${nonce}`, 86400, '1')
  
  // Verify signature
  const message = `${timestamp}${request.method}${request.path}${request.body}${nonce}`
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(message)
    .digest('hex')
  
  return signature === expectedSignature
}
```

### 2. Rate Limiting
```typescript
// Redis-based rate limiter
class RateLimiter {
  async checkLimit(key: string, limit: number, window: number): Promise<boolean> {
    const current = await redis.incr(key)
    
    if (current === 1) {
      await redis.expire(key, window)
    }
    
    return current <= limit
  }
  
  async checkDeviceLimit(deviceId: string): Promise<boolean> {
    return this.checkLimit(`rate:device:${deviceId}`, 1000, 3600) // 1000/hour
  }
  
  async checkUserLimit(userId: string): Promise<boolean> {
    return this.checkLimit(`rate:user:${userId}`, 10000, 3600) // 10000/hour
  }
}
```

### 3. Data Encryption
```typescript
// Encrypt sensitive data before storing
function encryptSensitiveData(data: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

// Decrypt sensitive data
function decryptSensitiveData(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':')
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

## Scalability Features

### 1. Horizontal Scaling
- Stateless API servers behind load balancer
- Redis for shared session storage
- Message queue for async processing
- Database read replicas

### 2. Caching Strategy
```typescript
// Multi-level caching
class CacheService {
  // L1: In-memory cache (per instance)
  private memoryCache = new Map()
  
  // L2: Redis cache (shared)
  async get(key: string): Promise<any> {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)
    }
    
    // Check Redis
    const cached = await redis.get(key)
    if (cached) {
      const data = JSON.parse(cached)
      this.memoryCache.set(key, data)
      return data
    }
    
    return null
  }
  
  async set(key: string, value: any, ttl: number): Promise<void> {
    this.memoryCache.set(key, value)
    await redis.setex(key, ttl, JSON.stringify(value))
  }
}
```

### 3. Message Queue Processing
```typescript
// Process meter readings asynchronously
class ReadingProcessor {
  async processReading(reading: MeterReading): Promise<void> {
    // Publish to message queue
    await messageQueue.publish('readings.process', reading)
  }
}

// Worker to process readings
messageQueue.subscribe('readings.process', async (reading) => {
  // Store in database
  await db.meter_readings.insert(reading)
  
  // Check for alerts
  await alertService.checkThresholds(reading)
  
  // Update aggregations
  await analyticsService.updateAggregations(reading)
  
  // Broadcast to WebSocket clients
  await wsService.broadcast('reading', reading)
})
```

## Deployment

### Docker Compose
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/hydrobox
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - postgres
      - redis
      - rabbitmq

  postgres:
    image: timescale/timescaledb:latest-pg14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=hydrobox
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

### Kubernetes
See `kubernetes/` directory for production-ready manifests.

## Monitoring

### Metrics to Track
- Request rate per endpoint
- Response time (p50, p95, p99)
- Error rate
- Active WebSocket connections
- Database query performance
- Cache hit rate
- Message queue lag

### Health Checks
```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      messageQueue: await checkMessageQueue(),
    }
  }
  
  const allHealthy = Object.values(health.checks).every(check => check.status === 'ok')
  
  res.status(allHealthy ? 200 : 503).json(health)
})
```

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:e2e

# Load testing
artillery run load-test.yml
```

## Documentation

- API Documentation: http://localhost:3000/api/docs
- Health Status: http://localhost:3000/health
- Metrics: http://localhost:3000/metrics
