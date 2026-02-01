/**
 * WebSocket Client for Real-Time Meter Data
 * Handles real-time bidirectional communication with the API server
 */

import { logSecurityEvent } from './security';

export type WebSocketMessageType =
'auth' |
'subscribe' |
'unsubscribe' |
'reading' |
'alert' |
'status_change' |
'command' |
'ping' |
'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: any;
  timestamp?: string;
  id?: string;
}

export type WebSocketEventHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private authToken: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<WebSocketMessageType, Set<WebSocketEventHandler>> =
  new Map();
  private isConnected = false;
  private shouldReconnect = true;

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_WS_URL || 'ws://localhost:3000/v1/ws';
  }

  /**
   * Connect to WebSocket server
   */
  connect(authToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.authToken = authToken;
        this.shouldReconnect = true;

        // Create WebSocket connection
        this.ws = new WebSocket(this.url);

        // Connection opened
        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Authenticate
          this.send({
            type: 'auth',
            data: { token: this.authToken }
          });

          // Start ping/pong heartbeat
          this.startHeartbeat();

          logSecurityEvent('WEBSOCKET_CONNECTED', { url: this.url });
          resolve();
        };

        // Listen for messages
        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        // Connection closed
        this.ws.onclose = (event) => {
          console.log('[WebSocket] Disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();

          logSecurityEvent('WEBSOCKET_DISCONNECTED', {
            code: event.code,
            reason: event.reason
          });

          // Attempt reconnection
          if (this.shouldReconnect) {
            this.reconnect();
          }
        };

        // Connection error
        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          logSecurityEvent('WEBSOCKET_ERROR', { error: String(error) });
          reject(error);
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.isConnected = false;
    logSecurityEvent('WEBSOCKET_MANUAL_DISCONNECT', {});
  }

  /**
   * Reconnect to WebSocket server
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      logSecurityEvent('WEBSOCKET_MAX_RECONNECT_ATTEMPTS', {
        attempts: this.reconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (this.authToken) {
        this.connect(this.authToken).catch((error) => {
          console.error('[WebSocket] Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Send message to server
   */
  send(message: WebSocketMessage): void {
    if (!this.ws || !this.isConnected) {
      console.warn('[WebSocket] Not connected, cannot send message');
      return;
    }

    try {
      const payload = {
        ...message,
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID()
      };

      this.ws.send(JSON.stringify(payload));
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
      logSecurityEvent('WEBSOCKET_SEND_ERROR', { error: String(error) });
    }
  }

  /**
   * Subscribe to channels
   */
  subscribe(channels: string[]): void {
    this.send({
      type: 'subscribe',
      data: { channels }
    });

    logSecurityEvent('WEBSOCKET_SUBSCRIBE', { channels });
  }

  /**
   * Unsubscribe from channels
   */
  unsubscribe(channels: string[]): void {
    this.send({
      type: 'unsubscribe',
      data: { channels }
    });

    logSecurityEvent('WEBSOCKET_UNSUBSCRIBE', { channels });
  }

  /**
   * Register event handler
   */
  on(eventType: WebSocketMessageType, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Unregister event handler
   */
  off(eventType: WebSocketMessageType, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(message.type);

    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`[WebSocket] Handler error for ${message.type}:`, error);
        }
      });
    }

    // Handle pong response
    if (message.type === 'pong') {

      // Server is alive
    }}

  /**
   * Start heartbeat ping/pong
   */
  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Check if connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();