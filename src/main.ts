import { loadConfig } from './config.js';
import { createAsteriaServer } from './http.js';
import { TgServerLogSink } from './tgserver-log.js';

const config = loadConfig();
const timeout = Number.parseInt(process.env.TGSERVER_LOG_TIMEOUT_MS ?? '', 10);
const tgServerLogSink = new TgServerLogSink({
  url: process.env.TGSERVER_LOG_URL ?? null,
  timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 1500
});
tgServerLogSink.start();

const server = createAsteriaServer(config, tgServerLogSink);
server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({ event: 'asteria_started', host: config.host, port: config.port }));
  tgServerLogSink.log({ level: 'info', event: 'asteria_started' });
});
