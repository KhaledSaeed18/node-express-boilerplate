/*
 * src/index.ts
 * Server entry point — binds the Express app to a port.
 * All app configuration lives in src/app.ts.
 */

import app from './app';
import { config } from './config/env';
import logger from './config/logger';

app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, `Server is running on port ${String(config.PORT)}`);
});
