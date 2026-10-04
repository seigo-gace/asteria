import { loadConfig } from './config.js';
import { createAsteriaServer } from './http.js';

const config = loadConfig();
const server = createAsteriaServer(config);
server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({ event: 'asteria_started', host: config.host, port: config.port }));
});
