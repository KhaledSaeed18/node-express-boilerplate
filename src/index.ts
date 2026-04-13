/*
 * src/index.ts
 * Server entry point — binds the Express app to a port.
 * All app configuration lives in src/app.ts.
 */

import app from './app';
import { config } from './config/env';

app.listen(config.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on port ${String(config.PORT)}`);
});
