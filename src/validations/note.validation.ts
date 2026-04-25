/*
 * src/validations/note.validation.ts
 * Zod schemas and request-handler middleware for note routes.
 */

import { z } from 'zod';
import type { RequestHandler } from 'express';
import { validateBody, validateQuery, validateParams } from '../lib/validate';

export const createNoteSchema = z.object({
    title: z
        .string({ error: 'Title is required' })
        .trim()
        .min(1, 'Title cannot be empty')
        .max(255, 'Title must be between 1 and 255 characters'),
    content: z.string({ error: 'Content is required' }).trim().min(1, 'Content cannot be empty'),
});

export const updateNoteSchema = z
    .object({
        title: z.string().trim().min(1, 'Title cannot be empty').max(255).optional(),
        content: z.string().trim().min(1, 'Content cannot be empty').optional(),
    })
    .refine((data) => data.title !== undefined || data.content !== undefined, {
        message: 'At least one field (title or content) must be provided',
    });

// Validates pagination and search query params on GET /note and GET /note/search
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
    q: z.string().trim().min(1, 'Search query cannot be empty').max(200).optional(),
});

// Validates that :id params are a valid CUID
export const noteIdParamSchema = z.object({
    id: z
        .string({ error: 'Note ID is required' })
        .regex(/^c[a-z0-9]{24}$/, 'Invalid note ID format'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
export type NoteIdParamInput = z.infer<typeof noteIdParamSchema>;

export const createNoteValidation: RequestHandler = validateBody(createNoteSchema);
export const updateNoteValidation: RequestHandler = validateBody(updateNoteSchema);
export const paginationQueryValidation: RequestHandler = validateQuery(paginationQuerySchema);
export const noteIdParamValidation: RequestHandler = validateParams(noteIdParamSchema);
