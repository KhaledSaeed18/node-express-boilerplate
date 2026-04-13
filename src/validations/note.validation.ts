/*
 * src/validations/note.validation.ts
 * Zod schemas and request-handler middleware for note routes.
 */

import { z } from 'zod';
import type { RequestHandler } from 'express';
import { validateBody } from '../lib/validate';

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

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const createNoteValidation: RequestHandler = validateBody(createNoteSchema);
export const updateNoteValidation: RequestHandler = validateBody(updateNoteSchema);
