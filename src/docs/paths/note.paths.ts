/*
 * src/docs/paths/note.paths.ts
 * OpenAPI path definitions for all /note endpoints.
 * All endpoints require authentication (Bearer token or accessToken cookie).
 * Rate limit: 30 requests / 15 minutes per IP.
 * Mutating endpoints also require an `x-csrf-token` header.
 */

const csrfHeader = {
    in: 'header',
    name: 'x-csrf-token',
    required: true,
    schema: { type: 'string' },
    description: 'Double-submit CSRF token from `GET /auth/csrf-token`',
};

const rateLimitHeaders = {
    'X-RateLimit-Limit': {
        schema: { type: 'integer' },
        description: 'Max requests allowed in the window (30)',
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

const authErrors = {
    401: {
        description: 'Missing or invalid access token',
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { statusCode: 401, message: 'Authentication failed' },
            },
        },
    },
    403: {
        description:
            "Valid token but insufficient permissions (e.g. accessing another user's note)",
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { statusCode: 403, message: 'Access denied' },
            },
        },
    },
    429: {
        description: 'Rate limit exceeded (30 / 15 min)',
        content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
    },
};

const paginationParams = [
    {
        in: 'query',
        name: 'page',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number (1-based)',
    },
    {
        in: 'query',
        name: 'limit',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        description: 'Number of items per page',
    },
];

export const notePaths = {
    '/note': {
        post: {
            tags: ['Notes'],
            summary: 'Create a new note',
            operationId: 'createNote',
            security: [{ bearerAuth: [] }, { cookieAuth: [] }],
            parameters: [csrfHeader],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateNoteRequest' },
                        example: {
                            title: 'Meeting agenda',
                            content: 'Discuss Q3 roadmap and sprint planning.',
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Note created',
                    headers: rateLimitHeaders,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/NoteResponse' },
                            example: {
                                statusCode: 201,
                                message: 'Note created successfully',
                                data: {
                                    id: 'clx4v2z0b0001xyz789abc012',
                                    title: 'Meeting agenda',
                                    content: 'Discuss Q3 roadmap and sprint planning.',
                                    userId: 'clx4v2z0a0000abc123def456',
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
                                    { field: 'title', message: 'Title cannot be empty', value: '' },
                                ],
                            },
                        },
                    },
                },
                ...authErrors,
            },
        },

        get: {
            tags: ['Notes'],
            summary: 'List all notes for the authenticated user',
            description:
                "Returns a paginated list of the caller's notes, ordered by `createdAt` descending.",
            operationId: 'getNotes',
            security: [{ bearerAuth: [] }, { cookieAuth: [] }],
            parameters: paginationParams,
            responses: {
                200: {
                    description: 'Paginated list of notes',
                    headers: rateLimitHeaders,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/PaginatedNotesResponse' },
                            example: {
                                statusCode: 200,
                                message: 'Notes retrieved successfully',
                                data: [
                                    {
                                        id: 'clx4v2z0b0001xyz789abc012',
                                        title: 'Meeting agenda',
                                        content: 'Discuss Q3 roadmap.',
                                        userId: 'clx4v2z0a0000abc123def456',
                                        createdAt: '2024-06-01T09:00:00.000Z',
                                        updatedAt: '2024-06-01T09:00:00.000Z',
                                    },
                                ],
                                pagination: {
                                    currentPage: 1,
                                    totalPages: 5,
                                    totalItems: 48,
                                    itemsPerPage: 10,
                                    hasNext: true,
                                    hasPrev: false,
                                },
                            },
                        },
                    },
                },
                ...authErrors,
            },
        },
    },

    '/note/search': {
        get: {
            tags: ['Notes'],
            summary: 'Search notes by keyword',
            description:
                'Case-insensitive full-text search across note `title` and `content` (ILIKE). ' +
                "Returns a paginated result scoped to the authenticated user's notes.",
            operationId: 'searchNotes',
            security: [{ bearerAuth: [] }, { cookieAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'q',
                    required: true,
                    schema: { type: 'string', minLength: 1 },
                    description: 'Search keyword',
                    example: 'agenda',
                },
                ...paginationParams,
            ],
            responses: {
                200: {
                    description: 'Search results (may be empty)',
                    headers: rateLimitHeaders,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/PaginatedNotesResponse' },
                            example: {
                                statusCode: 200,
                                message: 'Notes search completed successfully',
                                data: [
                                    {
                                        id: 'clx4v2z0b0001xyz789abc012',
                                        title: 'Meeting agenda',
                                        content: 'Discuss Q3 roadmap.',
                                        userId: 'clx4v2z0a0000abc123def456',
                                        createdAt: '2024-06-01T09:00:00.000Z',
                                        updatedAt: '2024-06-01T09:00:00.000Z',
                                    },
                                ],
                                pagination: {
                                    currentPage: 1,
                                    totalPages: 1,
                                    totalItems: 1,
                                    itemsPerPage: 10,
                                    hasNext: false,
                                    hasPrev: false,
                                },
                            },
                        },
                    },
                },
                ...authErrors,
            },
        },
    },

    '/note/{id}': {
        get: {
            tags: ['Notes'],
            summary: 'Get a single note by ID',
            operationId: 'getNote',
            security: [{ bearerAuth: [] }, { cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'string' },
                    description: 'CUID of the note',
                    example: 'clx4v2z0b0001xyz789abc012',
                },
            ],
            responses: {
                200: {
                    description: 'Note found',
                    headers: rateLimitHeaders,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/NoteResponse' },
                            example: {
                                statusCode: 200,
                                message: 'Note retrieved successfully',
                                data: {
                                    id: 'clx4v2z0b0001xyz789abc012',
                                    title: 'Meeting agenda',
                                    content: 'Discuss Q3 roadmap.',
                                    userId: 'clx4v2z0a0000abc123def456',
                                    createdAt: '2024-06-01T09:00:00.000Z',
                                    updatedAt: '2024-06-01T09:00:00.000Z',
                                },
                            },
                        },
                    },
                },
                404: {
                    description: 'Note not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { statusCode: 404, message: 'Note not found' },
                        },
                    },
                },
                ...authErrors,
            },
        },

        put: {
            tags: ['Notes'],
            summary: 'Update a note',
            description:
                "Partially or fully replaces a note's `title` and/or `content`. At least one field is required.",
            operationId: 'updateNote',
            security: [{ bearerAuth: [] }, { cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'string' },
                    description: 'CUID of the note',
                    example: 'clx4v2z0b0001xyz789abc012',
                },
                csrfHeader,
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/UpdateNoteRequest' },
                        examples: {
                            titleOnly: {
                                summary: 'Update title only',
                                value: { title: 'Revised agenda' },
                            },
                            contentOnly: {
                                summary: 'Update content only',
                                value: { content: 'New content here.' },
                            },
                            both: {
                                summary: 'Update both fields',
                                value: { title: 'Final agenda', content: 'Q4 planning session.' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Note updated',
                    headers: rateLimitHeaders,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/NoteResponse' },
                            example: {
                                statusCode: 200,
                                message: 'Note updated successfully',
                                data: {
                                    id: 'clx4v2z0b0001xyz789abc012',
                                    title: 'Revised agenda',
                                    content: 'Discuss Q3 roadmap.',
                                    userId: 'clx4v2z0a0000abc123def456',
                                    createdAt: '2024-06-01T09:00:00.000Z',
                                    updatedAt: '2024-06-10T11:45:00.000Z',
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
                404: {
                    description: 'Note not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { statusCode: 404, message: 'Note not found' },
                        },
                    },
                },
                ...authErrors,
            },
        },

        delete: {
            tags: ['Notes'],
            summary: 'Delete a note',
            operationId: 'deleteNote',
            security: [{ bearerAuth: [] }, { cookieAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'string' },
                    description: 'CUID of the note',
                    example: 'clx4v2z0b0001xyz789abc012',
                },
                csrfHeader,
            ],
            responses: {
                200: {
                    description: 'Note deleted',
                    headers: rateLimitHeaders,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/NoteResponse' },
                            example: {
                                statusCode: 200,
                                message: 'Note deleted successfully',
                                data: {
                                    id: 'clx4v2z0b0001xyz789abc012',
                                    title: 'Meeting agenda',
                                    content: 'Discuss Q3 roadmap.',
                                    userId: 'clx4v2z0a0000abc123def456',
                                    createdAt: '2024-06-01T09:00:00.000Z',
                                    updatedAt: '2024-06-01T09:00:00.000Z',
                                },
                            },
                        },
                    },
                },
                404: {
                    description: 'Note not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { statusCode: 404, message: 'Note not found' },
                        },
                    },
                },
                ...authErrors,
            },
        },
    },
} as const;
