import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createSmsProvider } from './sms.js';
import { MemoryStore } from './store.js';

const config = loadConfig();
const store = new MemoryStore(config.dataFile);
const sms = createSmsProvider(config);

if (!sms) {
  console.warn('[startup] SMS is disabled: password reset by SMS is unavailable until SMS_MODE is configured.');
}

const app = createApp({ config, store, sms });
const server = app.listen(config.port, () => {
  console.info(`[startup] MoTech auth API listening on :${config.port} (${config.env})`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
