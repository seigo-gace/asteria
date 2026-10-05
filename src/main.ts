import { loadConfig } from './config.js';
import { createAsteriaServer } from './http.js';
import { DjpmcpHttpLanguageIntelligence } from './japanese-language-intelligence.js';
import { JsonlTranslationMemory } from './translation-memory.js';
import { TgServerLogSink } from './tgserver-log.js';

const config = loadConfig();
const timeout = Number.parseInt(process.env.TGSERVER_LOG_TIMEOUT_MS ?? '', 10);
const tgServerLogSink = new TgServerLogSink({
  url: process.env.TGSERVER_LOG_URL ?? null,
  timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 1500
});
const translationMemory = new JsonlTranslationMemory(config.memoryFile ?? '/app/data/translation-memory.jsonl');
const japaneseLanguageIntelligence = config.djpmcpBaseUrl && config.djpmcpApiKey
  ? new DjpmcpHttpLanguageIntelligence({
      baseUrl: config.djpmcpBaseUrl,
      apiKey: config.djpmcpApiKey,
      timeoutMs: config.djpmcpTimeoutMs ?? 1000
    })
  : undefined;
tgServerLogSink.start();

const server = createAsteriaServer(config, tgServerLogSink, translationMemory, japaneseLanguageIntelligence);
server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({ event: 'asteria_started', host: config.host, port: config.port }));
  tgServerLogSink.log({ level: 'info', event: 'asteria_started' });
});
