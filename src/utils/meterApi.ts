/**
 * Hydrobox Meter API Client
 * Secure API client for communicating with the Hydrobox backend
 * Handles authentication, request signing, and error handling
 */

import { logSecurityEvent } from './security';
import { validateMeterReading, validateMeterCommand } from './apiValidation';

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

// Request/Response Types
export interface MeterReading {
  timestamp: string;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
  activePower: number;
  reactivePower: number;
  energyConsumed: number;
  temperature?: number;
  signalStrength?: number;
  batteryLevel?: number;
}

export interface MeterCommand {
  command:
  'disconnect' |
  'reconnect' |
  'update_tariff' |
  'update_config' |
  'reboot';
  params?: Record<string, any>;
  scheduledAt?: string;
}

export interface MeterStatus {
  deviceId: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
  signalStrength: number;
  batteryLevel?: number;
  uptime: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * API Client Class
 */
class MeterAPIClient {
  private apiKey: string | null = null;
  private authToken: string | null = null;
  private deviceId: string | null = null;

  /**
   * Initialize API client with credentials
   */
  initialize(config: {
    apiKey?: string;
    authToken?: string;
    deviceId?: string;
  }) {
    this.apiKey = config.apiKey || null;
    this.authToken = config.authToken || null;
    this.deviceId = config.deviceId || null;

    logSecurityEvent('API_CLIENT_INITIALIZED', {
      hasApiKey: !!this.apiKey,
      hasAuthToken: !!this.authToken,
      deviceId: this.deviceId
    });
  }

  /**
   * Generate request signature for authentication
   */
  private async generateSignature(
  method: string,
  path: string,
  body: string,
  timestamp: string,
  nonce: string)
  : Promise<string> {
    const message = `${timestamp}${method}${path}${body}${nonce}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const keyData = encoder.encode(this.apiKey || '');

    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Generate signature
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate unique nonce
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  /**
   * Make authenticated API request
   */
  private async request<T = any>(
  method: string,
  endpoint: string,
  data?: any,
  options: {isDeviceRequest?: boolean;retry?: number;} = {})
  : Promise<APIResponse<T>> {
    const { isDeviceRequest = false, retry = 0 } = options;
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const timestamp = new Date().toISOString();
    const nonce = this.generateNonce();
    const body = data ? JSON.stringify(data) : '';

    try {
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Request-ID': nonce,
        'X-Timestamp': timestamp
      };

      if (isDeviceRequest && this.deviceId && this.apiKey) {
        // Device authentication
        headers['X-Device-ID'] = this.deviceId;
        headers['X-API-Key'] = this.apiKey;
        headers['X-Nonce'] = nonce;

        // Generate signature
        const signature = await this.generateSignature(
          method,
          endpoint,
          body,
          timestamp,
          nonce
        );
        headers['X-Signature'] = signature;
      } else if (this.authToken) {
        // User authentication
        headers['Authorization'] = `Bearer ${this.authToken}`;
      } else {
        throw new Error('No authentication credentials provided');
      }

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: data ? body : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Parse response
      const responseData = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        logSecurityEvent('API_RATE_LIMITED', {
          endpoint,
          retryAfter,
          remaining: response.headers.get('X-RateLimit-Remaining')
        });

        throw new Error(
          `Rate limit exceeded. Retry after ${retryAfter} seconds.`
        );
      }

      // Handle errors
      if (!response.ok) {
        logSecurityEvent('API_REQUEST_FAILED', {
          endpoint,
          status: response.status,
          error: responseData.error
        });

        return {
          success: false,
          error: responseData.error || {
            code: `HTTP_${response.status}`,
            message: response.statusText
          }
        };
      }

      logSecurityEvent('API_REQUEST_SUCCESS', {
        endpoint,
        method,
        status: response.status
      });

      return responseData;
    } catch (error: any) {
      // Retry logic for network errors
      if (retry < API_CONFIG.retryAttempts && error.name !== 'AbortError') {
        logSecurityEvent('API_REQUEST_RETRY', {
          endpoint,
          attempt: retry + 1,
          error: error.message
        });

        await new Promise((resolve) =>
        setTimeout(resolve, API_CONFIG.retryDelay * (retry + 1))
        );
        return this.request<T>(method, endpoint, data, {
          ...options,
          retry: retry + 1
        });
      }

      logSecurityEvent('API_REQUEST_ERROR', {
        endpoint,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed',
          details: error
        }
      };
    }
  }

  /**
   * Register a new meter device
   */
  async registerMeter(data: {
    deviceId: string;
    meterNumber: string;
    firmwareVersion: string;
    hardwareVersion: string;
    location?: {latitude: number;longitude: number;};
  }): Promise<APIResponse> {
    return this.request('POST', '/meters/register', data, {
      isDeviceRequest: true
    });
  }

  /**
   * Send meter reading to server
   */
  async sendReading(
  deviceId: string,
  reading: MeterReading)
  : Promise<APIResponse> {
    // Validate reading data
    const validation = validateMeterReading(reading);
    if (!validation.valid) {
      logSecurityEvent('METER_READING_VALIDATION_FAILED', {
        deviceId,
        errors: validation.errors
      });

      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid meter reading data',
          details: validation.errors
        }
      };
    }

    return this.request('POST', `/meters/${deviceId}/readings`, reading, {
      isDeviceRequest: true
    });
  }

  /**
   * Send heartbeat/health check
   */
  async sendHeartbeat(
  deviceId: string,
  status: Partial<MeterStatus>)
  : Promise<APIResponse> {
    return this.request('POST', `/meters/${deviceId}/heartbeat`, status, {
      isDeviceRequest: true
    });
  }

  /**
   * Get meter configuration
   */
  async getMeterConfig(deviceId: string): Promise<APIResponse> {
    return this.request('GET', `/meters/${deviceId}/config`, undefined, {
      isDeviceRequest: true
    });
  }

  /**
   * Report meter event (tamper, error, etc.)
   */
  async reportEvent(
  deviceId: string,
  event: {
    eventType: string;
    severity: 'info' | 'warning' | 'critical';
    details: any;
  })
  : Promise<APIResponse> {
    return this.request('POST', `/meters/${deviceId}/events`, event, {
      isDeviceRequest: true
    });
  }

  /**
   * Get all meters (Dashboard)
   */
  async getMeters(params?: {
    page?: number;
    limit?: number;
    status?: string;
    location?: string;
  }): Promise<APIResponse> {
    const queryString = params ?
    '?' + new URLSearchParams(params as any).toString() :
    '';
    return this.request('GET', `/dashboard/meters${queryString}`);
  }

  /**
   * Get meter details (Dashboard)
   */
  async getMeterDetails(meterId: string): Promise<APIResponse> {
    return this.request('GET', `/dashboard/meters/${meterId}`);
  }

  /**
   * Get meter readings (Dashboard)
   */
  async getMeterReadings(
  meterId: string,
  params?: {from?: string;to?: string;limit?: number;})
  : Promise<APIResponse> {
    const queryString = params ?
    '?' + new URLSearchParams(params as any).toString() :
    '';
    return this.request(
      'GET',
      `/dashboard/meters/${meterId}/readings${queryString}`
    );
  }

  /**
   * Send command to meter (Dashboard)
   */
  async sendCommand(
  meterId: string,
  command: MeterCommand)
  : Promise<APIResponse> {
    // Validate command
    const validation = validateMeterCommand(command);
    if (!validation.valid) {
      logSecurityEvent('METER_COMMAND_VALIDATION_FAILED', {
        meterId,
        command: command.command,
        errors: validation.errors
      });

      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid command data',
          details: validation.errors
        }
      };
    }

    return this.request(
      'POST',
      `/dashboard/meters/${meterId}/commands`,
      command
    );
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<APIResponse> {
    return this.request('GET', '/health');
  }
}

// Export singleton instance
export const meterAPI = new MeterAPIClient();

// Export types
export type { APIResponse, MeterReading, MeterCommand, MeterStatus };