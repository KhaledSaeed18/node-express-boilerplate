/*
 * src/validations/auth.validation.ts
 * Zod schemas and request-handler middleware for authentication routes.
 */

import { z } from 'zod';
import type { RequestHandler } from 'express';
import { validateBody } from '../lib/validate';
import { BLOCKED_DOMAINS, COMMON_PASSWORDS } from '../constants';

export const signupSchema = z.object({
    email: z
        .string({ error: 'Email is required' })
        .trim()
        .toLowerCase()
        .check(z.email('Invalid email format'))
        .refine(
            (email) => !BLOCKED_DOMAINS.includes(email.split('@')[1] ?? ''),
            'Email domain not allowed',
        ),
    password: z
        .string({ error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters')
        .max(30, 'Password must not be more than 30 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/\d/, 'Password must contain at least one number')
        .regex(/[\W_]/, 'Password must contain at least one special character')
        .refine((val) => !COMMON_PASSWORDS.includes(val), 'Password is too common'),
});

export const signinSchema = z.object({
    email: z
        .string({ error: 'Email is required' })
        .trim()
        .toLowerCase()
        .check(z.email('Invalid email format')),
    password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;

export const signupValidation: RequestHandler = validateBody(signupSchema);
export const signinValidation: RequestHandler = validateBody(signinSchema);
