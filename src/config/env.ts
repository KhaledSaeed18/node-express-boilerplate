/*
 * src/config/env.ts
 * Validated, typed configuration derived from environment variables.
 * Calls dotenv.config() before parsing so this module is self-contained —
 * importing it is sufficient to both load the .env file and validate all vars.
 * The process will exit immediately with a clear error if any required variable
 * is missing or malformed, preventing silent undefined usage at runtime.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    API_VERSION: z.string().default('v1'),
    BASE_URL: z.string().default('/api'),

    DATABASE_URL: z.url('DATABASE_URL must be a valid URL'),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_EXPIRE_TIME: z.string().default('15m'),
    JWT_REFRESH_EXPIRE_TIME: z.string().default('7d'),

    CLIENT_URL: z.url('CLIENT_URL must be a valid URL'),

    BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
});

export type Config = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:');
    // eslint-disable-next-line no-console
    console.error(z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
}

export const config = parsed.data;
