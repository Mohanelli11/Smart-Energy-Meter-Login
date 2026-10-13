import type { Config } from './config.js';

export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

/** Development only: prints the message instead of sending it. Refused in production by config. */
export class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    console.info(`[sms:console] to=${to} message="${message}"`);
  }
}

/**
 * Generic HTTP webhook provider. POSTs { to, message } as JSON with an optional bearer token.
 * Point SMS_WEBHOOK_URL at a small function that forwards to your SMS gateway
 * (Africa's Talking, Twilio, etc.) so gateway credentials never live in this service.
 */
export class WebhookSmsProvider implements SmsProvider {
  constructor(
    private readonly url: string,
    private readonly token?: string
  ) {}

  async send(to: string, message: string): Promise<void> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      body: JSON.stringify({ to, message }),
      signal: AbortSignal.timeout(10_000)
    });
    if (!res.ok) throw new Error(`SMS webhook responded with ${res.status}`);
  }
}

/** Returns null when SMS is disabled (password reset is then unavailable). */
export function createSmsProvider(config: Config): SmsProvider | null {
  switch (config.smsMode) {
    case 'console':
      return new ConsoleSmsProvider();
    case 'webhook':
      return new WebhookSmsProvider(config.smsWebhookUrl!, config.smsWebhookToken);
    default:
      return null;
  }
}
