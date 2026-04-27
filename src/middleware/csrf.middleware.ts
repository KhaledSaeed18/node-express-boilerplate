/*
 * src/middleware/csrf.middleware.ts
 * CSRF protection using the Double Submit Cookie pattern (csrf-csrf).
 * The HMAC token is bound to the request's IP address so a token generated
 * for one client cannot be replayed by another.
 */

import { doubleCsrf } from 'csrf-csrf';
import { config } from '../config/env';

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
    getSecret: () => config.COOKIE_SECRET,
    getSessionIdentifier: (req) => req.ip ?? req.socket.remoteAddress ?? 'unknown',
    cookieName: config.NODE_ENV === 'production' ? '__Host-x-csrf-token' : 'x-csrf-token',
    cookieOptions: {
        sameSite: 'strict',
        path: '/',
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
    },
});

export { generateCsrfToken, doubleCsrfProtection };
