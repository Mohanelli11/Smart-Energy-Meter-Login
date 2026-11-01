# MoTech Electrical and Electronics Engineering Solutions SmartMeter API Documentation

## Overview
Secure REST API for bidirectional communication between the MoTech platform and onsite smart meters. Designed to handle infinite requests with enterprise-grade security and scalability.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Smart Meters   │ ◄─────► │   API Gateway    │ ◄─────► │   Dashboard     │
│  (IoT Devices)  │  HTTPS  │  (Load Balanced) │  HTTPS  │   (Frontend)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   API Server     │
                            │  (Node.js/NestJS)│
                            └──────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │  PostgreSQL  │ │    Redis     │ │   RabbitMQ   │
            │  (Database)  │ │   (Cache)    │ │  (Message Q) │
            └──────────────┘ └──────────────┘ └──────────────┘
```

## Base URL
```
Production:  https://api.motech.ke/v1
Staging:     https://api-staging.motech.ke/v1
Development: http://localhost:3000/v1
```

## Authentication

### 1. Device Authentication (Meters)
Meters authenticate using X.509 certificates + API keys.

**Headers Required:**
```http
X-Device-ID: ESP-1234-001
X-API-Key: hb_device_live_abc123xyz...
X-Certificate-Fingerprint: SHA256:abc123...
Content-Type: application/json
```

### 2. User Authentication (Dashboard)
Users authenticate using JWT tokens.

**Headers Required:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## Security Features

### 1. Rate Limiting
- **Per Device**: 1000 requests/hour
- **Per User**: 10000 requests/hour
- **Global**: 1M requests/hour (auto-scales)
- **Burst**: 100 requests/minute

### 2. Request Signing
All meter requests must be signed using HMAC-SHA256:

```javascript
const signature = HMAC_SHA256(
  secret_key,
  timestamp + method + path + body
)
```

### 3. Replay Attack Prevention
- Timestamp validation (±5 minutes)
- Nonce tracking (24-hour window)
- Request ID uniqueness

### 4. Message Encryption
- TLS 1.3 for transport
- AES-256-GCM for payload encryption (optional)
- End-to-end encryption for sensitive data

## API Endpoints

### Meter Endpoints

#### 1. Register New Meter
```http
POST /meters/register
```

**Request:**
```json
{
  "device_id": "ESP-1234-001",
  "meter_number": "MET-1234-2023",
  "firmware_version": "2.1.0",
  "hardware_version": "1.0",
  "certificate": "-----BEGIN CERTIFICATE-----...",
  "location": {
    "latitude": -1.2921,
    "longitude": 36.8219
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "device_id": "ESP-1234-001",
    "api_key": "hb_device_live_abc123xyz...",
    "mqtt_credentials": {
      "broker": "mqtt.motech.ke",
      "port": 8883,
      "username": "device_ESP-1234-001",
      "password": "secure_password_here"
    },
    "sync_interval": 300,
    "registered_at": "2025-01-11T10:30:00Z"
  }
}
```

#### 2. Send Meter Reading
```http
POST /meters/{device_id}/readings
```

**Request:**
```json
{
  "timestamp": "2025-01-11T10:30:00Z",
  "readings": {
    "voltage": 235.5,
    "current": 12.3,
    "power_factor": 0.92,
    "frequency": 50.1,
    "active_power": 2.85,
    "reactive_power": 0.45,
    "energy_consumed": 1234.56,
    "temperature": 45.2
  },
  "status": {
    "signal_strength": -65,
    "battery_level": 95,
    "uptime": 86400,
    "errors": []
  },
  "signature": "hmac_signature_here",
  "nonce": "unique_nonce_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reading_id": "read_abc123",
    "processed_at": "2025-01-11T10:30:01Z",
    "next_sync": "2025-01-11T10:35:00Z"
  },
  "commands": [
    {
      "command": "update_tariff",
      "params": {
        "rate": 15.50
      }
    }
  ]
}
```

#### 3. Heartbeat/Health Check
```http
POST /meters/{device_id}/heartbeat
```

**Request:**
```json
{
  "timestamp": "2025-01-11T10:30:00Z",
  "status": "online",
  "signal_strength": -65,
  "uptime": 86400
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "acknowledged",
    "server_time": "2025-01-11T10:30:01Z"
  }
}
```

#### 4. Get Meter Configuration
```http
GET /meters/{device_id}/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sync_interval": 300,
    "tariff_rate": 15.50,
    "disconnect_threshold": 0,
    "reconnect_threshold": 50,
    "firmware_update_url": "https://firmware.motech.ke/v2.1.1.bin",
    "updated_at": "2025-01-11T10:00:00Z"
  }
}
```

#### 5. Report Meter Event
```http
POST /meters/{device_id}/events
```

**Request:**
```json
{
  "event_type": "tamper_detected",
  "severity": "critical",
  "timestamp": "2025-01-11T10:30:00Z",
  "details": {
    "tamper_type": "cover_opened",
    "duration": 120
  }
}
```

### Dashboard Endpoints

#### 1. Get All Meters
```http
GET /dashboard/meters?page=1&limit=50&status=active
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meters": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1248,
      "pages": 25
    }
  }
}
```

#### 2. Get Meter Details
```http
GET /dashboard/meters/{meter_id}
```

#### 3. Get Meter Readings
```http
GET /dashboard/meters/{meter_id}/readings?from=2025-01-01&to=2025-01-11
```

#### 4. Send Command to Meter
```http
POST /dashboard/meters/{meter_id}/commands
```

**Request:**
```json
{
  "command": "disconnect",
  "reason": "non_payment",
  "scheduled_at": "2025-01-11T12:00:00Z"
}
```

## WebSocket API (Real-Time)

### Connection
```javascript
const ws = new WebSocket('wss://api.motech.ke/v1/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token_here'
}));
```

### Subscribe to Meter Updates
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['meters', 'alerts', 'readings']
}));
```

### Receive Real-Time Data
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'reading':
      // New meter reading
      break;
    case 'alert':
      // Critical alert
      break;
    case 'status_change':
      // Meter status changed
      break;
  }
};
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Invalid or missing credentials |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641902400
Retry-After: 3600
```

## Pagination

All list endpoints support pagination:

```http
GET /endpoint?page=1&limit=50&sort=created_at&order=desc
```

## Filtering

```http
GET /meters?status=active&location=Nairobi&type=prepaid
```

## Webhooks

Configure webhooks to receive real-time notifications:

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["reading.created", "alert.triggered", "meter.offline"],
  "secret": "webhook_secret_key"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { MoTechAPI } from '@motech/sdk';

const api = new MoTechAPI({
  apiKey: process.env.MOTECH_API_KEY,
  environment: 'production'
});

// Send meter reading
await api.meters.sendReading('ESP-1234-001', {
  voltage: 235.5,
  current: 12.3,
  // ...
});
```

### Python
```python
from motech import MoTechAPI

api = MoTechAPI(api_key=os.getenv('MOTECH_API_KEY'))

# Get meter data
meter = api.meters.get('ESP-1234-001')
```

### Arduino/ESP32
```cpp
#include <MoTechMeter.h>

MoTechMeter meter("ESP-1234-001", "api_key_here");

void loop() {
  MeterReading reading;
  reading.voltage = readVoltage();
  reading.current = readCurrent();
  
  meter.sendReading(reading);
  delay(300000); // 5 minutes
}
```

## Testing

### Test Credentials
```
Device ID: TEST-DEVICE-001
API Key: hb_device_test_abc123xyz
```

### Sandbox Environment
```
URL: https://api-sandbox.motech.ke/v1
```

## Support

- **Documentation**: https://docs.motech.ke
- **API Status**: https://status.motech.ke
- **Support Email**: api-support@motech.ke
- **Developer Forum**: https://community.motech.ke

## Changelog

### v1.0.0 (2025-01-11)
- Initial API release
- Meter registration and readings
- Real-time WebSocket support
- Dashboard endpoints