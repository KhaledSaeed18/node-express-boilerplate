/*
 * src/docs/paths/auth.paths.ts
 * OpenAPI path definitions for all /auth endpoints.
 * Rate limit: 5 requests / 15 minutes per IP.
 * CSRF: every mutating request (POST) requires an `x-csrf-token` header.
 *       Obtain the token first from GET /auth/csrf-token.
 */

const csrfHeader = {
    in: 'header',
    name: 'x-csrf-token',
    required: true,
    schema: { type: 'string' },
    description:
        'Double-submit CSRF token obtained from `GET /auth/csrf-token`. Required for all mutating requests.',
};

const rateLimitHeaders = {
    'X-RateLimit-Limit': {
        schema: { type: 'integer' },
        description: 'Max requests allowed in the window (5)',
    },
    'X-RateLimit-Remaining': {
        schema: { type: 'integer' },
        description: 'Requests remaining in the current window',
    },
    'X-RateLimit-Reset': {
        schema: { type: 'integer' },
        description: 'Unix timestamp when the rate-limit window resets',
    },
};

export const authPaths = {
    '/auth/csrf-token': {
        get: {
            tags: ['Authentication'],
            summary: 'Obtain a CSRF token',
            description:
                'Issues a double-submit CSRF token. Call this endpoint once per session **before** making any `POST` request. ' +
                'The server sets an `x-csrf-token` cookie and returns the token value in the response body. ' +
                'Include the token in the `x-csrf-token` request header for all mutating calls.',
            operationId: 'getCsrfToken',
            responses: {
                200: {
                    description: 'CSRF token issued successfully',
                    headers: rateLimitHeaders,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CsrfTokenResponse' },
                        },
                    },
                },
                429: {
                    description: 'Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
            },
        },
    },

    '/auth/signup': {
        post: {
            tags: ['Authentication'],
            summary: 'Register a new user',
            description:
                'Creates a new account. Email domains on the blocklist are rejected. ' +
                'Passwords must be 8–30 characters and include uppercase, lowercase, a digit, and a special character. ' +
                'Common passwords are also rejected.',
            operationId: 'signUp',
            parameters: [csrfHeader],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/SignUpRequest' },
                        example: {
                            email: 'alice@example.com',
                            password: 'Str0ng!Pass',
                        },
                    },
                },
            },
            responses: {
                201: {
                    description:
                        'User created — no session is started; call `/auth/signin` to authenticate',
                    headers: rateLimitHeaders,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserResponse' },
                            example: {
                                statusCode: 201,
                                message: 'User created successfully',
                                data: {
                                    id: 'clx4v2z0a0000abc123def456',
                                    email: 'alice@example.com',
                                    username: 'alice42',
                                    createdAt: '2024-06-01T09:00:00.000Z',
                                    updatedAt: '2024-06-01T09:00:00.000Z',
                                },
                            },
                        },
                    },
                },
                400: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
                            example: {
                                statusCode: 400,
                                message: 'Validation failed',
                                errors: [
                                    {
                                        field: 'password',
                                        message:
                                            'Password must contain at least one uppercase letter',
                                        value: 'weakpass',
                                    },
                                ],
                            },
                        },
                    },
                },
                409: {
                    description: 'Email already registered',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: {
                                statusCode: 409,
                                message: 'Email is already registered',
                            },
                        },
                    },
                },
                429: {
                    description: 'Rate limit exceeded (5 / 15 min)',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
            },
        },
    },

    '/auth/signin': {
        post: {
            tags: ['Authentication'],
            summary: 'Sign in and obtain JWT tokens',
            description:
                'Validates credentials and sets two **HttpOnly signed cookies**: ' +
                '`accessToken` (short-lived, 15 min by default) and ' +
                '`refreshToken` (long-lived, 7 days by default). ' +
                'Subsequent requests should send these cookies automatically (browser) ' +
                'or pass the access token as a `Bearer` token in `Authorization`.',
            operationId: 'signIn',
            parameters: [csrfHeader],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/SignInRequest' },
                        example: {
                            email: 'alice@example.com',
                            password: 'Str0ng!Pass',
                        },
                    },
                },
            },
            responses: {
                200: {
                    description:
                        'Authenticated — `accessToken` and `refreshToken` cookies are set in the response',
                    headers: {
                        ...rateLimitHeaders,
                        'Set-Cookie': {
                            schema: { type: 'string' },
                            description:
                                'Two signed HttpOnly cookies: `accessToken` (15 min) and `refreshToken` (7 days)',
                        },
                    },
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserResponse' },
                            example: {
                                statusCode: 200,
                                message: 'Sign in successful',
                                data: {
                                    id: 'clx4v2z0a0000abc123def456',
                                    email: 'alice@example.com',
                                    username: 'alice42',
                                    createdAt: '2024-01-15T10:30:00.000Z',
                                    updatedAt: '2024-01-15T10:30:00.000Z',
                                },
                            },
                        },
                    },
                },
                400: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
                        },
                    },
                },
                401: {
                    description: 'Invalid credentials',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { statusCode: 401, message: 'Invalid email or password' },
                        },
                    },
                },
                429: {
                    description: 'Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
            },
        },
    },

    '/auth/refresh-token': {
        post: {
            tags: ['Authentication'],
            summary: 'Refresh the access token',
            description:
                'Uses the signed `refreshToken` cookie to issue a new `accessToken` cookie. ' +
                'Call this when the access token expires (401 response on protected routes).',
            operationId: 'refreshToken',
            parameters: [csrfHeader],
            responses: {
                200: {
                    description: 'Access token refreshed — new `accessToken` cookie is set',
                    headers: {
                        ...rateLimitHeaders,
                        'Set-Cookie': {
                            schema: { type: 'string' },
                            description: 'Refreshed `accessToken` cookie',
                        },
                    },
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/AccessTokenResponse' },
                        },
                    },
                },
                401: {
                    description: 'Missing, invalid, or expired refresh token',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: {
                                statusCode: 401,
                                message: 'Refresh token expired or invalid',
                            },
                        },
                    },
                },
                429: {
                    description: 'Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
            },
        },
    },

    '/auth/logout': {
        post: {
            tags: ['Authentication'],
            summary: 'Log out and clear session cookies',
            description:
                'Clears the `accessToken` and `refreshToken` cookies. ' +
                'No server-side token invalidation is performed (stateless JWT), ' +
                'so the access token remains valid until its natural expiry.',
            operationId: 'logout',
            parameters: [csrfHeader],
            responses: {
                200: {
                    description: 'Logged out — cookies cleared',
                    headers: {
                        ...rateLimitHeaders,
                        'Set-Cookie': {
                            schema: { type: 'string' },
                            description:
                                'Expired `accessToken` and `refreshToken` cookies to clear them',
                        },
                    },
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MessageResponse' },
                            example: { statusCode: 200, message: 'Logged out successfully' },
                        },
                    },
                },
                429: {
                    description: 'Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
            },
        },
    },
} as const;
