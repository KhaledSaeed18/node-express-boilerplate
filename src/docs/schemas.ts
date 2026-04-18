/*
 * src/docs/schemas.ts
 * OpenAPI 3.1.0 component schemas — mirrors Prisma models, DTOs, and
 * all request/response shapes used across the API.
 */

export const schemas = {
    // ──── Domain models ──────────────────────────────────────────────────────
    User: {
        type: 'object',
        description: 'Authenticated user record (password excluded)',
        required: ['id', 'email', 'username', 'createdAt', 'updatedAt'],
        properties: {
            id: {
                type: 'string',
                description: 'CUID primary key',
                example: 'clx4v2z0a0000abc123def456',
            },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            username: {
                type: 'string',
                description: 'Auto-generated unique username',
                example: 'alice42',
            },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-06-20T14:00:00.000Z' },
        },
    },

    Note: {
        type: 'object',
        description: 'Note record owned by a user',
        required: ['id', 'title', 'content', 'userId', 'createdAt', 'updatedAt'],
        properties: {
            id: {
                type: 'string',
                description: 'CUID primary key',
                example: 'clx4v2z0b0001xyz789abc012',
            },
            title: { type: 'string', maxLength: 255, example: 'Meeting agenda' },
            content: { type: 'string', example: 'Discuss Q3 roadmap and sprint planning.' },
            userId: {
                type: 'string',
                description: 'Owner user ID',
                example: 'clx4v2z0a0000abc123def456',
            },
            createdAt: { type: 'string', format: 'date-time', example: '2024-06-01T09:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-06-10T11:45:00.000Z' },
        },
    },

    // ──── Auth request bodies ─────────────────────────────────────────────────
    SignUpRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: {
                type: 'string',
                format: 'email',
                example: 'alice@example.com',
                description: 'Disposable / blocked e-mail domains are rejected',
            },
            password: {
                type: 'string',
                minLength: 8,
                maxLength: 30,
                example: 'Str0ng!Pass',
                description:
                    'Must contain at least one uppercase letter, one lowercase letter, one digit, and one special character. Common passwords are rejected.',
            },
        },
    },

    SignInRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            password: { type: 'string', minLength: 1, example: 'Str0ng!Pass' },
        },
    },

    // ──── Note request bodies ─────────────────────────────────────────────────
    CreateNoteRequest: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 255, example: 'Meeting agenda' },
            content: {
                type: 'string',
                minLength: 1,
                example: 'Discuss Q3 roadmap and sprint planning.',
            },
        },
    },

    UpdateNoteRequest: {
        type: 'object',
        description: 'At least one of `title` or `content` must be supplied',
        minProperties: 1,
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 255, example: 'Updated agenda' },
            content: { type: 'string', minLength: 1, example: 'Revised notes.' },
        },
    },

    // ──── Common response shapes ──────────────────────────────────────────────
    PaginationMeta: {
        type: 'object',
        description: 'Pagination metadata returned with list responses',
        required: ['currentPage', 'totalPages', 'totalItems', 'itemsPerPage', 'hasNext', 'hasPrev'],
        properties: {
            currentPage: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 5 },
            totalItems: { type: 'integer', example: 48 },
            itemsPerPage: { type: 'integer', example: 10 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
        },
    },

    // ──── Success response envelopes ──────────────────────────────────────────
    CsrfTokenResponse: {
        type: 'object',
        required: ['csrfToken'],
        properties: {
            csrfToken: {
                type: 'string',
                description:
                    'Double-submit CSRF token — include in `x-csrf-token` header for all mutating requests',
                example: 'abc123xyz...',
            },
        },
    },

    UserResponse: {
        type: 'object',
        required: ['statusCode', 'message', 'data'],
        properties: {
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Sign in successful' },
            data: { $ref: '#/components/schemas/User' },
        },
    },

    NoteResponse: {
        type: 'object',
        required: ['statusCode', 'message', 'data'],
        properties: {
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Note retrieved successfully' },
            data: { $ref: '#/components/schemas/Note' },
        },
    },

    PaginatedNotesResponse: {
        type: 'object',
        required: ['statusCode', 'message', 'data', 'pagination'],
        properties: {
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Notes retrieved successfully' },
            data: {
                type: 'array',
                items: { $ref: '#/components/schemas/Note' },
            },
            pagination: { $ref: '#/components/schemas/PaginationMeta' },
        },
    },

    AccessTokenResponse: {
        type: 'object',
        required: ['statusCode', 'message', 'data'],
        properties: {
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Token refreshed successfully' },
            data: {
                type: 'object',
                required: ['accessToken'],
                properties: {
                    accessToken: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                },
            },
        },
    },

    MessageResponse: {
        type: 'object',
        required: ['statusCode', 'message'],
        properties: {
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Logged out successfully' },
        },
    },

    // ──── Error response envelopes ────────────────────────────────────────────
    ErrorResponse: {
        type: 'object',
        required: ['statusCode', 'message'],
        properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Something went wrong' },
        },
    },

    ValidationErrorResponse: {
        type: 'object',
        required: ['statusCode', 'message', 'errors'],
        properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['field', 'message'],
                    properties: {
                        field: { type: 'string', example: 'email' },
                        message: { type: 'string', example: 'Invalid email format' },
                        value: {
                            description: 'The invalid value that was submitted',
                            example: 'not-an-email',
                        },
                    },
                },
            },
        },
    },
} as const;
