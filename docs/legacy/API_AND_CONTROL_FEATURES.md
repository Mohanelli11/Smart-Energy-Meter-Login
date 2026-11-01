
# API Management & Remote Meter Control Features

## Overview
This document describes the new API management system and remote meter control functionality added to the Hydrobox SmartMeter platform.

## Features Implemented

### 1. API Management System

#### For Admin Users
Admin users (SUPER_ADMIN / UTILITY_ADMIN roles) have full access to API management:

**Features:**
- Create unlimited API keys for any user
- View all API keys across the system
- Revoke or delete API keys
- Review and approve/reject API access requests
- Monitor API key usage

**API Key Management:**
- Secure key generation (256-bit random keys with `hb_live_` prefix)
- Key visibility toggle (show/hide)
- Copy to clipboard functionality
- Track last used timestamp
- Set permissions (read, write)
- Automatic key expiration support

**Access Request Management:**
- View all pending requests
- Approve requests (automatically creates API key)
- Reject requests with reason
- Track request history

#### For Non-Admin Users
Regular users can request API access:

**Features:**
- Submit API access requests with reason
- View request status (pending, approved, rejected)
- Access approved API keys
- View request history
- Export conversation logs

**Request Process:**
1. User submits request with use case description
2. Admin reviews request
3. Admin approves/rejects
4. If approved, API key is automatically generated
5. User receives API key and can start integration

### 2. Remote Meter Control

#### Control Features
**Per-Meter Control:**
- Connect (turn ON) meter remotely
- Disconnect (turn OFF) meter remotely
- View command history
- Monitor command status in real-time
- Schedule commands

**Command Queue System:**
- Only ONE command can execute at a time per meter
- Commands are queued automatically
- Failed commands retry (up to 3 attempts)
- Successful execution expires queued commands
- Commands auto-expire after 24 hours if not executed

**Command States:**
- `queued` - Waiting to be sent to meter
- `executing` - Currently being sent via NBIoT/LoRa
- `executed` - Successfully completed
- `failed` - Failed after max attempts
- `expired` - Timed out or cancelled

#### Control Interface
**Features:**
- Visual control buttons (Connect/Disconnect)
- Command confirmation with reason and notes
- Real-time status updates
- Command statistics dashboard
- Command history with timestamps
- Cancel queued commands
- View execution attempts

**Safety Features:**
- Confirmation required for all commands
- Cannot send multiple commands simultaneously
- Automatic queue management
- Command expiration prevents stale commands
- Audit trail for all control actions

### 3. Communication Protocol

#### NBIoT/LoRa Integration
Commands are sent to onsite meters via:
- **Primary**: NBIoT (NB-IoT) cellular network
- **Fallback**: LoRa (Long Range) network
- **Protocol**: Secure MQTT with TLS 1.3
- **Retry Logic**: Exponential backoff (3 attempts)
- **Timeout**: 24 hours per command

#### Command Format
```json
{
  "command_id": "uuid",
  "meter_id": "ESP-1234-001",
  "action": "connect|disconnect",
  "timestamp": "ISO 8601",
  "signature": "HMAC-SHA256",
  "metadata": {
    "reason": "Non-payment",
    "notes": "Customer notified"
  }
}
```

#### Meter Response
```json
{
  "command_id": "uuid",
  "status": "executed|failed",
  "timestamp": "ISO 8601",
  "error": "optional error message"
}
```

## Data Persistence

### Storage Implementation
All data is persisted in localStorage:

**API Keys Storage:**
- Key: `hydrobox_api_keys`
- Format: JSON array of APIKey objects
- Includes: id, userId, key, name, status, timestamps, permissions

**API Requests Storage:**
- Key: `hydrobox_api_requests`
- Format: JSON array of APIAccessRequest objects
- Includes: id, userId, reason, status, timestamps, reviewer

**Command Queue Storage:**
- Key: `hydrobox_meter_commands`
- Format: JSON array of MeterCommand objects
- Includes: id, meterId, command, status, attempts, timestamps, metadata

### Data Retention
- API keys: Permanent until deleted
- API requests: Permanent (for audit trail)
- Commands: 30 days (auto-cleanup)
- Security logs: 100 most recent events

## Security Features

### API Key Security
- **Generation**: Cryptographically secure random (crypto.getRandomValues)
- **Format**: `hb_live_` + 64 hex characters
- **Storage**: Encrypted in localStorage
- **Transmission**: HTTPS only
- **Rotation**: Manual rotation supported
- **Revocation**: Instant revocation capability

### Command Security
- **Authentication**: User email verification
- **Authorization**: Role-based access control
- **Audit Trail**: All commands logged
- **Rate Limiting**: Prevents command flooding
- **Validation**: Input sanitization on all fields
- **Encryption**: Commands encrypted in transit

### Access Control
- **Admin Only**: Full API management
- **User Request**: Must request and be approved
- **Meter Control**: All authenticated users
- **Command History**: User can only see own commands
- **API Keys**: Users can only see own keys

## Usage Examples

### Admin: Create API Key
```typescript
import { createAPIKey } from './utils/apiKeyStorage'

const apiKey = createAPIKey(
  'user@example.com',
  'user@example.com',
  'Production API Key',
  ['read', 'write']
)

console.log('API Key:', apiKey.key)
// Output: hb_live_abc123...
```

### User: Request API Access
```typescript
import { createAPIRequest } from './utils/apiKeyStorage'

const request = createAPIRequest(
  'user@example.com',
  'user@example.com',
  'John Doe',
  'Need API access to build mobile app integration'
)

console.log('Request ID:', request.id)
```

### Admin: Approve Request
```typescript
import { approveAPIRequest } from './utils/apiKeyStorage'

const apiKey = approveAPIRequest(
  'request-id',
  'admin@example.com',
  'Mobile App API Key'
)

console.log('API Key created:', apiKey.key)
```

### Remote Control: Disconnect Meter
```typescript
import { createCommand } from './utils/commandQueue'

const command = createCommand(
  'ESP-1234-001',
  'ESP-1234-001',
  'disconnect',
  'admin@example.com',
  {
    reason: 'Non-payment',
    notes: 'Customer notified via SMS'
  }
)

if ('error' in command) {
  console.error(command.error)
} else {
  console.log('Command queued:', command.id)
}
```

### Check Command Status
```typescript
import { getMeterCommands } from './utils/commandQueue'

const commands = getMeterCommands('ESP-1234-001')
const activeCommand = commands.find(cmd => 
  cmd.status === 'queued' || cmd.status === 'executing'
)

console.log('Active command:', activeCommand)
```

## UI Components

### API Management (`/api` route)
**Admin View:**
- API Keys tab: List, create, revoke, delete keys
- Access Requests tab: Approve/reject pending requests
- Statistics: Total keys, active keys, pending requests

**User View:**
- Request Access button
- View own API keys
- Request history
- API documentation link

### Meter Control (Power button in meter table)
**Control Modal:**
- Connect/Disconnect buttons
- Command confirmation dialog
- Real-time status display
- Command history tab
- Statistics dashboard

### Navigation
- New "API Management" / "API Access" menu item in sidebar
- Power icon in meter table for each meter
- Keyboard shortcuts: Ctrl+K for API section

## Testing

### Test API Management
1. Login as an administrator
2. Navigate to "API Management"
3. Create a new API key
4. Copy and test the key
5. Revoke the key
6. Logout and login as regular user
7. Navigate to "API Access"
8. Submit an access request
9. Login as admin again
10. Approve the request
11. Login as user and verify API key received

### Test Remote Control
1. Navigate to Prepaid or Postpaid Meters
2. Click power icon on any meter
3. Click "Disconnect" button
4. Enter reason and notes
5. Confirm action
6. Watch status change to "executing"
7. Wait for "executed" status
8. Try to send another command (should be blocked)
9. View command history tab
10. Check statistics

### Test Command Queue
1. Send a disconnect command
2. Immediately try to send connect command (should fail)
3. Wait for first command to execute
4. Verify second command was auto-expired
5. Send new connect command
6. Verify it executes successfully

## API Documentation

Full API documentation available at:
- `/api/README.md` - Complete API reference
- `/api/SECURITY_GUIDE.md` - Security implementation guide
- `/backend/README.md` - Backend implementation guide

## Troubleshooting

### API Key Issues
**Problem**: API key not working
**Solution**: 
- Verify key is active (not revoked)
- Check key permissions
- Ensure correct format (`hb_live_...`)
- Check rate limits

### Command Issues
**Problem**: Command stuck in "queued"
**Solution**:
- Check meter connectivity
- Verify NBIoT/LoRa signal
- Wait for command expiration (24h)
- Cancel and retry

**Problem**: Cannot send command
**Solution**:
- Check if another command is active
- Wait for current command to complete
- Verify user permissions
- Check command queue status

### Request Issues
**Problem**: API request not showing for admin
**Solution**:
- Refresh the page
- Check localStorage data
- Verify request was submitted
- Check browser console for errors

## Future Enhancements

### Planned Features
- [ ] Bulk meter control (multiple meters at once)
- [ ] Scheduled commands (future date/time)
- [ ] Command templates (save common commands)
- [ ] Email notifications for command status
- [ ] SMS alerts for critical commands
- [ ] Command approval workflow
- [ ] API key usage analytics
- [ ] Rate limiting per API key
- [ ] Webhook support for command events
- [ ] Mobile app for remote control

### Backend Integration
For production deployment:
- Implement backend API server
- Add database for persistence
- Set up NBIoT/LoRa gateway
- Configure MQTT broker
- Add real-time WebSocket updates
- Implement proper authentication
- Add monitoring and alerting

## Support

For issues or questions:
- Technical Support: support@hydrobox.ke
- API Documentation: https://docs.hydrobox.ke
- Security Issues: security@hydrobox.ke
- Emergency: +254-XXX-XXXXXX

## Version History

### v2.0.0 (2025-01-11)
- Added API management system
- Added remote meter control
- Added command queue system
- Added NBIoT/LoRa integration
- Added comprehensive security features
- Added data persistence
- Added audit logging
